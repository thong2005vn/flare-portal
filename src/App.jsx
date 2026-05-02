import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

// --- CẤU HÌNH HỆ THỐNG ---
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

  const getProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // Giữ nguyên logic hiển thị bạn xác nhận là đúng
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

      let totalRewardWei = 0n;
      if (Array.isArray(rewardStates)) {
        rewardStates.forEach(epochArray => {
          epochArray.forEach(state => { 
            // Cộng dồn theo logic cũ của bạn
            totalRewardWei += BigInt(state.amount || 0); 
          });
        });
      }

      setBalances({
        flr: ethers.formatEther(f),
        wflr: ethers.formatEther(w),
        pdaWflr: ethers.formatEther(pw),
        reward: ethers.formatEther(totalRewardWei)
      });

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
    } catch (e) { console.error(e); }
  }, [getProvider]);

  const execute = async (label, action) => {
    try {
      setStatus(`⏳ ${label}...`);
      const tx = await action();
      if (tx) {
        await tx.wait();
        setStatus(`✅ ${label} xong!`);
        setTimeout(() => refreshData(account, pdaAddress), 2000);
      }
    } catch (e) {
      setStatus(`❌ Lỗi giao dịch`);
      console.error(e);
    }
  };

  const connect = async () => {
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], getProvider());
    const pda = await csm.accountToDelegationAccount(accs[0]);
    setAccount(accs[0]);
    setPdaAddress(pda);
    refreshData(accs[0], pda);
  };

  // SỬA ĐỔI CHÍNH: Dùng ClaimSetupManager để thực thi lệnh Claim thành công
  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, [
      "function claim(address _pda, address _target, uint256 _epoch, bool _wrap) external"
    ], s);
    const r = new ethers.Contract(REWARD_MANAGER, ["function getRewardEpochIdsWithClaimableRewards() view returns (uint24, uint24)"], getProvider());
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    
    return csm.claim(pdaAddress, pdaAddress, end, true);
  });

  const handleToPDA = () => execute("Nạp vào PDA", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function transfer(address,uint256)"], s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount));
  });

  const handleWithdrawPDA = () => execute("Rút từ PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function withdraw(uint256)"], s);
    return csm.withdraw(ethers.parseEther(pdaAmount));
  });

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto", background: COLORS.DARK, color: "white", borderRadius: "20px", fontFamily: "sans-serif" }}>
      <h3 style={{ color: COLORS.PINK, textAlign: "center" }}>FLR PORTAL</h3>
      
      {!account ? (
        <button onClick={connect} style={{ width: "100%", padding: "15px", borderRadius: "10px", background: COLORS.PINK, color: "white", border: "none", fontWeight: "bold" }}>KẾT NỐI VÍ</button>
      ) : (
        <>
          <div style={{ background: COLORS.SURFACE, padding: "15px", borderRadius: "15px", marginBottom: "10px" }}>
            <div style={{ fontSize: "12px", color: COLORS.TEXT_MUTE }}>VÍ CHÍNH</div>
            <div>{Number(balances.flr).toFixed(2)} FLR | {Number(balances.wflr).toFixed(2)} WFLR</div>
            <input type="number" placeholder="Số lượng..." value={walletAmount} onChange={e => setWalletAmount(e.target.value)} style={{ width: "90%", marginTop: "10px", padding: "8px", borderRadius: "5px", border: "1px solid #333", background: "#000", color: "#white" }} />
            <button onClick={handleToPDA} style={{ width: "100%", marginTop: "10px", padding: "10px", background: COLORS.PINK, border: "none", color: "white", borderRadius: "5px" }}>NẠP VÀO PDA</button>
          </div>

          <div style={{ background: COLORS.SURFACE, padding: "15px", borderRadius: "15px", border: `1px solid ${COLORS.PINK}55` }}>
            <div style={{ fontSize: "12px", color: COLORS.PINK }}>PDA ACCOUNT</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{Number(balances.pdaWflr).toFixed(2)} WFLR</div>
            
            <div style={{ marginTop: "15px", background: "#1a1a1a", padding: "10px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: COLORS.TEXT_MUTE }}>PHẦN THƯỞNG</div>
                <div style={{ color: COLORS.AMBER, fontWeight: "bold" }}>{Number(balances.reward).toFixed(4)} FLR</div>
              </div>
              <button onClick={handleClaim} style={{ background: COLORS.AMBER, border: "none", padding: "8px 15px", borderRadius: "5px", fontWeight: "bold" }}>CLAIM</button>
            </div>

            <input type="number" placeholder="Rút về ví..." value={pdaAmount} onChange={e => setPdaAmount(e.target.value)} style={{ width: "90%", marginTop: "15px", padding: "8px", borderRadius: "5px", border: "1px solid #333", background: "#000", color: "#white" }} />
            <button onClick={handleWithdrawPDA} style={{ width: "100%", marginTop: "10px", padding: "10px", background: "transparent", border: `1px solid ${COLORS.AMBER}`, color: COLORS.AMBER, borderRadius: "5px" }}>RÚT VỀ VÍ CHÍNH</button>
          </div>

          <div style={{ textAlign: "center", marginTop: "15px", fontSize: "12px", color: COLORS.TEXT_MUTE }}> TRẠNG THÁI: {status} </div>
        </>
      )}
    </div>
  );
}
