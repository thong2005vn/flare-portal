import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

// --- CẤU HÌNH HỆ THỐNG FLARE ---
const WNAT = "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d";
const REWARD_MANAGER = "0xC8f55c5aA2C752eE285Bd872855C749f4ee6239B";
const CLAIM_SETUP_MANAGER = "0xD56c0Ea37B848939B59e6F5Cda119b3fA473b5eB";

const FLARE_PARAMS = {
  chainId: 14, 
  chainName: "Flare Mainnet",
  nativeCurrency: { name: "Flare", symbol: "FLR", decimals: 18 },
  rpcUrls: ["https://flare-api.flare.network/ext/C/rpc"],
  blockExplorerUrls: ["https://flare-explorer.flare.network/"]
};

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
  { name: "FTSO Paris", address: "0x085841b253590281cc5c5222b09d4e59a605e774" },
  { name: "FTSO Asia", address: "0xdd7b2bac728f027f23add7128711ecb60f761ad5" },
  { name: "ITB Validator", address: "0x2e8320b92b640cf8cbdeaffbe70d4bc407303b9f" },
  { name: "HEWG", address: "0xb6d68ea6c4de734ec481f92afd1c35f712441b73" },
  { name: "uGaenn", address: "0xe3a76233885e355cfaf141d7dd3d92705c9db4d5" },
  { name: "Resonance", address: "0x62571de064cac560207b7116c6d87c818f7376cc" },
  { name: "sToadz FTSO", address: "0x729589694a78ff2d8bacf75b7ac4389bd53ee533" },
  { name: "Flare Bank", address: "0xfa9368cfbee3b070d8552d8e75cdc0ff72efac50" },
  { name: "Bushido FTSO", address: "0xc7cf3238d2ca63d01ad4d42b4ccb9db8b0ade702" },
  { name: "FlareBus", address: "0x6c5c813dd19f071be0b6e83701955810f118e717" },
  { name: "Knot Nodes", address: "0xf33a0ac50f2e85737af577ea68583f264c7a1f78" },
  { name: "Juice Nodes", address: "0xce73ade61b0d0100ba1507d9fa1dc2fea3046578" },
  { name: "True FTSO", address: "0xb6ded9d9ca19af10c67f9a8be8ca75e38e166faa" },
  { name: "Wonderftso", address: "0x4c1f288cafecbbdac653c2170337c38e62c400e9" },
  { name: "HP/Mana Nodes", address: "0xf61b94dedc5f23398997d73b7701d67556eaad6f" },
  { name: "FTSOCAN", address: "0x9e55a49d251324b1623dc2a81894d1afbfb8bbdc" },
  { name: "Last Oracle", address: "0x535268cb19f2cc0c65d463be6ab7751ff4e9fc07" },
  { name: "Sun-Dara", address: "0x1e8f916ce03f4ce86186531a8994d366581ed4be" },
  { name: "Chainbase Staking", address: "0x6434b1ed626585d3e58e995ad3c2cc0d6718755c" },
  { name: "Cottage Nodes", address: "0x6ebbd69832af87434253c10f9045e012286f509e" },
  { name: "African Proofs", address: "0x7808b9e0f7c488172b54b30f98c2fcf36d903b2c" },
  { name: "FTSOBest", address: "0xc396b6f023f3a1c894a20fba08432e847c05c7f9" },
  { name: "Digital Dynamix", address: "0x57711d552e2309c7a83716351e7a59a438f17e3a" },
  { name: "Aternety", address: "0xd3956f862a4960bb4937e596a2baecffcbb4b3e0" },
  { name: "Envision", address: "0x9b42b895d2a10d048eaf4996fdf93aebf59167bf" },
  { name: "DataVector", address: "0xcaa49c97318b6bb62b7f9241891d70f87fc05d35" },
  { name: "Flare Sensei", address: "0x2566e97b2947dc2d6e9caf0bf737aabd7e78a0f6" },
  { name: "LightFTSO", address: "0xa9c69eb9de79188a9aba46c5336607f88a80ec89" },
  { name: "FlareBase", address: "0xac2884a4479bf7c21aa0462d52bc9c76c3a9a3dd" },
  { name: "InfStones", address: "0xb1aa0f2691db6bbb2969efc7be70787f58dd2461" },
  { name: "SenseiNode", address: "0xe08898b7b8b18dbcddcc6339c8b9c19effa81413" },
  { name: "Flaris", address: "0xf8b1dcf2594afd082aae088661bf574cb9bbdc61" },
  { name: "Stakeway", address: "0xf26be97eb0d7a9fbf8d67f813d3be411445885ce" },
  { name: "Use Your Spark", address: "0xa288054b230dcbb8689ac229d6dbd7df39203181" }
];

