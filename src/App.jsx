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
  const [countdown, setCountdown] = useState("");

  // 1. Khởi tạo Provider (Sử dụng useMemo để tránh re-render liên tục gây treo app)
  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // 2. Hàm chuẩn hóa địa chỉ (Sửa lỗi Checksum như trong image_f0989f.jpg)
  const safeAddress = (addr) => {
    try {
      return ethers.getAddress(addr);
    } catch (e) {
      console.error("Địa chỉ sai định dạng:", addr);
      return addr;
    }
  };

  // 3. Cập nhật dữ liệu số dư
  const refreshData = useCallback(async (addr, pda) => {
    if (!addr || !pda || !provider) return;
    try {
      const wnat = new ethers.Contract(safeAddress(FLARE_CONFIG.WNAT), ABIS.WNAT, provider);
      const rew = new ethers.Contract(safeAddress(FLARE_CONFIG.REWARD_MANAGER), ABIS.REWARD_MANAGER, provider);

      const [f, w, pw, rewardStates] = await Promise.all([
        provider.getBalance(addr),
        wnat.balanceOf(addr),
        wnat.balanceOf(pda),
        rew.getStateOfRewards(pda).catch(() => [])
      ]);

      const del = await wnat.delegatesOf(pda).catch(() => [[], [], 0n, 0n]);
      
      let totalRewardWei = 0n;
      if (Array.isArray(rewardStates)) {
        rewardStates.forEach(epoch => {
          if (epoch && epoch.rewardAmounts) {
            epoch.rewardAmounts.forEach(amt => totalRewardWei += BigInt(amt));
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
          const pInfo = PROVIDERS.find(p => p.address.toLowerCase() === dA[i].toLowerCase());
          currentDels.push({ name: pInfo ? pInfo.name : "Unknown", addr: dA[i], pct: Number(bA[i]) / 100 });
        }
      }
      setDelegations(currentDels);
    } catch (e) {
      console.error("Lỗi Refresh:", e);
    }
  }, [provider]);

  // 4. Đồng hồ đếm ngược (Chạy ngầm, không chặn UI)
  const initCountdown = useCallback(async () => {
    try {
      if (!provider) return;
      const ftso = new ethers.Contract(safeAddress(FLARE_CONFIG.FTSO_MANAGER), ABIS.FTSO_MANAGER, provider);
      const [config, currentEpoch] = await Promise.all([
        ftso.getRewardEpochConfiguration(),
        ftso.getCurrentRewardEpoch()
      ]);
      
      const endTs = Number(config[0]) + (Number(currentEpoch) + 1) * Number(config[1]);
      
      const update = () => {
        const diff = endTs - Math.floor(Date.now() / 1000);
        if (diff <= 0) return setCountdown("Đang chuyển Epoch...");
        const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
        setCountdown(`${d}d ${h}h ${m}m ${s}s`);
      };
      update();
      return setInterval(update, 1000);
    } catch (e) {
      setCountdown("Lỗi đồng hồ");
    }
  }, [provider]);

  // 5. Kết nối ví (Xử lý await signer cực kỳ cẩn thận)
  const connect = async () => {
    if (!window.ethereum) return alert("Vui lòng cài đặt MetaMask!");
    try {
      setStatus("⏳ Đang kết nối...");
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner(); 
      
      const csm = new ethers.Contract(safeAddress(FLARE_CONFIG.CLAIM_SETUP_MANAGER), ABIS.CLAIM_SETUP_MANAGER, signer);
      const pda = await csm.accountToDelegationAccount(accs[0]);
      
      setAccount(accs[0]);
      setPdaAddress(pda);
      refreshData(accs[0], pda);
      setStatus("Sẵn sàng");
    } catch (e) {
      console.error(e);
      setStatus("❌ Kết nối thất bại");
    }
  };

  // Effects
  useEffect(() => {
    let timer;
    if (account) initCountdown().then(t => timer = t);
    return () => clearInterval(timer);
  }, [account, initCountdown]);

  useEffect(() => {
    if (account && pdaAddress) {
      const interval = setInterval(() => refreshData(account, pdaAddress), 30000);
      return () => clearInterval(interval);
    }
  }, [account, pdaAddress, refreshData]);

  // Giao dịch (Mẫu chung cho các nút bấm)
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
      setStatus(`❌ ${e.reason || "Giao dịch bị hủy"}`);
    }
  };

  const handleWrap = (isWrap) => execute(isWrap ? "Wrap" : "Unwrap", async () => {
    const s = await provider.getSigner();
    const w = new ethers.Contract(safeAddress(FLARE_CONFIG.WNAT), ABIS.WNAT, s);
    const val = ethers.parseEther(walletAmount || "0");
    return isWrap ? w.deposit({ value: val }) : w.withdraw(val);
  });

  const handleToPDA = () => execute("Nạp vào PDA", async () => {
    const s = await provider.getSigner();
    const w = new ethers.Contract(safeAddress(FLARE_CONFIG.WNAT), ABIS.WNAT, s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount || "0"));
  });

  const handleWithdrawPDA = () => execute("Rút từ PDA", async () => {
    const s = await provider.getSigner();
    const csm = new ethers.Contract(safeAddress(FLARE_CONFIG.CLAIM_SETUP_MANAGER), ABIS.CLAIM_SETUP_MANAGER, s);
    return csm.withdraw(ethers.parseEther(pdaAmount || "0"));
  });

  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await provider.getSigner();
    const r = new ethers.Contract(safeAddress(FLARE_CONFIG.REWARD_MANAGER), ABIS.REWARD_MANAGER, s);
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    return r.claim(pdaAddress, pdaAddress, end, true, []);
  });

  const handleDelegate = (target, pct = 50) => execute(pct === 0 ? "Gỡ" : "Ủy quyền", async () => {
    const s = await provider.getSigner();
    const w = new ethers.Contract(safeAddress(FLARE_CONFIG.WNAT), ABIS.WNAT, s);
    return w.delegate(target, pct * 100);
  });

  const filteredProviders = useMemo(() => 
    PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())), 
  [providerSearch]);

  const styles = {
    container: { padding: "12px", maxWidth: "450px", margin: "0 auto", background: COLORS.DARK, color: "white", minHeight: "100vh", fontFamily: "sans-serif" },
    card: { background: COLORS.SURFACE, padding: "16px", borderRadius: "20px", marginBottom: "12px", border: "1px solid #1f1f1f" },
    label: { fontSize: "10px", color: COLORS.TEXT_MUTE, fontWeight: "bold", marginBottom: "8px" },
    input: { flex: 1, padding: "12px", borderRadius: "12px", background: "#080808", color: "white", border: "1px solid #222" },
    btn: { padding: "12px", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer" }
  };

  return (
    <div style={styles.container}>
      <header style={{textAlign:'center', padding: '20px 0'}}>
        <h2 style={{color: COLORS.PINK, fontWeight: 900}}>OZPRO <span style={{fontWeight:300, color:'#fff'}}>FLR PORTAL</span></h2>
      </header>

      {!account ? (
        <button onClick={connect} style={{...styles.btn, width:'100%', background: COLORS.PINK, color:'white', height: '55px'}}>KẾT NỐI VÍ METAMASK</button>
      ) : (
        <>
          <section style={styles.card}>
            <div style={styles.label}>VÍ CHÍNH</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontSize:18, fontWeight:'bold'}}>
                <span>{Number(balances.flr).toFixed(2)} FLR</span>
                <span>{Number(balances.wflr).toLocaleString()} WFLR</span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input type="number" value={walletAmount} onChange={(e)=>setWalletAmount(e.target.value)} style={styles.input} placeholder="Nhập số..."/>
                <button onClick={() => setWalletAmount(balances.flr)} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>MAX</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                <button onClick={()=>handleWrap(true)} style={{...styles.btn, background:'#222', color:'white'}}>WRAP</button>
                <button onClick={()=>handleWrap(false)} style={{...styles.btn, background:'#222', color:'white'}}>UNWRAP</button>
                <button onClick={handleToPDA} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>NẠP PDA</button>
            </div>
          </section>

          <section style={{...styles.card, border: `1px solid ${COLORS.PINK}33`}}>
            <div style={{...styles.label, color: COLORS.PINK}}>TÀI KHOẢN PDA</div>
            <div style={{fontSize:24, fontWeight:'900', marginBottom:15}}>{Number(balances.pdaWflr).toLocaleString()} WFLR</div>
            
            <div style={{background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 12, marginBottom: 15, display: 'flex', justifyContent: 'space-between'}}>
                <span style={{fontSize: 10, color: COLORS.TEXT_MUTE}}>EPOCH KẾT THÚC:</span>
                <span style={{fontSize: 14, color: COLORS.AMBER, fontWeight: '900'}}>{countdown || "..."}</span>
            </div>

            <div style={{display:'flex', gap:8, marginBottom:10}}>
                <input type="number" value={pdaAmount} onChange={(e)=>setPdaAmount(e.target.value)} style={styles.input} placeholder="Số rút..."/>
                <button onClick={() => setPdaAmount(balances.pdaWflr)} style={{...styles.btn, background: COLORS.AMBER, color:'black'}}>MAX</button>
            </div>
            <button onClick={handleWithdrawPDA} style={{...styles.btn, width:'100%', background:'transparent', color: COLORS.AMBER, border: `1px solid ${COLORS.AMBER}66`, marginBottom:15}}>⤺ RÚT VỀ VÍ CHÍNH</button>
            
            <div style={{background:'rgba(227, 24, 100, 0.1)', padding:15, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <div style={{fontSize:10, color: COLORS.TEXT_MUTE}}>CHỜ NHẬN</div>
                    <div style={{color: COLORS.PINK, fontSize:18, fontWeight:'900'}}>+{Number(balances.reward).toFixed(2)} FLR</div>
                </div>
                <button onClick={handleClaim} style={{...styles.btn, background: COLORS.PINK, color:'white', padding: '10px 20px'}}>CLAIM</button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.label}>ĐANG ỦY QUYỀN ({delegations.length}/2)</div>
            {delegations.map((d, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom: i===0?'1px solid #222':'none'}}>
                <div>
                  <div style={{fontWeight:'bold', fontSize:14}}>{d.name}</div>
                  <div style={{fontSize:11, color: COLORS.PINK}}>{d.pct}% Power</div>
                </div>
                <button onClick={()=>handleDelegate(d.addr, 0)} style={{background:'#ff444422', border:'none', color:'#ff4444', borderRadius:10, padding:'5px 12px'}}>✕ GỠ</button>
              </div>
            ))}
            <input type="text" placeholder="Tìm Provider..." value={providerSearch} onFocus={()=>setShowDropdown(true)} onChange={(e)=>setProviderSearch(e.target.value)} style={{...styles.input, marginTop:10, width:'94%'}}/>
            {showDropdown && (
                <div style={{background:'#181818', borderRadius:15, border:'1px solid #333', maxHeight:150, overflowY:'auto', marginTop:5}}>
                    {filteredProviders.map(p => (
                        <div key={p.address} onClick={()=>{handleDelegate(p.address, 50); setShowDropdown(false);}} style={{padding:12, borderBottom:'1px solid #222', fontSize:13, cursor:'pointer'}}>
                            {p.name} <span style={{float:'right', color:COLORS.PINK}}>+50%</span>
                        </div>
                    ))}
                </div>
            )}
          </section>

          <footer style={{textAlign:'center', paddingBottom: 20}}>
            <span style={{fontSize: 10, color: COLORS.PINK, fontWeight: 'bold'}}>{status.toUpperCase()}</span>
          </footer>
        </>
      )}
    </div>
  );
}
