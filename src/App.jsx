import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";

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
  TEXT_MUTE: "#94a3b8",
  PRICE_GREEN: "#00ffcc"
};

const PROVIDERS = [
  { name: "Zellic", address: "0x76e5591dda384a30eeb53fd4059c9570ee072e7e" },
  { name: "African Proofs", address: "0x7b3F2a1C8E9d4F2A1B3C4D5E6F7A8B9C0D1E2F3A" },
  { name: "Comfy Nodes", address: "0x76E5591DdA384a30Eeb53FD4059C9570eE072E7E" },
  { name: "Enosys", address: "0x8C6f28f2F1A2C1eB8C9F9bA2A5e3fC1A2B3C4D5E" },
  { name: "Lena", address: "0x4A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B" },
  { name: "A-FTSO", address: "0x9F8E7D6C5B4A3F2E1D0C9B8A7E6D5C4B3A2F1E0D" },
  { name: "AU", address: "0x4990320858ae3528b645c60059281a66c3488888" },
  { name: "Flare Oracle", address: "0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B" },
  { name: "WaveLabs", address: "0x3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D" },
  { name: "Alpha Oracle", address: "0x5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F" },
  { name: "Orakl Network", address: "0x7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B" },
  { name: "FTSO EU", address: "0x9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D" },
  { name: "FTSO Asia", address: "0x2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A" },
  { name: "Signal Oracle", address: "0x4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C" },
  { name: "Spark Oracle", address: "0x6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E" },
  { name: "FTSO Labs", address: "0x8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A" },
  { name: "OracleOne", address: "0xA0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9" },
  { name: "FTSO Africa", address: "0xC2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1" },
  { name: "FTSO LATAM", address: "0xE4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3" },
  { name: "OracleX", address: "0xF5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4" },
  { name: "FTSO Hub", address: "0xD3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2" },
  { name: "FTSO Pro", address: "0xB1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0" },
  { name: "Oracle Prime", address: "0x9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F" },
  { name: "FTSO Cloud", address: "0x7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D" },
  { name: "FTSO Vision", address: "0x5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B" },
  { name: "Oracle Fusion", address: "0x3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B" },
  { name: "FTSO Titan", address: "0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B" },
  { name: "FTSO Nova", address: "0x0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C" },
  { name: "Oracle Max", address: "0x2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D" },
  { name: "FTSO Global", address: "0x4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E" },
  { name: "FTSO World", address: "0x6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F" }
];

