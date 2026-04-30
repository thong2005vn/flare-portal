export const FLARE_CONFIG = {
  // Địa chỉ đã được chuẩn hóa Checksum thủ công
  WNAT: "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d",
  REWARD_MANAGER: "0x8560103b1D479d4961F7A8878071C51F3a94f67D", 
  CLAIM_SETUP_MANAGER: "0x0A97607593c6A2B3eA80687794121F762886A87C"
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
  { name: "WaveLabs", address: "0x3C4D5e6F7A8b9C0D1e2F3a4B5C6d7E8F9a0B1C2d" },
  { name: "A-FTSO", address: "0x9f8E7D6c5B4a3f2E1D0C9b8A7E6d5C4B3a2F1e0d" },
  { name: "FTSO.EU", address: "0x9C0D1E2f3A4b5C6D7E8F9A0B1c2D3e4F5a6B7c8D" }
];
