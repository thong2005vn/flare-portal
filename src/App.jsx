import { useState, useCallback, useMemo, useEffect } from "react";
import { ethers } from "ethers";

// --- CẤU HÌNH HỆ THỐNG FLARE ---
const WNAT = "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d";
const REWARD_MANAGER = "0xC8f55c5aA2C752eE285Bd872855C749f4ee6239B";
const CLAIM_SETUP_MANAGER = "0xD56c0Ea37B848939B59e6F5Cda119b3fA473b5eB";

const COLORS = {
  PINK: "#e31864",
  AMBER: "#fbbf24",
  DARK: "#000000",
  SURFACE: "#111111",
  BORDER: "#262626",
  TEXT_MUTE: "#94a3b8"
};

const PROVIDERS = [
  { name: "Zellic", address: "0x76E5591dDa384A30eEb53fD4059C9570eE072E7e" },
  { name: "African Proofs", address: "0x7b3F2a1C8E9d4F2A1B3C4D5E6F7A8B9C0D1E2F3A" },
  { name: "Enosys", address: "0x8C6f28f2F1A2C1eB8C9F9bA2A5e3fC1A2B3C4D5E" }
];

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
      const wnat = new ethers.Contract(WNAT, [
        "function balanceOf(address) view returns (uint256)", 
        "function delegatesOf(address) view returns (address[], uint256[], uint256, uint256)"
      ], p);
      
      const rew = new ethers.Contract(REWARD_MANAGER, [
        "function getStateOfRewards(address) view returns (tuple(uint24 rewardEpochId, bytes20 beneficiary, uint120 amount, uint8 claimType, bool initialised, bool claimed)[][])"
      ], p);

      const [f, w, pw, rewardStates] = await Promise.all([
        p.getBalance(addr),
        wnat.balanceOf(addr),
        wnat.balanceOf(pda),
        rew.getStateOfRewards(pda).catch(() => [])
      ]);

      // Logic tính toán phần thưởng chuẩn
      let totalRewardWei = 0n;
      if (Array.isArray(rewardStates)) {
        rewardStates.forEach(epochArray => {
          if (Array.isArray(epochArray)) {
            epochArray.forEach(state => { 
              const amt = state.amount ? BigInt(state.amount) : 0n;
              // CHỈ CỘNG NẾU CHƯA ĐƯỢC CLAIM (claimed !== true)
              if (amt > 0n && state.claimed !== true) {
                totalRewardWei += amt; 
              }
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

      // Lấy danh sách Delegations
      const del = await wnat.delegatesOf(pda).catch(() => [[], [], 0n, 0n]);
      const [dA, bA, , count] = del;
      const currentDels = [];
      for (let i = 0; i < Number(count); i++) {
        if (dA[i] && dA[i] !== ethers.ZeroAddress) {
          const pInfo = PROVIDERS.find(prov => prov.address.toLowerCase() === dA[i].toLowerCase());
          currentDels.push({ name: pInfo ? pInfo.name : "Unknown", addr: dA[i], pct: Number(bA[i]) / 100 });
        }
      }
      setDelegations(currentDels);
    } catch (e) { console.error("Refresh Error:", e); }
  }, [getProvider]);

  // Tự động refresh mỗi 30s
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
        setStatus(`✅ ${label} xong!`);
        setWalletAmount("");
        setPdaAmount("");
        setTimeout(() => refreshData(account, pdaAddress), 2000);
      }
    } catch (e) {
      console.error(e);
      setStatus(`❌ Lỗi: ${e.reason || "Giao dịch thất bại"}`);
    }
  };

  const connect = async () => {
    if (!window.ethereum) return alert("Cài MetaMask!");
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], getProvider());
    const pda = await csm.accountToDelegationAccount(accs[0]);
    setAccount(accs[0]);
    setPdaAddress(pda);
    refreshData(accs[0], pda);
  };

  const handleWithdrawPDA = () => execute("Rút tiền PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function withdraw(uint256) external"], s);
    return csm.withdraw(ethers.parseEther(pdaAmount || "0"));
  });

  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await (getProvider()).getSigner();
    const r = new ethers.Contract(REWARD_MANAGER, [
      "function claim(address, address, uint24, bool, tuple[]) returns (uint256)",
      "function getRewardEpochIdsWithClaimableRewards() view returns (uint24, uint24)"
    ], s);
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    // Gửi mảng trống [] để claim tất cả các đợt sẵn có theo mặc định của Contract
    return r.claim(pdaAddress, pdaAddress, end, true, []);
  });

  const handleWrap = (isWrap) => execute(isWrap ? "Wrap" : "Unwrap", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function deposit() payable", "function withdraw(uint256)"], s);
    const val = ethers.parseEther(walletAmount || "0");
    return isWrap ? w.deposit({ value: val }) : w.withdraw(val);
  });

  const handleToPDA = () => execute("Nạp vào PDA", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function transfer(address,uint256)"], s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount || "0"));
  });

  const handleDelegate = (target, pct = 50) => execute(pct === 0 ? "Gỡ bỏ" : "Ủy quyền", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function delegate(address,uint256)"], s);
    return w.delegate(target, pct * 100);
  });

  const filteredProviders = useMemo(() => 
    PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())), 
  [providerSearch]);

  const styles = {
    container: { boxSizing: 'border-box', padding: "24px", maxWidth: "420px", margin: "20px auto", background: COLORS.DARK, color: "white", borderRadius: "32px", border: `1px solid ${COLORS.BORDER}`, fontFamily: "-apple-system, sans-serif" },
    card: { boxSizing: 'border-box', background: COLORS.SURFACE, padding: "20px", borderRadius: "24px", marginBottom: "16px", border: "1px solid #1f1f1f" },
    label: { fontSize: "11px", color: COLORS.TEXT_MUTE, fontWeight: "800", marginBottom: "12px", textTransform: "uppercase" },
    input: { flex: 1, padding: "12px", borderRadius: "14px", background: "#080808", color: "white", border: "1px solid #222", outline: "none", width:'100%' },
    btn: { padding: "12px", borderRadius: "14px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }
  };

  return (
    <div style={styles.container}>
      <header style={{textAlign:'center', marginBottom:'25px'}}>
        <h2 style={{color: COLORS.PINK, letterSpacing: '2px', margin: 0}}>FLR <span style={{fontWeight:300, color:'#fff'}}>PORTAL</span></h2>
      </header>
      
      {!account ? (
        <button onClick={connect} style={{...styles.btn, width:'100%', background: COLORS.PINK, color:'white', padding:'18px'}}>KẾT NỐI VÍ METAMASK</button>
      ) : (
        <>
          <section style={styles.card}>
            <div style={styles.label}>VÍ CHÍNH</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontSize:18, fontWeight:'bold'}}>
                <span>{Number(balances.flr).toFixed(2)} FLR</span>
                <span>{Number(balances.wflr).toFixed(2)} WFLR</span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:12}}>
                <input type="number" value={walletAmount} onChange={(e)=>setWalletAmount(e.target.value)} style={styles.input} placeholder="0.0"/>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                <button onClick={()=>handleWrap(true)} style={{...styles.btn, background:'#222', color:'white'}}>WRAP</button>
                <button onClick={()=>handleWrap(false)} style={{...styles.btn, background:'#222', color:'white'}}>UNWRAP</button>
                <button onClick={handleToPDA} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>NẠP PDA</button>
            </div>
          </section>

          <section style={{...styles.card, border: `1px solid ${COLORS.PINK}44`}}>
            <div style={{...styles.label, color: COLORS.PINK}}>TÀI KHOẢN PDA (ỦY QUYỀN)</div>
            <div style={{fontSize:26, fontWeight:'900', marginBottom:15}}>{Number(balances.pdaWflr).toLocaleString()} <small style={{fontSize:12}}>WFLR</small></div>
            
            <div style={{display:'flex', gap:8, marginBottom:12}}>
                <input type="number" value={pdaAmount} onChange={(e)=>setPdaAmount(e.target.value)} style={styles.input} placeholder="Rút về ví chính..."/>
                <button onClick={()=>setPdaAmount(balances.pdaWflr)} style={{...styles.btn, background: COLORS.AMBER, color:'black'}}>MAX</button>
            </div>
            <button onClick={handleWithdrawPDA} style={{...styles.btn, width:'100%', background:'transparent', color: COLORS.AMBER, border: `1px solid ${COLORS.AMBER}66`, marginBottom:20}}>RÚT VỀ VÍ CHÍNH</button>
            
            <div style={{background:'rgba(227, 24, 100, 0.1)', padding:16, borderRadius:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <div style={{fontSize:10, color: COLORS.TEXT_MUTE}}>REWARDS ĐANG CÓ</div>
                    <div style={{color: COLORS.PINK, fontSize:20, fontWeight:'900'}}>+{Number(balances.reward).toFixed(2)} FLR</div>
                </div>
                <button onClick={handleClaim} disabled={Number(balances.reward) <= 0} style={{...styles.btn, background: Number(balances.reward) > 0 ? COLORS.PINK : '#333', color:'white', padding:'12px 20px'}}>CLAIM</button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.label}>DANH SÁCH ỦY QUYỀN ({delegations.length}/2)</div>
            {delegations.map((d, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #222'}}>
                <div><div style={{fontWeight:'bold'}}>{d.name}</div><div style={{fontSize:11, color: COLORS.PINK}}>{d.pct}%</div></div>
                <button onClick={()=>handleDelegate(d.addr, 0)} style={{background:'transparent', border:'none', color:'#ff4444', fontWeight:'bold'}}>✕</button>
              </div>
            ))}
            <input type="text" placeholder="Thêm Provider..." value={providerSearch} onFocus={()=>setShowDropdown(true)} onChange={(e)=>setProviderSearch(e.target.value)} style={{...styles.input, marginTop:10}}/>
            {showDropdown && (
              <div style={{background:'#181818', borderRadius:14, marginTop:5, maxHeight:120, overflowY:'auto'}}>
                {filteredProviders.map(p => (
                  <div key={p.address} onClick={()=>{handleDelegate(p.address, 50); setShowDropdown(false);}} style={{padding:10, borderBottom:'1px solid #222', cursor:'pointer', fontSize:12}}>
                    {p.name} <span style={{float:'right', color:COLORS.PINK}}>+50%</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <footer style={{textAlign:'center', fontSize:10, color: COLORS.PINK, fontWeight:'bold', marginTop:10}}>
             STATUS: {status.toUpperCase()}
          </footer>
        </>
      )}
    </div>
  );
}
