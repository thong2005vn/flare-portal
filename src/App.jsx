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

      // SỬA LỖI TẠI ĐÂY: Kiểm tra kỹ cấu trúc rewardStates để tránh treo app
      let totalRewardWei = 0n;
      if (rewardStates && Array.isArray(rewardStates)) {
        rewardStates.forEach(epochData => {
          if (epochData && epochData[0] && Array.isArray(epochData[0])) {
            epochData[0].forEach(amount => {
              totalRewardWei += BigInt(amount || 0);
            });
          }
        });
      }

      const del = await wnat.delegatesOf(pda).catch(() => [[], [], 0n, 0n]);
      
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
      console.error("Lỗi cập nhật:", e);
      setStatus("❌ Lỗi đồng bộ dữ liệu");
    }
  }, [getProvider]);

  // Tự động kết nối lại nếu ví đã được cấp quyền trước đó
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accs => {
        if (accs.length > 0) connect();
      });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) return;
    try {
      const p = getProvider();
      const signer = await p.getSigner();
      const addr = await signer.getAddress();
      const csm = new ethers.Contract(FLARE_CONFIG.CLAIM_SETUP_MANAGER, ABIS.CLAIM_SETUP_MANAGER, signer);
      const pda = await csm.accountToDelegationAccount(addr);
      
      setAccount(addr);
      setPdaAddress(pda);
      refreshData(addr, pda);
      setStatus("Đã kết nối");
    } catch (e) {
      console.error(e);
      setStatus("❌ Kết nối ví thất bại");
    }
  };

  // Các hàm execute, handleWrap, v.v. giữ nguyên như cũ...
  const execute = async (label, action) => {
    try {
      setStatus(`⏳ ${label}...`);
      const tx = await action();
      if (tx) {
        await tx.wait();
        setStatus(`✅ ${label} thành công!`);
        setTimeout(() => refreshData(account, pdaAddress), 1500);
      }
    } catch (e) {
      setStatus(`❌ Lỗi: ${e.reason || "Giao dịch thất bại"}`);
    }
  };

  const handleWrap = (isWrap) => execute(isWrap ? "Wrap" : "Unwrap", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, s);
    return isWrap ? w.deposit({ value: ethers.parseEther(walletAmount) }) : w.withdraw(ethers.parseEther(walletAmount));
  });

  const handleToPDA = () => execute("Nạp PDA", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount));
  });

  const handleWithdrawPDA = () => execute("Rút PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(FLARE_CONFIG.CLAIM_SETUP_MANAGER, ABIS.CLAIM_SETUP_MANAGER, s);
    return csm.withdraw(ethers.parseEther(pdaAmount));
  });

  const handleClaim = () => execute("Claim", async () => {
    const s = await (getProvider()).getSigner();
    const r = new ethers.Contract(FLARE_CONFIG.REWARD_MANAGER, ABIS.REWARD_MANAGER, s);
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    return r.claim(pdaAddress, pdaAddress, end, true, []);
  });

  const handleDelegate = (target, pct) => execute(pct === 0 ? "Hủy ủy quyền" : "Ủy quyền", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(FLARE_CONFIG.WNAT, ABIS.WNAT, s);
    return w.delegate(target, pct * 100);
  });

  const filteredProviders = useMemo(() => 
    PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())), 
  [providerSearch]);

  const styles = {
    container: { boxSizing: 'border-box', padding: "12px", width: "100%", maxWidth: "450px", margin: "0 auto", background: COLORS.DARK, color: "white", minHeight: "100vh", fontFamily: "sans-serif" },
    card: { background: COLORS.SURFACE, padding: "16px", borderRadius: "20px", marginBottom: "12px", border: "1px solid #1f1f1f" },
    label: { fontSize: "10px", color: COLORS.TEXT_MUTE, fontWeight: "800", marginBottom: "8px", textTransform: "uppercase" },
    input: { flex: 1, padding: "12px", borderRadius: "12px", background: "#080808", color: "white", border: "1px solid #222", fontSize: "16px", width: "100%" },
    btn: { padding: "12px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }
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
            <div style={styles.label}>VÍ CHÍNH</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontSize:18, fontWeight:'bold'}}>
                <span>{Number(balances.flr).toFixed(2)} FLR</span>
                <span>{Number(balances.wflr).toLocaleString()} WFLR</span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input type="number" value={walletAmount} onChange={(e)=>setWalletAmount(e.target.value)} style={styles.input} placeholder="Số lượng..."/>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                <button onClick={()=>handleWrap(true)} style={{...styles.btn, background:'#222', color:'white'}}>WRAP</button>
                <button onClick={()=>handleWrap(false)} style={{...styles.btn, background:'#222', color:'white'}}>UNWRAP</button>
                <button onClick={handleToPDA} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>NẠP PDA</button>
            </div>
          </section>

          <section style={{...styles.card, border: `1px solid ${COLORS.PINK}44`}}>
            <div style={{...styles.label, color: COLORS.PINK}}>PDA ACCOUNT</div>
            <div style={{fontSize:24, fontWeight:'900', marginBottom:15}}>{Number(balances.pdaWflr).toLocaleString()} WFLR</div>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input type="number" value={pdaAmount} onChange={(e)=>setPdaAmount(e.target.value)} style={styles.input} placeholder="Rút..."/>
            </div>
            <button onClick={handleWithdrawPDA} style={{...styles.btn, width:'100%', background:'transparent', color: COLORS.AMBER, border: `1px solid ${COLORS.AMBER}66`, marginBottom:15}}>RÚT VỀ VÍ CHÍNH</button>
            <div style={{background:'rgba(227, 24, 100, 0.1)', padding:15, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <div style={{fontSize:10, color: COLORS.TEXT_MUTE}}>REWARDS</div>
                    <div style={{color: COLORS.PINK, fontSize:18, fontWeight:'900'}}>+{Number(balances.reward).toFixed(2)} FLR</div>
                </div>
                <button onClick={handleClaim} style={{...styles.btn, background: COLORS.PINK, color:'white', padding: '10px 20px'}}>CLAIM</button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.label}>ỦY QUYỀN ({delegations.length}/2)</div>
            {delegations.map((d, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px 0'}}>
                <span>{d.name} ({d.pct}%)</span>
                <button onClick={()=>handleDelegate(d.addr, 0)} style={{color:'#ff4444', background:'none', border:'none', cursor:'pointer'}}>✕ GỠ</button>
              </div>
            ))}
            <input 
              type="text" 
              placeholder="Thêm Provider..." 
              onFocus={()=>setShowDropdown(true)} 
              onChange={(e)=>setProviderSearch(e.target.value)} 
              style={{...styles.input, marginTop:10}}
            />
            {showDropdown && (
              <div style={{maxHeight:100, overflowY:'auto', background:'#111', borderRadius:10, marginTop:5}}>
                {filteredProviders.map(p => (
                  <div key={p.address} onClick={()=>{handleDelegate(p.address, 50); setShowDropdown(false);}} style={{padding:10, cursor:'pointer', borderBottom:'1px solid #222'}}>{p.name}</div>
                ))}
              </div>
            )}
          </section>

          <footer style={{textAlign:'center'}}><span style={{fontSize: 10, color: COLORS.PINK}}>{status.toUpperCase()}</span></footer>
        </>
      )}
    </div>
  );
}