// 🌐 CẤU HÌNH WEB3MODAL - SỬA LỖI TREO QR CODE TRÊN VERCEL & LOCALHOST
const projectId = "60e0395fcb2e23586895a5b421c97875";
const metadata = {
  name: "FLARE OZPRO PORTAL",
  description: "Flare Delegation Account Rewards Manager",
  // Sử dụng window.location.origin tự động để tránh lệch Domain khi chạy trên Vercel/4G
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

const flareNetworkConfig = {
  chainId: FLARE_PARAMS.chainId,
  name: FLARE_PARAMS.chainName,
  currency: "FLR",
  explorerUrl: FLARE_PARAMS.blockExplorerUrls[0],
  rpcUrl: FLARE_PARAMS.rpcUrls[0]
};

const modal = createWeb3Modal({
  ethersConfig: defaultConfig({ 
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: false
  }),
  chains: [flareNetworkConfig],
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': '9999'
  }
});

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
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- QUẢN LÝ VÍ ---
  const [walletType, setWalletType] = useState(""); 
  const [customEthersProvider, setCustomEthersProvider] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false); 

  const dropdownRef = useRef(null);
  const CYCLE_SECONDS = 3.5 * 24 * 3600;

  const getProvider = useCallback(() => {
    if (walletType === "metamask" && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    if (walletType === "walletconnect" && customEthersProvider) {
      return customEthersProvider;
    }
    return null;
  }, [walletType, customEthersProvider]);

  const ensureFlareNetwork = async () => {
    if (walletType === "walletconnect") return true; 
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xe") {
        setShowNetworkModal(true);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleSwitchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xe" }],
      });
      setShowNetworkModal(false);
    } catch (err) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xe",
              chainName: FLARE_PARAMS.chainName,
              nativeCurrency: FLARE_PARAMS.nativeCurrency,
              rpcUrls: FLARE_PARAMS.rpcUrls,
              blockExplorerUrls: FLARE_PARAMS.blockExplorerUrls
            }],
          });
          setShowNetworkModal(false);
        } catch (addErr) {
          console.error(addErr);
        }
      }
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = "#080808"; 
    document.body.style.margin = "0";
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

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

  useEffect(() => {
    const getAllPrices = async () => {
      try {
        const ids = "bitcoin,ethereum,ripple,flare-networks,songbird,litecoin,dogecoin";
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        const data = await res.json();
        setPrices({
          btc: data["bitcoin"]?.usd || 0, 
          eth: data["ethereum"]?.usd || 0, 
          xrp: data["ripple"]?.usd || 0,
          flr: data["flare-networks"]?.usd || 0, 
          sgb: data["songbird"]?.usd || 0,
          ltc: data["litecoin"]?.usd || 0, 
          doge: data["dogecoin"]?.usd || 0
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

  const refreshData = useCallback(async (addr, pda, explicitProvider = null) => {
    if (!addr || !pda) return;
    const p = explicitProvider || getProvider();
    if (!p) return;
    try {
      let activated = false;
      try {
        const pdaContract = new ethers.Contract(pda, ["function owner() view returns (address)"], p);
        const pdaOwner = await pdaContract.owner();
        activated = (pdaOwner.toLowerCase() === addr.toLowerCase());
      } catch (e) {
        activated = false;
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
          if (Array.isArray(epochArray)) {
            epochArray.forEach(state => { totalRewardWei += BigInt(state[2]); });
          }
        });
      }

      setIsActivated(activated);
      setBalances({ flr: ethers.formatEther(f), wflr: ethers.formatEther(w), pdaWflr: ethers.formatEther(pw), reward: ethers.formatEther(totalRewardWei) });

      const [addresses, bips] = del;
      const currentDels = [];
      if (addresses && addresses.length > 0) {
        addresses.forEach((delegateAddr, i) => {
          if (delegateAddr !== ethers.ZeroAddress && bips[i] > 0n) {
            const pInfo = PROVIDERS.find(prov => prov.address.toLowerCase() === delegateAddr.toLowerCase());
            currentDels.push({ 
              name: pInfo ? pInfo.name : `${delegateAddr.slice(0, 6)}...`, 
              addr: delegateAddr, 
              pct: Number(bips[i]) / 100 
            });
          }
        });
      }
      setDelegations(currentDels);
    } catch (e) { console.error(e); }
  }, [getProvider]);

  const execute = async (label, action) => {
    const isOk = await ensureFlareNetwork();
    if (!isOk) return;
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
      if (e?.code === "ACTION_REJECTED" || e?.code === 4001) setStatus("❌ Người dùng từ chối");
      else setStatus(`❌ Lỗi: ${e?.reason || "Giao dịch thất bại"}`);
    }
  };

  // --- 🦊 LUỒNG METAMASK ---
  const connectMetaMask = async () => {
    if (!window.ethereum) return alert("Cài MetaMask!");
    setWalletType("metamask");
    setShowConnectModal(false);
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xe") {
        setShowNetworkModal(true);
        return;
      }
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accs[0];
      setAccount(addr);

      const p = new ethers.BrowserProvider(window.ethereum);
      const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], p);
      const pda = await csm.accountToDelegationAccount(addr);
      setPdaAddress(pda);
      setStatus("✅ Đã kết nối ví MetaMask");

      setTimeout(() => refreshData(addr, pda, p), 200);
    } catch (err) {
      console.error(err);
      setStatus("❌ Kết nối thất bại");
    }
  };

  useEffect(() => {
    if (walletType !== "metamask" || !window.ethereum) return;
    const handleAccountsChanged = async (newAccs) => {
      if (newAccs.length === 0) disconnect();
      else {
        const addr = newAccs[0];
        setAccount(addr);
        const p = new ethers.BrowserProvider(window.ethereum);
        const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], p);
        const pda = await csm.accountToDelegationAccount(addr);
        setPdaAddress(pda);
        refreshData(addr, pda, p);
      }
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [walletType, refreshData]);

  // --- 📱 LUỒNG WALLETCONNECT ÉP BUỘC GENERATE QR ---
  const connectEllipal = async () => {
    try {
      setStatus("⏳ Đang kết nối Web3Modal...");
      setShowConnectModal(false); 
      
      // Sử dụng phương thức open trực tiếp với cấu hình view quét mã QR
      await modal.open({ view: 'Connect' });

      const checkConnection = setInterval(async () => {
        if (modal.getIsConnected()) {
          clearInterval(checkConnection);
          
          const walletProvider = modal.getWalletProvider();
          const p = new ethers.BrowserProvider(walletProvider);
          const signer = await p.getSigner();
          const addr = await signer.getAddress();

          setWalletType("walletconnect");
          setCustomEthersProvider(p);
          setAccount(addr);

          const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function accountToDelegationAccount(address) view returns (address)"], p);
          const pda = await csm.accountToDelegationAccount(addr);
          setPdaAddress(pda);
          setStatus("✅ Đã kết nối Ellipal thành công!");

          setTimeout(() => refreshData(addr, pda, p), 200);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setStatus("❌ Kết nối Ellipal thất bại");
    }
  };

  const disconnect = async () => {
    if (walletType === "walletconnect") {
      try { await modal.disconnect(); } catch (e) { console.error(e); }
    }
    setAccount("");
    setPdaAddress("");
    setWalletType("");
    setCustomEthersProvider(null);
    setIsActivated(false);
    setBalances({ flr: "0", wflr: "0", pdaWflr: "0", reward: "0" });
    setDelegations([]);
    setStatus("Đã ngắt kết nối");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExplorer = (addr) => {
    if (!addr) return;
    window.open(`${FLARE_PARAMS.blockExplorerUrls[0]}address/${addr}`, "_blank", "noopener,noreferrer");
  };

  const handleEnablePDA = () => execute("Kích hoạt PDA", async () => {
    const p = getProvider();
    const s = await p.getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function enableDelegationAccount() external returns (address)"], s);
    return csm.enableDelegationAccount();
  });

  const handleWithdrawPDA = () => execute("Rút PDA", async () => {
    const p = getProvider();
    const s = await p.getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function withdraw(uint256) external"], s);
    return csm.withdraw(ethers.parseEther(pdaAmount || "0"));
  });

  const handleClaim = () => execute("Nhận thưởng", async () => {
    const p = getProvider();
    const s = await p.getSigner();
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
    const p = getProvider();
    const s = await p.getSigner();
    const w = new ethers.Contract(WNAT, ["function deposit() payable", "function withdraw(uint256)"], s);
    const val = ethers.parseEther(walletAmount || "0");
    return isWrap ? w.deposit({ value: val }) : w.withdraw(val);
  });

  const handleToPDA = () => execute("Nạp PDA", async () => {
    const p = getProvider();
    const s = await p.getSigner();
    const w = new ethers.Contract(WNAT, ["function transfer(address,uint256)"], s);
    return w.transfer(pdaAddress, ethers.parseEther(walletAmount || "0"));
  });

  const handleDelegate = (target, pct = 50) => execute(pct === 0 ? "Hủy" : "Ủy quyền", async () => {
    const p = getProvider();
    const s = await p.getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function delegate(address,uint256) external"], s);
    return csm.delegate(target, pct * 100);
  });

  const handleUndelegateAll = () => execute("Hủy toàn bộ", async () => {
    const p = getProvider();
    const s = await p.getSigner();
    const csm = new ethers.Contract(CLAIM_SETUP_MANAGER, ["function undelegateAll() external"], s);
    return csm.undelegateAll();
  });

  const filteredProviders = useMemo(() =>
    PROVIDERS.filter(p => p.name.toLowerCase().includes(providerSearch.toLowerCase())),
    [providerSearch]);

  const styles = {
    container: { boxSizing: 'border-box', padding: "24px", maxWidth: "420px", margin: "40px auto", background: COLORS.DARK, color: "white", borderRadius: "32px", border: `1px solid ${COLORS.BORDER}`, boxShadow: `0 0 40px 10px ${COLORS.PINK}22, 0 0 100px 30px ${COLORS.PINK}0a`, fontFamily: "sans-serif", position: 'relative', overflow: "hidden" },
    card: { boxSizing: 'border-box', background: COLORS.SURFACE, padding: "20px", borderRadius: "24px", marginBottom: "16px", border: "1px solid #1f1f1f" },
    label: { fontSize: "11px", color: COLORS.TEXT_MUTE, fontWeight: "800", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" },
    input: { flex: 1, padding: "12px", borderRadius: "14px", background: "#080808", color: "white", border: "1px solid #222", outline: "none" },
    btnBase: { padding: "12px", borderRadius: "14px", border: "1px solid transparent", cursor: "pointer", fontWeight: "bold", fontSize: "12px", transition: "all 0.3s ease" },
    tickerWrap: { width: 'calc(100% + 48px)', overflow: 'hidden', background: '#0a0a0a', borderTop: `1px solid ${COLORS.BORDER}`, borderBottom: `1px solid ${COLORS.BORDER}`, padding: '12px 0', margin: '15px -24px 25px -24px' },
    ticker: { display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 50s linear infinite', paddingLeft: '100%' },
    assetName: { fontWeight: '800', marginRight: '6px' },
    assetPrice: { color: COLORS.PRICE_GREEN, marginRight: '35px', fontFamily: 'monospace', fontSize: '14px' },
    qrOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    qrContainer: { background: 'white', padding: '15px', borderRadius: '24px', marginBottom: '20px', boxShadow: `0 0 30px ${COLORS.PINK}44` },
    copyBadge: { background: '#161616', padding: '12px 18px', borderRadius: '16px', border: `1px solid ${COLORS.BORDER}`, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', maxWidth: '100%' },
    networkModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', textAlign: 'center' },
    pdaBadge: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a', color: COLORS.AMBER, padding: '8px 12px', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace', cursor: 'pointer', border: '1px solid #222', marginTop: '-6px', marginBottom: '15px' },
    logoutBtn: { background: 'transparent', border: `1px solid ${COLORS.BORDER}`, color: COLORS.TEXT_MUTE, borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.2s' },
    undelegateBtn: { background: 'transparent', color: COLORS.PINK, border: `1px solid ${COLORS.PINK}44`, fontSize: '9px', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    scanBtn: { display: 'inline-flex', alignItems: 'center', background: '#161616', color: COLORS.TEXT_MUTE, border: `1px solid ${COLORS.BORDER}`, borderRadius: '20px', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }
  };

  const makeGlowEffect = (e, baseColor, isHover, textColor = "white") => {
    if (isHover) {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.borderColor = baseColor;
      e.currentTarget.style.color = baseColor;
      e.currentTarget.style.boxShadow = `0 0 15px ${baseColor}88`;
    } else {
      e.currentTarget.style.background = baseColor;
      e.currentTarget.style.borderColor = "transparent";
      e.currentTarget.style.color = textColor;
      e.currentTarget.style.boxShadow = "none";
    }
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }`}</style>

      {showNetworkModal && (
        <div style={styles.networkModal}>
          <div style={{ background: COLORS.SURFACE, border: `1px solid ${COLORS.PINK}`, padding: '30px', borderRadius: '24px', maxWidth: '300px' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🌐</div>
            <h3 style={{ margin: '0 0 10px 0' }}>SAI MẠNG KẾT NỐI</h3>
            <p style={{ fontSize: '13px', color: COLORS.TEXT_MUTE, marginBottom: '20px' }}>Ứng dụng yêu cầu mạng <b>Flare Mainnet</b> để hoạt động.</p>
            <button 
              onClick={handleSwitchNetwork} 
              style={{ ...styles.btnBase, background: COLORS.PINK, color: 'white', width: '100%', padding: '15px' }}
              onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
              onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
            >
              CHUYỂN SANG FLARE
            </button>
          </div>
        </div>
      )}

      {showConnectModal && (
        <div style={styles.networkModal} onClick={() => setShowConnectModal(false)}>
          <div style={{ background: COLORS.SURFACE, border: `1px solid ${COLORS.BORDER}`, padding: '25px', borderRadius: '24px', width: '320px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>CHỌN PHƯƠNG THỨC KẾT NỐI</h3>
            
            <button 
              onClick={connectMetaMask} 
              style={{ ...styles.btnBase, background: '#161616', color: 'white', width: '100%', padding: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #222' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = COLORS.PINK; e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.PINK}44`; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>🦊 MetaMask (Extension)</span>
              <span style={{ fontSize: '10px', color: COLORS.TEXT_MUTE }}>Browser</span>
            </button>

            <button 
              onClick={connectEllipal} 
              style={{ ...styles.btnBase, background: '#161616', color: 'white', width: '100%', padding: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #222' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = COLORS.AMBER; e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.AMBER}44`; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span>📱 Ellipal App (WalletConnect)</span>
              <span style={{ fontSize: '10px', color: COLORS.TEXT_MUTE }}>QR Code</span>
            </button>

            <div onClick={() => setShowConnectModal(false)} style={{ fontSize: '12px', color: COLORS.TEXT_MUTE, cursor: 'pointer', textDecoration: 'underline' }}>Đóng</div>
          </div>
        </div>
      )}

      {showQR && (
        <div style={styles.qrOverlay} onClick={() => setShowQR(false)}>
            <div style={styles.qrContainer} onClick={(e) => e.stopPropagation()}>
               <QRCodeSVG value={account} size={220} />
            </div>
            <div style={styles.copyBadge} onClick={(e) => { e.stopPropagation(); handleCopy(account); }}>
               <span style={{ color: copied ? COLORS.PRICE_GREEN : COLORS.PINK, fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account}</span>
               <span style={{ fontSize: '14px' }}>{copied ? "✅" : "📋"}</span>
            </div>
            <div style={{ fontSize: '10px', color: COLORS.TEXT_MUTE, marginTop: '8px', marginBottom: '25px' }}>{copied ? "Địa chỉ đã được copy!" : "Click vào địa chỉ để copy"}</div>
            <button 
              onClick={() => setShowQR(false)} 
              style={{ ...styles.btnBase, background: COLORS.PINK, color: 'white', padding: '12px 40px', borderRadius: '20px' }}
              onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
              onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
            >
              ĐÓNG
            </button>
        </div>
      )}

      <header style={{ textAlign: 'center', marginBottom: '10px', marginTop: '5px' }}>
        <h2 style={{ color: COLORS.PINK, letterSpacing: '3px', margin: 0 }}>OZPRO FLARE <span style={{ fontWeight: 300, color: '#fff' }}>MANAGER </span></h2>
        {account && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
            <div onClick={() => setShowQR(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#161616', padding: '6px 14px', borderRadius: '20px', border: `1px solid ${COLORS.BORDER}`, cursor: 'pointer' }}>
              <span style={{ fontSize: '12px', color: COLORS.PINK, fontWeight: 'bold' }}>{account.slice(0, 6)}...{account.slice(-4)}</span>
              <span style={{ fontSize: '12px' }}>📲</span>
            </div>
            
            <button 
              onClick={() => handleOpenExplorer(account)} 
              style={styles.scanBtn}
              onMouseOver={(e) => { e.currentTarget.style.color = COLORS.PRICE_GREEN; e.currentTarget.style.borderColor = COLORS.PRICE_GREEN; e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.PRICE_GREEN}55`; }}
              onMouseOut={(e) => { e.currentTarget.style.color = COLORS.TEXT_MUTE; e.currentTarget.style.borderColor = COLORS.BORDER; e.currentTarget.style.boxShadow = "none"; }}
            >
              🔍 Scan
            </button>

            <button 
              onClick={disconnect} 
              style={styles.logoutBtn}
              onMouseOver={(e) => { e.currentTarget.style.color = COLORS.PINK; e.currentTarget.style.borderColor = COLORS.PINK; e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.PINK}55`; }}
              onMouseOut={(e) => { e.currentTarget.style.color = COLORS.TEXT_MUTE; e.currentTarget.style.borderColor = COLORS.BORDER; e.currentTarget.style.boxShadow = "none"; }}
            >
              Logout
            </button>
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
        <button 
          onClick={() => setShowConnectModal(true)} 
          style={{ ...styles.btnBase, width: '100%', background: COLORS.PINK, color: 'white', padding: '18px' }}
          onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
          onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
        >
          KẾT NỐI VÍ CỦA BẠN
        </button>
      ) : (
        <>
          <section style={{ ...styles.card, border: `2px solid ${COLORS.PINK}44` }}>
            <div style={{ ...styles.label, color: COLORS.PINK }}>MAIN WALLET</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
              <div><div style={{ fontSize: 24, fontWeight: '900' }}>{Number(balances.flr).toLocaleString()} <small style={{ fontSize: 18, color: COLORS.PINK }}> FLR</small></div><div style={{ fontSize: 12, color: COLORS.TEXT_MUTE }}>{toUSD(balances.flr)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: '900' }}>{Number(balances.wflr).toLocaleString()} <small style={{ fontSize: 18, color: COLORS.PINK }}> WFLR</small></div><div style={{ fontSize: 12, color: COLORS.TEXT_MUTE }}>{toUSD(balances.wflr)}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} style={styles.input} placeholder="Điền số FLR/WFLR..." />
              <button 
                onClick={() => setWalletAmount(balances.flr)} 
                style={{ ...styles.btnBase, background: COLORS.PINK, color: 'white' }}
                onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
                onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
              >
                MAX
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
              <button 
                onClick={() => handleWrap(true)} 
                style={{ ...styles.btnBase, background: COLORS.PINK, color: 'white' }}
                onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
                onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
              >
                WRAP
              </button>
              <button 
                onClick={() => handleWrap(false)} 
                style={{ ...styles.btnBase, background: COLORS.PINK, color: 'white' }}
                onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
                onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
              >
                UNWRAP
              </button>
              <button 
                onClick={handleToPDA} 
                style={{ ...styles.btnBase, background: COLORS.PINK, color: 'yellow' }}
                onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true, "yellow")}
                onMouseOut={(e) => {
                  makeGlowEffect(e, COLORS.PINK, false);
                  e.currentTarget.style.color = "yellow";
                }}
              >
                NẠP PDA
              </button>
            </div>
          </section>

          <section style={{ ...styles.card, border: `2px solid ${COLORS.AMBER}44` }}>
            <div style={{ ...styles.label, color: COLORS.AMBER }}>DELEGATION ACCOUNT (PDA)</div>
            
            {pdaAddress && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a', color: COLORS.AMBER, padding: '8px 12px', borderRadius: '10px', fontSize: '10px', fontFamily: 'monospace', cursor: 'pointer', border: '1px solid #222', marginTop: '-6px', marginBottom: '15px' }} onClick={() => handleCopy(pdaAddress)} title="Click to copy">
                <span style={{ opacity: 0.7 }}>Address:</span>
                <span style={{ fontWeight: 'bold' }}>{pdaAddress.slice(0, 10)}...{pdaAddress.slice(-8)} 📋</span>
              </div>
            )}

            {!isActivated ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <p style={{ fontSize: '12px', color: COLORS.AMBER, marginBottom: '15px', lineHeight: '1.5' }}>
                  Tài khoản PDA của bạn chưa được khởi tạo.<br/>Vui lòng kích hoạt để bắt đầu.
                </p>
                <button 
                  onClick={handleEnablePDA} 
                  style={{ ...styles.btnBase, width: '100%', background: COLORS.AMBER, color: 'black', fontSize: '13px', padding: '15px' }}
                  onMouseOver={(e) => makeGlowEffect(e, COLORS.AMBER, true)}
                  onMouseOut={(e) => makeGlowEffect(e, COLORS.AMBER, false, "black")}
                >
                  ⚡ KÍCH HOẠT PDA NGAY
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 15 }}><div style={{ fontSize: 24, fontWeight: '900' }}>{Number(balances.pdaWflr).toLocaleString()} <small style={{ color: COLORS.AMBER, fontSize: 18 }}> WFLR</small></div><div style={{ fontSize: 12, color: COLORS.TEXT_MUTE }}>{toUSD(balances.pdaWflr)}</div></div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input type="number" value={pdaAmount} onChange={(e) => setPdaAmount(e.target.value)} style={styles.input} placeholder="Số lượng rút..." />
                  <button 
                    onClick={() => setPdaAmount(balances.pdaWflr)} 
                    style={{ ...styles.btnBase, background: COLORS.AMBER, color: 'black' }}
                    onMouseOver={(e) => makeGlowEffect(e, COLORS.AMBER, true)}
                    onMouseOut={(e) => makeGlowEffect(e, COLORS.AMBER, false, "black")}
                  >
                    MAX
                  </button>
                </div>
                <button 
                  onClick={handleWithdrawPDA} 
                  style={{ ...styles.btnBase, width: '100%', background: COLORS.AMBER, color: COLORS.PINK, border: `3px solid ${COLORS.AMBER}66`, marginBottom: 20 }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = COLORS.AMBER;
                    e.currentTarget.style.boxShadow = `0 0 15px ${COLORS.AMBER}88`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = COLORS.AMBER;
                    e.currentTarget.style.borderColor = `${COLORS.AMBER}66`;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  ⤺ RÚT WFLR VỀ MAIN WALLET
                </button>

                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '20px', border: `1px solid ${timeLeft > 0 ? COLORS.BORDER : COLORS.PINK + '44'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: timeLeft > 0 ? COLORS.TEXT_MUTE : COLORS.AMBER, fontWeight: '800', marginBottom: '4px' }}>{timeLeft > 0 ? "NEXT REWARD CYCLE" : "UNCLAIMED REWARDS"}</div>
                      <div style={{ fontSize: '20px', fontWeight: '900' }}>{timeLeft > 0 ? renderCountdown(timeLeft) : <span style={{ color: COLORS.PRICE_GREEN }}>+{Number(balances.reward).toFixed(2)} FLR</span>}</div>
                    </div>
                    <button 
                      onClick={handleClaim} 
                      disabled={Number(balances.reward) <= 0 || timeLeft > 0} 
                      style={{ 
                        ...styles.btnBase, 
                        minWidth: '85px', 
                        background: timeLeft > 0 ? "transparent" : COLORS.AMBER, 
                        color: timeLeft > 0 ? COLORS.TEXT_MUTE : 'black', 
                        border: timeLeft > 0 ? `1px solid ${COLORS.BORDER}` : 'none' 
                      }}
                      onMouseOver={(e) => {
                        if(timeLeft <= 0 && Number(balances.reward) > 0) makeGlowEffect(e, COLORS.AMBER, true);
                      }}
                      onMouseOut={(e) => {
                        if(timeLeft <= 0 && Number(balances.reward) > 0) makeGlowEffect(e, COLORS.AMBER, false, "black");
                      }}
                    >
                      {timeLeft > 0 ? "LOCKED" : "CLAIM"}
                    </button>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: '#222', borderRadius: '10px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(0, 100 - (timeLeft / CYCLE_SECONDS * 100))}%`, height: '100%', background: timeLeft > 0 ? COLORS.PINK : COLORS.PRICE_GREEN, transition: 'width 1s linear' }} />
                  </div>
                </div>
              </>
            )}
          </section>

          <section style={{ ...styles.card, border: `2px solid ${COLORS.PINK}44` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ ...styles.label, marginBottom: 0 }}>Delegations ({delegations.length}/2)</div>
              {delegations.length > 0 && (
                <button 
                  onClick={handleUndelegateAll} 
                  style={{ ...styles.undelegateBtn, transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = `0 0 10px ${COLORS.PINK}66`; e.currentTarget.style.background = `${COLORS.PINK}22`; }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "transparent"; }}
                >
                  UNDELEGATE ALL
                </button>
              )}
            </div>
            
            {delegations.map((d, i) => (
              <div key={d.addr || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === delegations.length - 1 ? 'none' : '1px solid #222' }}>
                <div><div style={{ fontWeight: 'bold' }}>{d.name}</div><div style={{ fontSize: 11, color: COLORS.PINK }}>{d.pct}% Power</div></div>
                <button 
                  onClick={() => handleDelegate(d.addr, 0)} 
                  style={{ background: '#ff444411', border: 'none', color: '#ff4444', padding: '5px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 0 10px #ff444455"; e.currentTarget.style.background = "#ff444433"; }}
                  onMouseOut={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#ff444411"; }}
                >
                  ✕
                </button>
              </div>
            ))}
            
            {delegations.length < 2 && (
              <div ref={dropdownRef} style={{ position: 'relative', marginTop: 12 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 12, color: COLORS.TEXT_MUTE }}>🔍</span>
                  <input type="text" placeholder="Tìm Provider..." value={providerSearch} onFocus={() => setShowDropdown(true)} onChange={(e) => setProviderSearch(e.target.value)} style={{ ...styles.input, paddingLeft: 35, width: '100%', boxSizing: 'border-box' }} />
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
                    <button 
                      onClick={() => handleDelegate(pendingProvider.address, 50)} 
                      style={{ ...styles.btnBase, background: COLORS.PINK, color: 'white', width: '100%', padding: '10px' }}
                      onMouseOver={(e) => makeGlowEffect(e, COLORS.PINK, true)}
                      onMouseOut={(e) => makeGlowEffect(e, COLORS.PINK, false)}
                    >
                      KÝ XÁC NHẬN (50%)
                    </button>
                    <div onClick={() => { setPendingProvider(null); setProviderSearch(""); }} style={{ fontSize: 10, marginTop: 8, color: COLORS.TEXT_MUTE, cursor: 'pointer', textDecoration: 'underline' }}>Hủy chọn</div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div style={{ textAlign: 'center', fontSize: 11, color: COLORS.PINK, fontWeight: 'bold' }}>● {status.toUpperCase()}</div>
        </>
      )}
    </div>
  );
}
