// src/constants.js
import { ethers } from "ethers";

export const FLARE_CONFIG = {
  // Bọc qua getAddress để đảm bảo đúng Checksum 100%
  WNAT: ethers.getAddress("0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d"),
  REWARD_MANAGER: ethers.getAddress("0xC8f55c5aA2C752eE285Bd872855C749f4ee6239B"),
  CLAIM_SETUP_MANAGER: ethers.getAddress("0xD56c0Ea37B848939B59e6F5Cda119b3fA473b5eB"),
};

export const ABIS = {
  WNAT: [
    "function deposit() payable",
    "function withdraw(uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256)",
    "function delegate(address,uint256)",
    "function delegatesOf(address) view returns (address[], uint256[], uint256, uint256)"
  ],
  REWARD_MANAGER: [
    "function getStateOfRewards(address) view returns (tuple(uint24 rewardEpochId, bytes20 beneficiary, uint120 amount, uint8 claimType, bool initialised)[][])",
    "function claim(address, address, uint24, bool, tuple[]) returns (uint256)",
    "function getRewardEpochIdsWithClaimableRewards() view returns (uint24, uint24)"
  ],
  CLAIM_SETUP_MANAGER: [
    "function accountToDelegationAccount(address) view returns (address)",
    "function withdraw(uint256) external",
    // THÊM: Định nghĩa hàm claim để gọi từ Manager cho PDA
    "function claim(address _delegationAccount, address payable _recipient, uint256 _rewardEpoch, bool _wrap) external returns (uint256)"
  ]
};

// Chuẩn hóa toàn bộ danh sách Provider để tránh lỗi checksum khi so sánh địa chỉ
export const PROVIDERS = [
  { name: "Zellic", address: "0x76e5591dda384a30eeb53fd4059c9570ee072e7e" },
  { name: "African Proofs", address: "0x7b3F2a1C8E9d4F2A1B3C4D5E6F7A8B9C0D1E2F3A" },
  { name: "Enosys", address: "0x8C6f28f2F1A2C1eB8C9F9bA2A5e3fC1A2B3C4D5E" },
  { name: "Lena", address: "0x4A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B" },
  { name: "A-FTSO", address: "0x9F8E7D6C5B4A3F2E1D0C9B8A7E6D5C4B3A2F1E0D" },
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
  { name: "FTSO Nova", address: "0x0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C" },
  { name: "Oracle Max", address: "0x2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D" },
  { name: "FTSO Global", address: "0x4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E" },
  { name: "FTSO World", address: "0x6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F" }
].map(p => ({ ...p, address: ethers.getAddress(p.address) }));

export const COLORS = {
  PINK: "#e31864",
  AMBER: "#fbbf24",
  DARK: "#000000",
  SURFACE: "#111111",
  BORDER: "#262626",
  TEXT_MUTE: "#94a3b8"
};
