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
  const [countdown, setCountdown] = useState("");

  // Khởi tạo Provider duy nhất một lần
  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // Hàm tự sửa lỗi Checksum để không bị đứng hình
  const getSafeAddr = (addr) => {
    try { return ethers.getAddress(addr); } catch { return addr; }
  };

  const refreshData = useCallback(async (addr, pda) => {
    if (!addr || !pda || !provider) return;
    try {
      const wnat = new ethers.Contract(getSafeAddr(FLARE_CONFIG.WNAT), ABIS.WNAT, provider);
      const rew = new ethers.Contract(getSafeAddr(FLARE_CONFIG.REWARD_MANAGER), ABIS.REWARD_MANAGER, provider);

      const [f, w, pw, rewardStates] = await Promise.all([
        provider.getBalance(addr),
        wnat.balanceOf(addr),
        wnat.balanceOf(pda),
        rew.getStateOfRewards(pda).catch(() => [])
      ]);

      let totalRewardWei = 0n;
      if (Array.isArray(rewardStates)) {
        rewardStates.forEach(e => e.rewardAmounts?.forEach(amt => totalRewardWei += BigInt(amt)));
      }

      setBalances({
        flr: ethers.formatEther(f),
        wflr: ethers.formatEther(w),
        pdaWflr: ethers.formatEther(pw),
        reward: ethers.formatEther(totalRewardWei)
      });
      
      const del = await wnat.delegatesOf(pda).catch(() => [[], [], 0n, 0n]);
      const currentDels = [];
      for (let i = 0; i < Number(del[3]); i++) {
        if (del[0][i] !== ethers.ZeroAddress) {
          const pInfo = PROVIDERS.find(p => p.address.toLowerCase() === del[0][i].toLowerCase());
          currentDels.push({ name: pInfo ? pInfo.name : "Unknown", addr: del[0][i], pct: Number(del[1][i]) / 100 });
        }
      }
      setDelegations(currentDels);
    } catch (e) { console.error("Refresh Error:", e); }
  }, [provider]);

  const connect = async () => {
    if (!window.ethereum) return alert("Vui lòng cài đặt MetaMask!");
    try {
      setStatus("⏳ Đang kết nối...");
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      
      const csm = new ethers.Contract(getSafeAddr(FLARE_CONFIG.CLAIM_SETUP_MANAGER), ABIS.CLAIM_SETUP_MANAGER, signer);
      const pda = await csm.accountToDelegationAccount(accs[0]);
      
      setAccount(accs[0]);
      setPdaAddress(pda);
      refreshData(accs[0], pda);
      setStatus("Sẵn sàng");
    } catch (e) {
      console.error(e);
      setStatus("❌ Lỗi kết nối: " + e.message.slice(0, 30));
    }
  };

  const execute = async (label, action) => {
    try {
      setStatus(`⏳ ${label}...`);
      const tx = await action();
      if (tx) {
        await tx.wait();
        setStatus(`✅ ${label} thành công!`);
        setTimeout(() => refreshData(account, pdaAddress), 1000);
      }
    } catch (e) { setStatus(`❌ ${e.reason || "Lỗi giao dịch"}`); }
  };

  const handleWrap = (isWrap) => execute(isWrap ? "Wrap" : "Unwrap", async () => {
    const s = await provider.getSigner();
    const w = new ethers.Contract(getSafeAddr(FLARE_CONFIG.WNAT), ABIS.WNAT, s);
    const val = ethers.parseEther(walletAmount || "0");
    return isWrap ? w.deposit({ value: val }) : w.withdraw(val);
  });

  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await provider.getSigner();
    const r = new ethers.Contract(getSafeAddr(FLARE_CONFIG.REWARD_MANAGER), ABIS.REWARD_MANAGER, s);
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    return r.claim(pdaAddress, pdaAddress, end, true, []);
  });

  // Giao diện (Màu sắc và Layout giữ nguyên phong cách OZPRO của bạn)
  const styles = {
    container: { padding: "15px", maxWidth: "450px", margin: "0 auto", background: COLORS.DARK, color: "white", minHeight: "100vh" },
    card: { background: COLORS.SURFACE, padding: "20px", borderRadius: "18px", marginBottom: "15px", border: "1px solid #222" },
    input: { flex: 1, padding: "12px", borderRadius: "10px", background: "#000", color: "white", border: "1px solid #333" },
    btn: { padding: "12px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer" }
  };

  return (
    <div style={styles.container}>
      <h2 style={{textAlign:'center', color: COLORS.PINK}}>OZPRO FLR PORTAL</h2>
      {!account ? (
        <button onClick={connect} style={{...styles.btn, width:'100%', background: COLORS.PINK, color:'white', height: '50px'}}>KẾT NỐI VÍ METAMASK</button>
      ) : (
        <>
          <div style={styles.card}>
            <div style={{fontSize: 12, color: COLORS.TEXT_MUTE, marginBottom: 10}}>VÍ CHÍNH</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 15, fontWeight:'900'}}>
              <span>{Number(balances.flr).toFixed(2)} FLR</span>
              <span>{Number(balances.wflr).toLocaleString()} WFLR</span>
            </div>
            <div style={{display:'flex', gap: 10, marginBottom: 10}}>
              <input type="number" value={walletAmount} onChange={(e)=>setWalletAmount(e.target.value)} style={styles.input} placeholder="Số lượng..."/>
              <button onClick={()=>handleWrap(true)} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>WRAP</button>
            </div>
          </div>

          <div style={{...styles.card, borderColor: COLORS.PINK}}>
            <div style={{fontSize: 12, color: COLORS.PINK, marginBottom: 10}}>TÀI KHOẢN PDA</div>
            <div style={{fontSize: 28, fontWeight: '900', marginBottom: 20}}>{Number(balances.pdaWflr).toLocaleString()} WFLR</div>
            <div style={{display:'flex', justifyContent:'space-between', background:'#111', padding:15, borderRadius:12}}>
              <div>
                <div style={{fontSize: 10, color: COLORS.TEXT_MUTE}}>REWARDS</div>
                <div style={{color: COLORS.PINK, fontWeight:'bold'}}>+{Number(balances.reward).toFixed(2)} FLR</div>
              </div>
              <button onClick={handleClaim} style={{...styles.btn, background: COLORS.PINK, color:'white'}}>CLAIM</button>
            </div>
          </div>
          
          <footer style={{textAlign:'center', fontSize: 10, color: COLORS.PINK, marginTop: 20}}>{status.toUpperCase()}</footer>
        </>
      )}
    </div>
  );
}
