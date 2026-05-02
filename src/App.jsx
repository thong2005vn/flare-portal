import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

// --- CẤU HÌNH ---
const WNAT = "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d";
const REWARD_MANAGER = "0xC8f55c5aA2C752eE285Bd872855C749f4ee6239B";
const CLAIM_SETUP_MANAGER = "0xD56c0Ea37B848939B59e6F5Cda119b3fA473b5eB";

export default function FlarePortal() {
  const [account, setAccount] = useState("");
  const [pdaAddress, setPdaAddress] = useState("");
  const [balances, setBalances] = useState({ flr: "0", wflr: "0", pdaWflr: "0", reward: "0" });
  const [walletAmount, setWalletAmount] = useState("");
  const [pdaAmount, setPdaAmount] = useState("");
  const [status, setStatus] = useState("Sẵn sàng");

  const getProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // GIỮ NGUYÊN LOGIC HIỂN THỊ CŨ CỦA BẠN
  const refreshData = useCallback(async (addr, pda) => {
    if (!addr || !pda) return;
    try {
      const p = getProvider();
      const wnat = new ethers.Contract(WNAT, ["function balanceOf(address) view returns (uint256)"], p);
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
      if (rewardStates) {
        rewardStates.forEach(epochArray => {
          epochArray.forEach(state => { 
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
      setStatus(`❌ Lỗi`);
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

  // CHỈ SỬA HÀM NÀY ĐỂ RÚT ĐƯỢC TIỀN (Dùng ClaimSetupManager)
  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, [
      "function claim(address _pda, address _target, uint256 _epoch, bool _wrap) external"
    ], s);
    const r = new ethers.Contract(REWARD_MANAGER, ["function getRewardEpochIdsWithClaimableRewards() view returns (uint24, uint24)"], getProvider());
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    return csm.claim(pdaAddress, pdaAddress, end, true);
  });

  const handleToPDA = () => execute("Nạp PDA", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function transfer(address,uint256)"], s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount));
  });

  const handleWithdrawPDA = () => execute("Rút PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function withdraw(uint256)"], s);
    return csm.withdraw(ethers.parseEther(pdaAmount));
  });

  // UI NGUYÊN BẢN (KHÔNG THAY ĐỔI CSS)
  return (
    <div style={{ padding: "20px" }}>
      <h2>Flare Portal</h2>
      {!account ? (
        <button onClick={connect}>Kết nối ví</button>
      ) : (
        <>
          <p>Địa chỉ ví: {account}</p>
          <p>Địa chỉ PDA: {pdaAddress}</p>
          <hr />
          <div>
            <h3>Số dư Ví chính</h3>
            <p>FLR: {balances.flr}</p>
            <p>WFLR: {balances.wflr}</p>
            <input type="number" value={walletAmount} onChange={e => setWalletAmount(e.target.value)} placeholder="Nhập số lượng WFLR" />
            <button onClick={handleToPDA}>Chuyển vào PDA</button>
          </div>
          <hr />
          <div>
            <h3>Số dư PDA (Delegation)</h3>
            <p>WFLR: {balances.pdaWflr}</p>
            <p>Phần thưởng chờ nhận: {balances.reward} FLR</p>
            <button onClick={handleClaim}>Nhận tất cả phần thưởng</button>
            <br /><br />
            <input type="number" value={pdaAmount} onChange={e => setPdaAmount(e.target.value)} placeholder="Nhập số lượng rút" />
            <button onClick={handleWithdrawPDA}>Rút WFLR về ví chính</button>
          </div>
          <hr />
          <p>Trạng thái: {status}</p>
        </>
      )}
    </div>
  );
}
