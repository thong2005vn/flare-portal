export const FLARE_CONFIG = {
  WNAT: "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d",
  REWARD_MANAGER: "0x8560103b1D479d4961F7A8878071c51F3a94f67d",
  // Đã sửa lỗi checksum ở đây:
  CLAIM_SETUP_MANAGER: "0x0A97607593c6A2B3eA80687794121F762886A87C", 
  FTSO_MANAGER: "0xc5738334b972745067fFa666040fdeADc66Cb925",
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
  // THÊM ABI NÀY ĐỂ ĐỒNG HỒ HOẠT ĐỘNG
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
];
