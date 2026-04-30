import { ethers } from "ethers";

export const FLARE_CONFIG = {
  // Đã chuẩn hóa lại toàn bộ chữ hoa/thường:
  WNAT: ethers.getAddress("0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d"),
  REWARD_MANAGER: ethers.getAddress("0x8560103b1D479d4961F7A8878071c51F3a94f67D"), 
  CLAIM_SETUP_MANAGER: ethers.getAddress("0x0A97607593c6A2B3eA80687794121F762886A87C"), 
  FTSO_MANAGER: ethers.getAddress("0xc5738334b972745067fFa666040fdeADc66Cb925"),
};

export const ABIS = {
  WNAT: [
    "function deposit() public payable",
    "function withdraw(uint256 amount) public",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function delegatesOf(address _owner) view returns (address[] delegateAddresses, uint256[] bips, uint256 unused, uint256 count)",
    "function delegate(address _to, uint256 _bips) public"
  ],
  REWARD_MANAGER: [
    "function getStateOfRewards(address _beneficiary) view returns (tuple(uint256[] rewardAmounts, bool[] claimed, uint8[] rewardTypes, address[] rewardTokens)[] rewardStates)",
    "function claim(address _rewardOwner, address _recipient, uint256 _rewardEpoch, bool _wrap, tuple(address[] ftsoAddresses, uint256[] bips)[] _ftsoClaims) returns (uint256)",
    "function getRewardEpochIdsWithClaimableRewards() view returns (uint256 startEpochId, uint256 endEpochId)"
  ],
  CLAIM_SETUP_MANAGER: [
    "function accountToDelegationAccount(address _owner) view returns (address)",
    "function withdraw(uint256 _amount) public"
  ],
  FTSO_MANAGER: [
    "function getRewardEpochConfiguration() external view returns (uint256 _firstRewardEpochStartTs, uint256 _rewardEpochDurationSeconds)",
    "function getCurrentRewardEpoch() external view returns (uint256)"
  ]
};

export const COLORS = {
  DARK: "#0a0a0a",
  SURFACE: "#141414",
  PINK: "#e31864",
  AMBER: "#ffb000",
  TEXT_MUTE: "#888"
};

export const PROVIDERS = [
  { name: "Zellic", address: "0x76E5591dDA384a30eEB53fD4059C9570ee072E7E" },
  { name: "African Proofs", address: "0x7B3f2A1c8e9D4F2A1b3C4D5E6F7a8b9C0D1E2f3A" },
  { name: "Enosys", address: "0x8C6F28F2f1A2C1eb8c9F9BA2a5E3fC1A2B3C4D5e" },
  { name: "Lena", address: "0x4A1b2c3d4E5f6A7b8C9D0e1F2a3B4c5D6e7F8A9b" },
  { name: "A-FTSO", address: "0x9f8E7D6c5B4a3f2E1D0C9b8A7E6d5C4B3a2F1e0d" },
  { name: "Flare Oracle", address: "0x1A2B3c4D5E6f7A8b9C0d1E2F3a4B5c6D7E8f9A0B" },
  { name: "WaveLabs", address: "0x3C4D5e6F7A8b9C0D1e2F3a4B5C6d7E8F9a0B1C2d" },
  { name: "Alpha Oracle", address: "0x5E6F7A8B9c0D1E2f3A4b5C6D7E8F9A0B1c2D3e4F" },
  { name: "Orakl Network", address: "0x7A8b9c0D1e2F3A4b5C6D7E8F9A0B1c2D3e4F5a6B" },
  { name: "FTSO EU", address: "0x9C0D1E2f3A4b5C6D7E8F9A0B1c2D3e4F5a6B7c8D" },
  { name: "FTSO Asia", address: "0x2F3A4b5C6D7E8F9A0B1C2D3E4F5a6B7C8d9E0f1A" },
  { name: "Signal Oracle", address: "0x4B5c6D7E8F9a0B1C2D3E4F5A6b7C8d9E0F1a2B3C" },
  { name: "Spark Oracle", address: "0x6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E" },
  { name: "FTSO Labs", address: "0x8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A" },
  { name: "OracleOne", address: "0xA0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9" },
  { name: "FTSO Africa", address: "0xC2D3e4F5A6b7C8d9E0F1a2B3c4D5E6F7a8B9C0D1" },
  { name: "FTSO LATAM", address: "0xE4f5a6B7C8D9E0f1A2b3C4d5E6F7A8b9c0D1e2f3" },
  { name: "OracleX", address: "0xF5A6b7C8d9E0F1a2B3c4D5E6f7A8b9C0D1e2F3A4" },
  { name: "FTSO Hub", address: "0xD3E4f5A6b7C8D9E0f1A2b3C4d5E6F7A8b9c0D1e2" },
  { name: "FTSO Pro", address: "0xB1c2D3e4F5A6b7C8d9E0F1a2B3c4D5E6f7A8b9C0" },
  { name: "Oracle Prime", address: "0x9E0F1A2b3C4D5e6F7A8b9C0D1e2F3a4B5c6D7E8F" },
  { name: "FTSO Cloud", address: "0x7C8d9E0F1A2b3C4D5e6F7A8b9C0D1e2F3a4B5c6D" },
  { name: "FTSO Vision", address: "0x5A6B7c8D9e0F1A2b3C4D5e6F7A8b9C0D1e2F3a4B" },
  { name: "Oracle Fusion", address: "0x3A4B5c6D7E8f9A0B1c2D3e4F5A6b7C8d9E0F1a2B" },
  { name: "FTSO Nova", address: "0x0B1C2d3E4f5A6b7C8d9E0F1a2B3c4D5E6f7A8b9C" },
  { name: "Oracle Max", address: "0x2C3D4e5F6a7B8c9D0E1f2A3b4C5d6E7f8A9b0C1D" },
  { name: "FTSO Global", address: "0x4D5E6f7A8b9C0D1e2F3a4B5C6d7E8F9a0B1C2d3E" },
  { name: "FTSO World", address: "0x6E7f8A9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F" }
];