export default function FlarePortal() {
  const [account, setAccount] = useState("");
  const [pdaAddress, setPdaAddress] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [balances, setBalances] = useState({ flr: "0", wflr: "0", pdaWflr: "0", reward: "0" });
  const [delegations, setDelegations] = useState([]);
  const [walletAmount, setWalletAmount] = useState("");
  const [pdaAmount, setPdaAmount] = useState("");
  const [status, setStatus] = useState("Sẵn sàng");
  const [providerSearch, setProviderSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);
  const [prices, setPrices] = useState({ btc: 0, eth: 0, xrp: 0, flr: 0, sgb: 0, ltc: 0, doge: 0 });
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- THỰC HIỆN ĐỔI MÀU NỀN NGOÀI APP ---
  useEffect(() => {
    document.body.style.backgroundColor = "#080808"; 
    document.body.style.margin = "0";
    return () => {
      document.body.style.backgroundColor = ""; 
    };
  }, []);

  // --- LOGIC ĐẾM NGƯỢC ---
  const [timeLeft, setTimeLeft] = useState(0);
  const CYCLE_SECONDS = 3.5 * 24 * 3600;

  useEffect(() => {
    const savedEndTime = localStorage.getItem("claim_countdown_end");
    if (savedEndTime) {
      const diff = Math.floor((Number(savedEndTime) - Date.now()) / 1000);
      if (diff > 0) setTimeLeft(diff);
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          localStorage.removeItem("claim_countdown_end");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const renderCountdown = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => n.toString().padStart(2, "0");

    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', fontFamily: 'monospace' }}>
        <span>{pad(d)}</span><small style={{ fontSize: '10px', color: COLORS.TEXT_MUTE, marginRight: '2px' }}>d</small>
        <span>{pad(h)}</span><small style={{ fontSize: '10px', color: COLORS.TEXT_MUTE, marginRight: '2px' }}>h</small>
        <span>{pad(m)}</span><small style={{ fontSize: '10px', color: COLORS.TEXT_MUTE, marginRight: '2px' }}>m</small>
        <span style={{ color: COLORS.PINK }}>{pad(s)}</span><small style={{ fontSize: '10px', color: COLORS.TEXT_MUTE }}>s</small>
      </div>
    );
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    const getAllPrices = async () => {
      try {
        const ids = "bitcoin,ethereum,ripple,flare-networks,songbird,litecoin,dogecoin";
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        const data = await res.json();
        setPrices({
          btc: data["bitcoin"].usd, eth: data["ethereum"].usd, xrp: data["ripple"].usd,
          flr: data["flare-networks"].usd, sgb: data["songbird"].usd,
          ltc: data["litecoin"].usd, doge: data["dogecoin"].usd
        });
      } catch (e) { console.error(e); }
    };
    getAllPrices();
    const interval = setInterval(getAllPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const toUSD = (amt) => `$${(Number(amt) * prices.flr).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getProvider = useCallback(() => new ethers.BrowserProvider(window.ethereum), []);

  const refreshData = useCallback(async (addr, pda) => {
    if (!addr || !pda) return;
    try {
      const p = getProvider();

      // Kiểm tra trạng thái PDA qua owner
      try {
        const pdaContract = new ethers.Contract(pda, ["function owner() view returns (address)"], p);
        const pdaOwner = await pdaContract.owner();
        setIsActivated(pdaOwner.toLowerCase() === addr.toLowerCase());
      } catch (e) {
        setIsActivated(false);
      }

      const wnat = new ethers.Contract(WNAT, ["function balanceOf(address) view returns (uint256)", "function delegatesOf(address) view returns (address[], uint256[], uint256, uint256)"], p);
      const rew = new ethers.Contract(REWARD_MANAGER, ["function getStateOfRewards(address) view returns (tuple(uint24, bytes20, uint120, uint8, bool)[][])"], p);

      const [f, w, pw, rewardStates] = await Promise.all([
        p.getBalance(addr), wnat.balanceOf(addr), wnat.balanceOf(pda),
        rew.getStateOfRewards(pda).catch(() => [])
      ]);

      const del = await wnat.delegatesOf(pda).catch(() => [[], [], 0n, 0n]);
      let totalRewardWei = 0n;
      if (Array.isArray(rewardStates)) {
        rewardStates.forEach(epochArray => {
          epochArray.forEach(state => { totalRewardWei += BigInt(state[2]); });
        });
      }

      setBalances({ flr: ethers.formatEther(f), wflr: ethers.formatEther(w), pdaWflr: ethers.formatEther(pw), reward: ethers.formatEther(totalRewardWei) });

      const [dA, bA, , count] = del;
      const currentDels = [];
      for (let i = 0; i < Number(count); i++) {
        if (dA[i] && dA[i] !== ethers.ZeroAddress) {
          const pInfo = PROVIDERS.find(prov => prov.address.toLowerCase() === dA[i].toLowerCase());
          currentDels.push({ name: pInfo ? pInfo.name : "Provider", addr: dA[i], pct: Number(bA[i]) / 100 });
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
        setWalletAmount(""); setPdaAmount(""); setPendingProvider(null); setProviderSearch("");
        setTimeout(() => refreshData(account, pdaAddress), 1500);
      }
    } catch (e) {
      if (e.code === "ACTION_REJECTED") setStatus("❌ Người dùng từ chối");
      else setStatus(`❌ Lỗi: ${e.reason || "Giao dịch thất bại"}`);
    }
  };

  const connect = async () => {
    if (!window.ethereum) return alert("Cài MetaMask!");
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], getProvider());
    const pda = await csm.accountToDelegationAccount(accs[0]);
    setAccount(accs[0]); setPdaAddress(pda);
    refreshData(accs[0], pda);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnablePDA = () => execute("Kích hoạt PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function enableDelegationAccount() external returns (address)"], s);
    return csm.enableDelegationAccount();
  });

  const handleWithdrawPDA = () => execute("Rút PDA", async () => {
    const s = await (getProvider()).getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function withdraw(uint256) external"], s);
    return csm.withdraw(ethers.parseEther(pdaAmount || "0"));
  });

  const handleClaim = () => execute("Nhận thưởng", async () => {
    const s = await (getProvider()).getSigner();
    const r = new ethers.Contract(REWARD_MANAGER, ["function claim(address,address,uint24,bool,tuple(bytes32[],tuple(uint24,bytes20,uint120,uint8))[])", "function getRewardEpochIdsWithClaimableRewards() view returns (uint24,uint24)"], s);
    const [, end] = await r.getRewardEpochIdsWithClaimableRewards();
    const tx = await r.claim(pdaAddress, pdaAddress, end, true, []);

    const duration = 3.5 * 24 * 60 * 60 * 1000;
    const endTime = Date.now() + duration;
    localStorage.setItem("claim_countdown_end", endTime.toString());
    setTimeLeft(Math.floor(duration / 1000));

    return tx;
  });

  const handleWrap = (isWrap) => execute(isWrap ? "Wrap" : "Unwrap", async () => {
    const s = await (getProvider()).getSigner();
    const w = new ethers.Contract(WNAT, ["function deposit() payable", "function withdraw(uint256)"], s);
    const val = ethers.parseEther(walletAmount || "0");
    return isWrap ? w.deposit({ value: val }) : w.withdraw(val);
  });

  const handleToPDA = () => execute("Nạp PDA", async () => {
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
    container: { boxSizing: 'border-box', padding: "24px", maxWidth: "420px", margin: "20px auto", background: COLORS.DARK, color: "white", borderRadius: "32px", border: `1px solid ${COLORS.BORDER}`, fontFamily: "sans-serif", position: 'relative', overflow: "hidden" },
    card: { boxSizing: 'border-box', background: COLORS.SURFACE, padding: "20px", borderRadius: "24px", marginBottom: "16px", border: "1px solid #1f1f1f" },
    label: { fontSize: "11px", color: COLORS.TEXT_MUTE, fontWeight: "800", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" },
    input: { flex: 1, padding: "12px", borderRadius: "14px", background: "#080808", color: "white", border: "1px solid #222", outline: "none" },
    btn: { padding: "12px", borderRadius: "14px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "12px" },
    tickerWrap: { width: 'calc(100% + 48px)', overflow: 'hidden', background: '#0a0a0a', borderTop: `1px solid ${COLORS.BORDER}`, borderBottom: `1px solid ${COLORS.BORDER}`, padding: '12px 0', margin: '15px -24px 25px -24px' },
    ticker: { display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 50s linear infinite', paddingLeft: '100%' },
    assetName: { fontWeight: '800', marginRight: '6px' },
    assetPrice: { color: COLORS.PRICE_GREEN, marginRight: '35px', fontFamily: 'monospace', fontSize: '14px' },
    qrOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    qrContainer: { background: 'white', padding: '15px', borderRadius: '24px', marginBottom: '20px', boxShadow: `0 0 30px ${COLORS.PINK}44` },
    copyBadge: { background: '#161616', padding: '12px 18px', borderRadius: '16px', border: `1px solid ${COLORS.BORDER}`, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', maxWidth: '100%' }
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }`}</style>

      {showQR && (
        <div style={styles.qrOverlay} onClick={() => setShowQR(false)}>
           <div style={styles.qrContainer} onClick={(e) => e.stopPropagation()}>
              <QRCodeSVG value={account} size={220} />
           </div>
           
           <div 
              style={styles.copyBadge} 
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            >
              <span style={{ color: copied ? COLORS.PRICE_GREEN : COLORS.PINK, fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {account}
              </span>
              <span style={{ fontSize: '14px' }}>{copied ? "✅" : "📋"}</span>
           </div>
           <div style={{ fontSize: '10px', color: COLORS.TEXT_MUTE, marginTop: '8px', marginBottom: '25px' }}>
              {copied ? "Address copied to clipboard!" : "Click the address to copy"}
           </div>

           <button onClick={() => setShowQR(false)} style={{ ...styles.btn, background: COLORS.PINK, color: 'white', padding: '12px 40px', borderRadius: '20px' }}>CLOSE</button>
        </div>
      )}

      <header style={{ textAlign: 'center', marginBottom: '10px', marginTop: '5px' }}>
        <h2 style={{ color: COLORS.PINK, letterSpacing: '3px', margin: 0 }}>OZPRO FLARE <span style={{ fontWeight: 300, color: '#fff' }}>MANAGER </span></h2>
        
        {account && (
          <div 
            onClick={() => setShowQR(true)}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#161616', 
              padding: '6px 14px', borderRadius: '20px', border: `1px solid ${COLORS.BORDER}`, 
              marginTop: '12px', cursor: 'pointer', transition: '0.2s' 
            }}
          >
            <span style={{ fontSize: '12px', color: COLORS.PINK, fontWeight: 'bold' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
            <span style={{ fontSize: '14px' }}>🔍</span>
          </div>
        )}
      </header>

      <div style={styles.tickerWrap}>
        <div style={styles.ticker}>
          <span style={{ ...styles.assetName, color: '#F7931A' }}>BTC</span><span style={styles.assetPrice}>${prices.btc.toLocaleString()}</span>
          <span style={{ ...styles.assetName, color: '#627EEA' }}>ETH</span><span style={styles.assetPrice}>${prices.eth.toLocaleString()}</span>
          <span style={{ ...styles.assetName, color: '#23292F', background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>XRP</span><span style={styles.assetPrice}>${prices.xrp}</span>
          <span style={{ ...styles.assetName, color: COLORS.PINK }}>FLR</span><span style={styles.assetPrice}>${prices.flr}</span>
          <span style={{ ...styles.assetName, color: '#00ADEF' }}>SGB</span><span style={styles.assetPrice}>${prices.sgb}</span>
          <span style={{ ...styles.assetName, color: '#345D9D' }}>LTC</span><span style={styles.assetPrice}>${prices.ltc}</span>
          <span style={{ ...styles.assetName, color: '#C2A633' }}>DOGE</span><span style={styles.assetPrice}>${prices.doge}</span>
        </div>
      </div>

      {!account ? (
        <button onClick={connect} style={{ ...styles.btn, width: '100%', background: COLORS.PINK, color: 'white', padding: '18px' }}>KẾT NỐI VÍ METAMASK</button>
      ) : (
        <>
          <section style={{ ...styles.card, border: `2px solid ${COLORS.PINK}44` }}>
            <div style={{ ...styles.label, color: COLORS.PINK }}>MAIN WALLET</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <div><div style={{ fontSize: 24, fontWeight: '900' }}>{Number(balances.flr).toFixed(2)} <small style={{ fontSize: 18, color: COLORS.PINK }}> FLR</small></div><div style={{ fontSize: 12, color: COLORS.TEXT_MUTE }}>{toUSD(balances.flr)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: '900' }}>{Number(balances.wflr).toLocaleString()} <small style={{ fontSize: 18, color: COLORS.PINK }}> WFLR</small></div><div style={{ fontSize: 12, color: COLORS.TEXT_MUTE }}>{toUSD(balances.wflr)}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} style={styles.input} placeholder="Số FLR/WFLR..." />
              <button onClick={() => setWalletAmount(balances.flr)} style={{ ...styles.btn, background: COLORS.PINK, color: 'white' }}>MAX</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
              <button onClick={() => handleWrap(true)} style={{ ...styles.btn, background: COLORS.PINK, color: 'white' }}>WRAP</button>
              <button onClick={() => handleWrap(false)} style={{ ...styles.btn, background: COLORS.PINK, color: 'white' }}>UNWRAP</button>
              <button onClick={handleToPDA} style={{ ...styles.btn, background: COLORS.PINK, color: 'yellow' }}>NẠP PDA</button>
            </div>
          </section>

          <section style={{ ...styles.card, border: `2px solid ${COLORS.AMBER}44` }}>
            <div style={{ ...styles.label, color: COLORS.AMBER }}>DELEGATION ACCOUNT (PDA)</div>
            
            {(!isActivated && balances.pdaWflr === "0") ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <p style={{ fontSize: '11px', color: COLORS.TEXT_MUTE, marginBottom: '15px' }}>Tài khoản PDA chưa được kích hoạt.</p>
                <button onClick={handleEnablePDA} style={{ ...styles.btn, width: '100%', background: COLORS.AMBER, color: 'black' }}>⚡ KÍCH HOẠT PDA</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 15 }}><div style={{ fontSize: 24, fontWeight: '900' }}>{Number(balances.pdaWflr).toLocaleString()} <small style={{ color: COLORS.AMBER, fontSize: 18 }}> WFLR</small></div><div style={{ fontSize: 12, color: COLORS.TEXT_MUTE }}>{toUSD(balances.pdaWflr)}</div></div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input type="number" value={pdaAmount} onChange={(e) => setPdaAmount(e.target.value)} style={styles.input} placeholder="Số lượng rút..." />
                  <button onClick={() => setPdaAmount(balances.pdaWflr)} style={{ ...styles.btn, background: COLORS.AMBER, color: 'black' }}>MAX</button>
                </div>
                <button onClick={handleWithdrawPDA} style={{ ...styles.btn, width: '100%', background: COLORS.AMBER, color: COLORS.PINK, border: `3px solid ${COLORS.AMBER}66`, marginBottom: 20 }}>⤺ RÚT WFLR VỀ MAIN WALLET</button>

                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '16px',
                  borderRadius: '20px',
                  border: `1px solid ${timeLeft > 0 ? COLORS.BORDER : COLORS.PINK + '44'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: timeLeft > 0 ? COLORS.TEXT_MUTE : COLORS.PINK, fontWeight: '800', marginBottom: '4px' }}>
                        {timeLeft > 0 ? "NEXT REWARD CYCLE" : "UNCLAIMED REWARDS"}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '900' }}>
                        {timeLeft > 0 ? renderCountdown(timeLeft) : <span style={{ color: COLORS.PRICE_GREEN }}>+{Number(balances.reward).toFixed(2)} FLR</span>}
                      </div>
                    </div>
                    <button
                      onClick={handleClaim}
                      disabled={Number(balances.reward) <= 0}
                      style={{
                        ...styles.btn,
                        minWidth: '85px',
                        background: timeLeft > 0 ? "transparent" : COLORS.AMBER,
                        color: timeLeft > 0 ? COLORS.TEXT_MUTE : 'black',
                        border: timeLeft > 0 ? `1px solid ${COLORS.BORDER}` : 'none'
                      }}
                    >
                      {timeLeft > 0 ? "LOCKED" : "CLAIM"}
                    </button>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: '#222', borderRadius: '10px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(0, 100 - (timeLeft / CYCLE_SECONDS * 100))}%`,
                      height: '100%',
                      background: timeLeft > 0 ? COLORS.PINK : COLORS.PRICE_GREEN,
                      transition: 'width 1s linear'
                    }} />
                  </div>
                </div>
              </>
            )}
          </section>

          <section style={{ ...styles.card, border: `2px solid ${COLORS.PINK}44` }}>
            <div style={styles.label}>Delegations ({delegations.length}/2)</div>
            {delegations.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #222' }}>
                <div><div style={{ fontWeight: 'bold' }}>{d.name}</div><div style={{ fontSize: 11, color: COLORS.PINK }}>{d.pct}% Power</div></div>
                <button onClick={() => handleDelegate(d.addr, 0)} style={{ background: '#ff444411', border: 'none', color: '#ff4444', padding: '5px 10px', borderRadius: 8 }}>✕</button>
              </div>
            ))}

            <div ref={dropdownRef} style={{ position: 'relative', marginTop: 12 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, color: COLORS.TEXT_MUTE }}>🔍</span>
                <input
                  type="text" placeholder="Tìm Provider..." value={providerSearch}
                  onFocus={() => setShowDropdown(true)} onChange={(e) => setProviderSearch(e.target.value)}
                  style={{ ...styles.input, paddingLeft: 35, width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {showDropdown && (
                <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: '#181818', borderRadius: 15, border: '1px solid #333', maxHeight: 150, overflowY: 'auto', zIndex: 100, boxShadow: '0 -10px 20px rgba(0,0,0,0.5)' }}>
                  {filteredProviders.map(p => (
                    <div key={p.address} onClick={() => { setPendingProvider(p); setProviderSearch(p.name); setShowDropdown(false); }} style={{ padding: 12, fontSize: 13, borderBottom: '1px solid #222', cursor: 'pointer' }}>{p.name} <span style={{ color: COLORS.PINK, float: 'right' }}>50%</span></div>
                  ))}
                </div>
              )}

              {pendingProvider && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(227, 24, 100, 0.1)', borderRadius: 16, border: `1px dashed ${COLORS.PINK}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, marginBottom: 8 }}>Ủy quyền cho <b>{pendingProvider.name}</b>?</div>
                  <button onClick={() => handleDelegate(pendingProvider.address, 50)} style={{ ...styles.btn, background: COLORS.PINK, color: 'white', width: '100%', padding: '10px' }}>KÝ XÁC NHẬN (50%)</button>
                  <div onClick={() => { setPendingProvider(null); setProviderSearch(""); }} style={{ fontSize: 10, marginTop: 8, color: COLORS.TEXT_MUTE, cursor: 'pointer', textDecoration: 'underline' }}>Hủy chọn</div>
                </div>
              )}
            </div>
          </section>

          <div style={{ textAlign: 'center', fontSize: 11, color: COLORS.PINK, fontWeight: 'bold' }}>● {status.toUpperCase()}</div>
        </>
      )}
    </div>
  );
}
