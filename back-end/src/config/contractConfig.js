// Smart Contract Configuration
// Deploy this on Arbitrum Sepolia (or mainnet)

// ============================================
// CONTRACT ADDRESS
// ============================================
export const CONTRACT_ADDRESS = '0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34';

// ============================================
// CONTRACT ABI
// ============================================
export const CONTRACT_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "initialOwner", "type": "address", "internalType": "address" },
      { "name": "_platformWallet", "type": "address", "internalType": "address payable" },
      { "name": "_platformFeePercentage", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "assignWorkers",
    "inputs": [
      { "name": "_taskId", "type": "uint256", "internalType": "uint256" },
      { "name": "_workers", "type": "address[]", "internalType": "address[]" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelAndRefund",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "completeTask",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createTask",
    "inputs": [
      { "name": "_taskId", "type": "uint256", "internalType": "uint256" },
      { "name": "_creator", "type": "address", "internalType": "address" },
      { "name": "_payoutPerWorker", "type": "uint256", "internalType": "uint256" },
      { "name": "_requiredWorkers", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "fundTask",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getAssignedWorkers",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "address[]", "internalType": "address[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getContractBalance",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getIsAssignedWorker",
    "inputs": [
      { "name": "_taskId", "type": "uint256", "internalType": "uint256" },
      { "name": "_worker", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTask",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct TaskEscrow.Task",
        "components": [
          { "name": "creator", "type": "address", "internalType": "address" },
          { "name": "payoutPerWorker", "type": "uint256", "internalType": "uint256" },
          { "name": "requiredWorkers", "type": "uint256", "internalType": "uint256" },
          { "name": "assignedWorkersCount", "type": "uint256", "internalType": "uint256" },
          { "name": "platformFee", "type": "uint256", "internalType": "uint256" },
          { "name": "totalFunded", "type": "uint256", "internalType": "uint256" },
          { "name": "isFunded", "type": "bool", "internalType": "bool" },
          { "name": "isCompleted", "type": "bool", "internalType": "bool" },
          { "name": "isCancelled", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformFeePercentage",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "platformWallet",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address payable" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "releasePayout",
    "inputs": [
      { "name": "_taskId", "type": "uint256", "internalType": "uint256" },
      { "name": "_worker", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "taskCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tasks",
    "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "creator", "type": "address", "internalType": "address" },
      { "name": "payoutPerWorker", "type": "uint256", "internalType": "uint256" },
      { "name": "requiredWorkers", "type": "uint256", "internalType": "uint256" },
      { "name": "assignedWorkersCount", "type": "uint256", "internalType": "uint256" },
      { "name": "platformFee", "type": "uint256", "internalType": "uint256" },
      { "name": "totalFunded", "type": "uint256", "internalType": "uint256" },
      { "name": "isFunded", "type": "bool", "internalType": "bool" },
      { "name": "isCompleted", "type": "bool", "internalType": "bool" },
      { "name": "isCancelled", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawFunds",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TaskAssigned",
    "inputs": [
      { "name": "taskId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "worker", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TaskCancelled",
    "inputs": [{ "name": "taskId", "type": "uint256", "indexed": true, "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TaskCompleted",
    "inputs": [{ "name": "taskId", "type": "uint256", "indexed": true, "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TaskCreated",
    "inputs": [
      { "name": "taskId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "creator", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "payoutPerWorker", "type": "uint256", "internalType": "uint256" },
      { "name": "requiredWorkers", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TaskFunded",
    "inputs": [
      { "name": "taskId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PayoutReleased",
    "inputs": [
      { "name": "taskId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "worker", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  }
];

// ============================================
// NETWORK CONFIGURATION
// ============================================
export const NETWORK_CONFIG = {
  // Arbitrum Sepolia Testnet
  arbitrumSepolia: {
    chainId: '0x66eed', // 421614
    chainName: 'Arbitrum Sepolia',
    rpcUrl: 'https://arb-sep.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
    blockExplorer: 'https://sepolia.arbiscan.io'
  },
  // Arbitrum Mainnet
  arbitrum: {
    chainId: '0xa4b1', // 42161
    chainName: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  }
};

export default {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  NETWORK_CONFIG
};
