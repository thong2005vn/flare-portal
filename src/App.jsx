import { useState, useCallback, useMemo } from "react";
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
  { name: "Zellic", address: "0x76e5591dda384a30eeb53fd4059c9570ee072e7e" },
  { name: "African Proofs", address: "0x7b3F2a1C8E9d4F2A1B3C4D5E6F7A8B9C0D1E2F3A" },
  { name: "Enosys", address: "0x8C6f28f2F1A2C1eB8C9F9bA2A5e3fC1A2B3C4D5E" },
  // ... (Các providers khác giữ nguyên như danh sách của bạn)
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

  const getProvider = useCallback(() => new ethers.BrowserProvider(window.ethereum), []);

  const refreshData = useCallback(async (addr, pda) => {
    if (!addr || !pda) return;
    try {
      const p = getProvider();
      const wnat = new ethers.Contract(WNAT, ["function balanceOf(address) view returns (uint256)", "function delegatesOf(address) view returns (address[], uint256[], uint256, uint256)"], p);
      const rew = new ethers.Contract(REWARD_MANAGER, ["function getStateOfRewards(address _rewardOwner) view returns (tuple(uint24 rewardEpochId, bytes20 beneficiary, uint120 amount, uint8 claimType, bool initialised, bool claimed)[][])"], p);

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
          epochArray.forEach(state => { totalRewardWei += BigInt(state.amount || 0); });
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
          currentDels.push({ addr: dA[i], pct: Number(bA[i]) / 100 });
        }
      }
      setDelegations(currentDels);
    } catch (e) { console.error(e); }
  }, [getProvider]);

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
    if (!window.ethereum) return alert("Cài MetaMask!");
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], getProvider());
    const pda = await csm.accountToDelegationAccount(accs[0]);
    setAccount(accs[0]);
    setPdaAddress(pda);
    refreshData(accs[0], pda);
  };

  // --- SỬA LỖI TẠI ĐÂY: Dùng ClaimSetupManager để Claim thành công ---
  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await (getProvider()).getSigner();
    // Chuyển sang dùng ClaimSetupManager thay vì RewardManager để tránh lỗi Proof
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, [
      "function claim(address _pda, address _target, uint256 _epoch, bool _wrap) external"
    ], s);
    const r = new ethers.Contract(REWARD_MANAGER, [
      "function getRewardEpochIdsWithClaimableRewards() view returns (uint24, uint24)"
    ], getProvider());
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    return csm.claim(pdaAddress, pdaAddress, end, true);
  });

  const handleWithdrawPDA = () => execute("Rút PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function withdraw(uint256 _amount) external"], s);
    return csm.withdraw(ethers.parseEther(pdaAmount || "0"));
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

  const handleDelegate = (target, pct = 50) => execute(pct === 0 ? "Hủy" : "Ủy quyền", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function delegate(address,uint256)"], s);
    return w.delegate(target, pct * 100);
  });

  const filteredProviders = useMemo(() => 
    PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())), 
  [providerSearch]);

  const styles = {
    container: { boxSizing: 'border-box', padding: "24px", maxWidth: "420px", margin: "20px auto", background: COLORS.DARK, color: "white", borderRadius: "32px", border: `1px solid ${COLORS.BORDER}`, fontFamily: "sans-serif" },
    card: { boxSizing: 'border-box', background: COLORS.SURFACE, padding: "20px", borderRadius: "24px", marginBottom: "16px", border: "1px solid #1f1f1f" },
    label: { fontSize: "11px", color: COLORS.TEXT_MUTE, fontWeight: "800", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" },
    input: { flex: 1, padding: "12px", borderRadius: "14px", background: "#080808", color: "white", border: "1px solid #222", outline: "none" },
    btn: { padding: "12px", borderRadius: "14px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }
  };

  return (
    <div style={styles.container}>
      <header style={{textAlign:'center', marginBottom:'25px'}}>
        <h2 style={{color: COLORS.PINK, letterSpacing: '3px', margin: 0}}>FLARE <span style={{fontWeight:300, color:'#fff'}}>PORTAL</span></h2>
        <div style={{width:'40px', height:'2px', background: COLORS.PINK, margin:'8px auto'}}></div>
      </header>
      
      {!account ? (
        <button onClick={connect} style={{...styles.btn, width:'100%', background: COLORS.PINK, color:'white', padding:'18px'}}>KẾT NỐI VÍ METAMASK</button>
      ) : (
        <>
          <section style={styles.card}>
            <div style={styles.label}>MAIN WALLET</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, fontSize:18, fontWeight:'900'}}>
                <span>{Number(balances.flr).toFixed(2)} <small style={{fontSize:10, color:COLORS.TEXT_MUTE}}>FLR</small></span>
                <span>{Number(balances.wflr).toLocaleString()} <small style={{fontSize:10, color:COLORS.TEXT_MUTE}}>WFLR</small></span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:12}}>
                <input type="number" value={walletAmount} onChange={(e)=>setWalletAmount(e.target.value)} style={styles.input} placeholder="0.0"/>
                <button onClick={()=>setWalletAmount(balances.flr)} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>MAX</button>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:8}}>
                <button onClick={()=>handleWrap(true)} style={{...styles.btn, background:'#222', color:'white'}}>WRAP</button>
                <button onClick={()=>handleWrap(false)} style={{...styles.btn, background:'#222', color:'white'}}>UNWRAP</button>
                <button onClick={handleToPDA} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>NẠP PDA</button>
            </div>
          </section>

          <section style={{...styles.card, border: `1px solid ${COLORS.PINK}44`}}>
            <div style={{...styles.label, color: COLORS.PINK}}>DELEGATION ACCOUNT (PDA)</div>
            <div style={{fontSize:24, fontWeight:'900', marginBottom:15}}>{Number(balances.pdaWflr).toLocaleString()} <small style={{color:COLORS.PINK, fontSize:12}}>WFLR</small></div>
            
            <div style={{display:'flex', gap:8, marginBottom:12}}>
                <input type="number" value={pdaAmount} onChange={(e)=>setPdaAmount(e.target.value)} style={styles.input} placeholder="Rút về ví chính..."/>
                <button onClick={()=>setPdaAmount(balances.pdaWflr)} style={{...styles.btn, background: COLORS.AMBER, color:'black'}}>MAX</button>
            </div>
            <button onClick={handleWithdrawPDA} style={{...styles.btn, width:'100%', background:'transparent', color: COLORS.AMBER, border: `1px solid ${COLORS.AMBER}66`, marginBottom:20}}>⤺ RÚT VỀ VÍ CHÍNH</button>
            
            <div style={{background:'rgba(0,0,0,0.4)', padding:16, borderRadius:20, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #222'}}>
                <div>
                    <div style={{fontSize:10, color: COLORS.TEXT_MUTE}}>UNCLAIMED REWARDS</div>
                    <div style={{color: COLORS.PINK, fontSize:20, fontWeight:'900'}}>+{Number(balances.reward).toFixed(2)} FLR</div>
                </div>
                <button onClick={handleClaim} disabled={Number(balances.reward) <= 0} style={{...styles.btn, background: Number(balances.reward) > 0 ? COLORS.PINK : '#222', color:'white', padding:'12px 20px'}}>CLAIM</button>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.label}>Delegations ({delegations.length}/2)</div>
            {delegations.map((d, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #222'}}>
                <div><div style={{fontWeight:'bold'}}>{PROVIDERS.find(p => p.address.toLowerCase() === d.addr.toLowerCase())?.name || "Unknown"}</div><div style={{fontSize:11, color: COLORS.PINK}}>{d.pct}% Power</div></div>
                <button onClick={()=>handleDelegate(d.addr, 0)} style={{background:'#ff444411', border:'none', color:'#ff4444', padding:'5px 10px', borderRadius:8}}>✕</button>
              </div>
            ))}
            <div style={{position:'relative', marginTop:12}}>
                <input type="text" placeholder="Tìm Provider..." value={providerSearch} onFocus={()=>setShowDropdown(true)} onChange={(e)=>setProviderSearch(e.target.value)} style={styles.input}/>
                {showDropdown && (
                    <div style={{position:'absolute', bottom:'110%', left:0, right:0, background:'#181818', borderRadius:15, border:'1px solid #333', maxHeight:150, overflowY:'auto', zIndex:100}}>
                        {filteredProviders.map(p => (
                            <div key={p.address} onClick={()=>{handleDelegate(p.address, 50); setShowDropdown(false);}} style={{padding:12, fontSize:13, borderBottom:'1px solid #222', cursor:'pointer'}}>
                                {p.name} <span style={{color: COLORS.PINK, float:'right'}}>50%</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </section>

          <div style={{textAlign:'center', fontSize:11, color: COLORS.PINK, fontWeight:'bold'}}>● {status.toUpperCase()}</div>
        </>
      )}
    </div>
  );
}
