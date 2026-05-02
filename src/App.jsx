import { useState, useCallback, useMemo, useEffect } from "react";
import { ethers } from "ethers";
import { FLARE_CONFIG, ABIS, PROVIDERS, COLORS } from "./constants";

export default function FlarePortal() {
  const [account, setAccount] = useState("");
  const [pdaAddress, setPdaAddress] = useState("");
  const [balances, setBalances] = useState({ flr: "0", wflr: "0", pdaWflr: "0", reward: "0" });
  const [delegations, setDelegations] = useState([]);
  const [walletAmount, setWalletAmount] = useState("");
  const [pdaAmount, setPdaAmount] = useState("");
  const [status, setStatus] = useState("Sẵn sàng");
  const [providerSearch, setProviderSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const getProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  const refreshData = useCallback(async (addr, pda) => {
    if (!addr || !pda) return;
    try {
      const p = getProvider();
      const wnat = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, p);
      const rew = new ethers.Contract(FLARE_CONFIG.REWARD_MANAGER, ABIS.REWARD_MANAGER, p);

      const [f, w, pw, rewardStates] = await Promise.all([
        p.getBalance(addr),
        wnat.balanceOf(addr),
        wnat.balanceOf(pda),
        rew.getStateOfRewards(pda).catch(() => [])
      ]);

      const del = await wnat.delegatesOf(pda).catch(() => [[], [], 0n, 0n]);
      
      let totalRewardWei = 0n;
      if (Array.isArray(rewardStates)) {
        rewardStates.forEach(epochArray => {
          if (epochArray) {
            epochArray.forEach(state => { 
              totalRewardWei += state.amount ? BigInt(state.amount) : 0n; 
            });
          }
        });
      }

      setBalances({
        flr: ethers.formatEther(f),
        wflr: ethers.formatEther(w),
        pdaWflr: ethers.formatEther(pw),
        reward: ethers.formatEther(totalRewardWei)
      });

      const [dA, bA, , count] = del;
      const currentDels = [];
      for (let i = 0; i < Number(count); i++) {
        if (dA[i] && dA[i] !== ethers.ZeroAddress) {
          const pInfo = PROVIDERS.find(prov => prov.address.toLowerCase() === dA[i].toLowerCase());
          currentDels.push({ 
            name: pInfo ? pInfo.name : "Unknown", 
            addr: dA[i], 
            pct: Number(bA[i]) / 100 
          });
        }
      }
      setDelegations(currentDels);
    } catch (e) {
      console.error("Lỗi cập nhật dữ liệu:", e);
    }
  }, [getProvider]);

  useEffect(() => {
    if (account && pdaAddress) {
      const interval = setInterval(() => refreshData(account, pdaAddress), 30000);
      return () => clearInterval(interval);
    }
  }, [account, pdaAddress, refreshData]);

  const execute = async (label, action) => {
    try {
      setStatus(`⏳ ${label}...`);
      const tx = await action();
      if (tx) {
        await tx.wait();
        setStatus(`✅ ${label} thành công!`);
        setWalletAmount("");
        setPdaAmount("");
        setTimeout(() => refreshData(account, pdaAddress), 1500);
      }
    } catch (e) {
      console.error(e);
      setStatus(`❌ Lỗi: ${e.reason || "Giao dịch thất bại"}`);
    }
  };

  const connect = async () => {
    if (!window.ethereum) return alert("Vui lòng cài đặt MetaMask!");
    try {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await (await getProvider()).getSigner();
      const csm = new ethers.Contract(FLARE_CONFIG.CLAIM_SETUP_MANAGER, ABIS.CLAIM_SETUP_MANAGER, signer);
      const pda = await csm.accountToDelegationAccount(accs[0]);
      setAccount(accs[0]);
      setPdaAddress(pda);
      refreshData(accs[0], pda);
    } catch (e) {
      setStatus("❌ Kết nối ví thất bại");
    }
  };

  const handleWrap = (isWrap) => execute(isWrap ? "Wrap" : "Unwrap", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, s);
    const val = ethers.parseEther(walletAmount || "0");
    return isWrap ? w.deposit({ value: val }) : w.withdraw(val);
  });

  const handleToPDA = () => execute("Nạp vào PDA", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount || "0"));
  });

  const handleWithdrawPDA = () => execute("Rút từ PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(FLARE_CONFIG.CLAIM_SETUP_MANAGER, ABIS.CLAIM_SETUP_MANAGER, s);
    return csm.withdraw(ethers.parseEther(pdaAmount || "0"));
  });

  // PHẦN SỬA ĐỔI CHÍNH: Gọi claim qua ClaimSetupManager thay vì trực tiếp Reward Manager
  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(FLARE_CONFIG.CLAIM_SETUP_MANAGER, ABIS.CLAIM_SETUP_MANAGER, s);
    const r = new ethers.Contract(FLARE_CONFIG.REWARD_MANAGER, ABIS.REWARD_MANAGER, s);
    
    const [start, end] = await r.getRewardEpochIdsWithClaimableRewards();
    
    // Thực hiện claim tất cả các epoch hiện có thông qua Manager
    // Tham số: (địa chỉ PDA, địa chỉ nhận thưởng, epoch cuối, tự động wrap)
    return csm.claim(pdaAddress, pdaAddress, end, true, { gasLimit: 1000000 });
  });

  const handleDelegate = (target, pct = 50) => execute(pct === 0 ? "Hủy ủy quyền" : "Ủy quyền", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, s);
    return w.delegate(target, pct * 100);
  });

  const filteredProviders = useMemo(() => 
    PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())), 
  [providerSearch]);

  const styles = {
    container: { boxSizing: 'border-box', padding: "12px", width: "100%", maxWidth: "450px", margin: "0 auto", background: COLORS.DARK, color: "white", minHeight: "100vh", fontFamily: "-apple-system, sans-serif" },
    card: { background: COLORS.SURFACE, padding: "16px", borderRadius: "20px", marginBottom: "12px", border: "1px solid #1f1f1f" },
    label: { fontSize: "10px", color: COLORS.TEXT_MUTE, fontWeight: "800", marginBottom: "8px", textTransform: "uppercase" },
    input: { flex: 1, padding: "12px", borderRadius: "12px", background: "#080808", color: "white", border: "1px solid #222", fontSize: "16px", width: "100%" },
    btn: { padding: "12px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: '0.2s' }
  };

  return (
    <div style={styles.container}>
      <header style={{textAlign:'center', padding: '20px 0'}}>
        <h2 style={{color: COLORS.PINK, margin: 0, fontWeight: 900}}>OZPRO <span style={{fontWeight:300, color:'#fff'}}>FLR PORTAL</span></h2>
      </header>
      
      {!account ? (
        <button onClick={connect} style={{...styles.btn, width:'100%', background: COLORS.PINK, color:'white', fontSize: '14px', height: '55px'}}>KẾT NỐI VÍ METAMASK</button>
      ) : (
        <>
          <section style={styles.card}>
            <div style={styles.label}>VÍ CHÍNH (WALLET)</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontSize:18, fontWeight:'bold'}}>
                <span>{Number(balances.flr).toFixed(2)} <small style={{fontSize:10, color:COLORS.TEXT_MUTE}}>FLR</small></span>
                <span>{Number(balances.wflr).toLocaleString()} <small style={{fontSize:10, color:COLORS.TEXT_MUTE}}>WFLR</small></span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input type="number" value={walletAmount} onChange={(e)=>setWalletAmount(e.target.value)} style={styles.input} placeholder="Nhập số lượng..."/>
                <button onClick={() => setWalletAmount(balances.flr)} style={{...styles.btn, background: COLORS.PINK, color:'white', padding: '0 15px'}}>MAX</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                <button onClick={()=>handleWrap(true)} style={{...styles.btn, background:'#222', color:'white'}}>WRAP</button>
                <button onClick={()=>handleWrap(false)} style={{...styles.btn, background:'#222', color:'white'}}>UNWRAP</button>
                <button onClick={handleToPDA} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>NẠP PDA</button>
            </div>
          </section>

          <section style={{...styles.card, border: `1px solid ${COLORS.PINK}33`}}>
            <div style={{...styles.label, color: COLORS.PINK}}>TÀI KHOẢN ỦY QUYỀN (PDA)</div>
            <div style={{fontSize:24, fontWeight:'900', marginBottom:15}}>{Number(balances.pdaWflr).toLocaleString()} <small style={{fontSize:10, color: COLORS.TEXT_MUTE}}>WFLR</small></div>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input type="number" value={pdaAmount} onChange={(e)=>setPdaAmount(e.target.value)} style={styles.input} placeholder="Số lượng rút..."/>
                <button onClick={() => setPdaAmount(balances.pdaWflr)} style={{...styles.btn, background: COLORS.AMBER, color:'black', padding: '0 15px'}}>MAX</button>
            </div>
            <button onClick={handleWithdrawPDA} style={{...styles.btn, width:'100%', background:'transparent', color: COLORS.AMBER, border: `1px solid ${COLORS.AMBER}66`, marginBottom:15}}>⤺ RÚT VỀ VÍ CHÍNH</button>
            
            <div style={{background:'rgba(227, 24, 100, 0.1)', padding:15, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <div style={{fontSize:10, color: COLORS.TEXT_MUTE, fontWeight:'bold'}}>PHẦN THƯỞNG CHỜ NHẬN</div>
                    <div style={{color: COLORS.PINK, fontSize:18, fontWeight:'900'}}>+{Number(balances.reward).toFixed(2)} FLR</div>
                </div>
                <button onClick={handleClaim} style={{...styles.btn, background: COLORS.PINK, color:'white', padding: '10px 20px'}}>CLAIM</button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.label}>ĐANG ỦY QUYỀN ({delegations.length}/2)</div>
            {delegations.length === 0 && <div style={{fontSize: 12, color: COLORS.TEXT_MUTE, textAlign: 'center', padding: '10px 0'}}>Chưa có ủy quyền nào</div>}
            {delegations.map((d, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom: i === delegations.length - 1 ? 'none' : '1px solid #222'}}>
                <div>
                  <div style={{fontWeight:'bold', fontSize:14}}>{d.name}</div>
                  <div style={{fontSize:11, color: COLORS.PINK, fontWeight:'bold'}}>{d.pct}% Power</div>
                </div>
                <button onClick={()=>handleDelegate(d.addr, 0)} style={{background:'#ff444422', border:'none', color:'#ff4444', borderRadius:10, padding:'5px 12px', fontWeight:'bold'}}>✕ GỠ</button>
              </div>
            ))}
            
            <div style={{position:'relative', marginTop:15}}>
                <input 
                  type="text" 
                  placeholder="Tìm & Thêm FTSO Provider..." 
                  value={providerSearch} 
                  onFocus={()=>setShowDropdown(true)} 
                  onChange={(e)=>setProviderSearch(e.target.value)} 
                  style={styles.input}
                />
                {showDropdown && (
                    <div style={{position:'absolute', bottom:'110%', left:0, right:0, background:'#181818', borderRadius:15, border:'1px solid #333', maxHeight:160, overflowY:'auto', zIndex:100, boxShadow: '0 -10px 20px rgba(0,0,0,0.5)'}}>
                        {filteredProviders.map(p => (
                            <div key={p.address} onClick={()=>{handleDelegate(p.address, 50); setShowDropdown(false);}} style={{padding:12, borderBottom:'1px solid #222', fontSize:13, display:'flex', justifyContent:'space-between', cursor:'pointer'}}>
                                <span>{p.name}</span>
                                <span style={{color:COLORS.PINK, fontWeight:'bold'}}>+ 50%</span>
                            </div>
                        ))}
                    </div>
                )}
                {showDropdown && <div onClick={()=>setShowDropdown(false)} style={{position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:90}}></div>}
            </div>
          </section>

          <footer style={{textAlign:'center', paddingBottom: 20}}>
            <span style={{fontSize: 10, color: COLORS.PINK, fontWeight: 'bold', letterSpacing: 1.5}}>{status.toUpperCase()}</span>
          </footer>
        </>
      )}
    </div>
  );
}
