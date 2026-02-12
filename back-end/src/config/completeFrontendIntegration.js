// DataRand - Complete Frontend Integration
// For React/Next.js with Privy Embedded Wallet
// ============================================
// PREREQUISITES:
// npm install @privy-io/react-auth ethers
// ============================================

import { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from 'ethers';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  API_BASE_URL: 'https://datarand.onrender.com/api/v1',
  
  // Smart Contract
  CONTRACT_ADDRESS: '0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34',
  
  // Network: Arbitrum Sepolia Testnet
  CHAIN_ID: '0x66eed', // 421614
  CHAIN_NAME: 'Arbitrum Sepolia',
  RPC_URL: 'https://arb-sep.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
  BLOCK_EXPLORER: 'https://sepolia.arbiscan.io',
  
  // Platform
  PLATFORM_FEE_PERCENTAGE: 15,
};

// ============================================
// CONTRACT ABI
// ============================================

const CONTRACT_ABI = [
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
    "name": "completeTask",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
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
    "name": "cancelAndRefund",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTask",
    "inputs": [{ "name": "_taskId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "creator", "type": "address" },
          { "name": "payoutPerWorker", "type": "uint256" },
          { "name": "requiredWorkers", "type": "uint256" },
          { "name": "assignedWorkersCount", "type": "uint256" },
          { "name": "platformFee", "type": "uint256" },
          { "name": "totalFunded", "type": "uint256" },
          { "name": "isFunded", "type": "bool" },
          { "name": "isCompleted", "type": "bool" },
          { "name": "isCancelled", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "taskCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
];

// ============================================
// CONTEXT
// ============================================

const DataRandContext = createContext(null);

// ============================================
// API CLASS
// ============================================

class DataRandAPI {
  constructor(baseUrl = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('datarand_token', token);
    } else {
      localStorage.removeItem('datarand_token');
    }
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('datarand_token');
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(privyAccessToken, deviceFingerprint) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ privyAccessToken, deviceFingerprint }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Tasks
  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async fundTask(taskId) {
    return this.request(`/tasks/${taskId}/fund`, {
      method: 'POST',
    });
  }

  async getMyTasks() {
    return this.request('/tasks');
  }

  async getTask(taskId) {
    return this.request(`/tasks/${taskId}`);
  }

  async getAvailableTasks() {
    return this.request('/tasks/available');
  }

  // Submissions
  async submitWork(submissionData) {
    return this.request('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getTaskSubmissions(taskId) {
    return this.request(`/submissions/task/${taskId}`);
  }

  async reviewSubmission(submissionId, approved) {
    return this.request(`/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  }

  // Worker
  async requestTask() {
    return this.request('/tasks/request', { method: 'POST' });
  }

  async getMyAssignedTasks() {
    return this.request('/tasks/my-assignments');
  }
}

export const api = new DataRandAPI();

// ============================================
// WALLET SERVICE (PRIVY EMBEDDED WALLET)
// ============================================

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.address = null;
  }

  // Initialize with Privy embedded wallet
  async initialize(privyWallet) {
    if (!privyWallet) {
      throw new Error('Privy wallet not available');
    }

    // Get Ethers provider from Privy
    this.provider = await privyWallet.getEthersProvider();
    this.signer = this.provider.getSigner();
    
    // Get wallet address
    this.address = await this.signer.getAddress();

    // Initialize contract
    this.contract = new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      this.signer
    );

    return this;
  }

  async getAddress() {
    if (!this.address) {
      this.address = await this.signer.getAddress();
    }
    return this.address;
  }

  async getBalance() {
    if (!this.provider) return '0';
    const address = await this.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getNativeBalance(address) {
    if (!this.provider) return '0';
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  // Switch to Arbitrum Sepolia
  async switchNetwork() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CONFIG.CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CONFIG.CHAIN_ID,
            chainName: CONFIG.CHAIN_NAME,
            rpcUrls: [CONFIG.RPC_URL],
            blockExplorerUrls: [CONFIG.BLOCK_EXPLORER],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          }],
        });
      }
    }
  }

  // Fund task - sends ETH to contract
  async fundTask(taskId, totalCostETH) {
    if (!this.contract) {
      throw new Error('Wallet not initialized');
    }

    const tx = await this.contract.fundTask(taskId, {
      value: ethers.parseEther(totalCostETH.toString())
    });

    return tx;
  }

  // Get contract instance
  getContract() {
    return this.contract;
  }
}

export const walletService = new WalletService();

// ============================================
// DEVICE FINGERPRINT
// ============================================

export function getDeviceFingerprint() {
  let fingerprint = localStorage.getItem('datarand_fingerprint');
  if (fingerprint) return fingerprint;

  // Generate unique fingerprint
  constfp = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('datarand_fingerprint', fp);
  return fp;
}

// ============================================
// HOOKS
// ============================================

export function useDataRand() {
  return useContext(DataRandContext);
}

export function useAuth() {
  const context = useContext(DataRandContext);
  return {
    user: context?.user,
    token: context?.token,
    loading: context?.loading,
    login: context?.login,
    logout: context?.logout,
  };
}

export function useWallet() {
  const context = useContext(DataRandContext);
  return {
    address: context?.walletAddress,
    balance: context?.walletBalance,
    connected: context?.walletConnected,
    connectWallet: context?.connectWallet,
    refreshBalance: context?.refreshBalance,
  };
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export function DataRandProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletBalance, setWalletBalance] = useState('0');
  const [walletConnected, setWalletConnected] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('datarand_token');
    const savedUser = localStorage.getItem('datarand_user');
    
    if (savedToken && savedUser) {
      api.setToken(savedToken);
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (privyAccessToken, wallet) => {
    try {
      // Initialize wallet service with Privy embedded wallet
      await walletService.initialize(wallet);
      const address = await walletService.getAddress();
      const balance = await walletService.getBalance();

      setWalletAddress(address);
      setWalletBalance(balance);
      setWalletConnected(true);

      // Login to API
      const deviceFingerprint = getDeviceFingerprint();
      const result = await api.login(privyAccessToken, deviceFingerprint);

      api.setToken(result.token);
      setToken(result.token);
      setUser(result.user);

      localStorage.setItem('datarand_token', result.token);
      localStorage.setItem('datarand_user', JSON.stringify(result.user));

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    setWalletConnected(false);
    setWalletAddress(null);
    localStorage.removeItem('datarand_token');
    localStorage.removeItem('datarand_user');
  };

  const connectWallet = async (privyWallet) => {
    await walletService.initialize(privyWallet);
    const address = await walletService.getAddress();
    const balance = await walletService.getBalance();
    
    setWalletAddress(address);
    setWalletBalance(balance);
    setWalletConnected(true);
    
    // Switch to correct network
    await walletService.switchNetwork();
  };

  const refreshBalance = async () => {
    if (walletAddress) {
      const balance = await walletService.getBalance();
      setWalletBalance(balance);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    walletAddress,
    walletBalance,
    walletConnected,
    connectWallet,
    refreshBalance,
  };

  return (
    <DataRandContext.Provider value={value}>
      {children}
    </DataRandContext.Provider>
  );
}

// ============================================
// TASK CREATION COMPONENT
// ============================================

export function CreateTask({ onSuccess, onError }) {
  const { token, walletAddress, walletBalance, refreshBalance } = useDataRand();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Image Labeling',
    payoutPerWorker: '',
    requiredWorkers: 1,
    deadline: '',
  });
  const [step, setStep] = useState('create');
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  const categories = [
    { value: 'Image Labeling', label: '🖼️ Image Labeling' },
    { value: 'Audio Transcription', label: '🎙️ Audio Transcription' },
    { value: 'AI Evaluation', label: '🤖 AI Evaluation' },
    { value: 'ComputeShare', label: '💻 ComputeShare' },
  ];

  const calculateCosts = () => {
    const payout = parseFloat(formData.payoutPerWorker) || 0;
    const workers = parseInt(formData.requiredWorkers) || 1;
    const subtotal = payout * workers;
    const fee = subtotal * (CONFIG.PLATFORM_FEE_PERCENTAGE / 100);
    return { subtotal, fee, total: subtotal + fee };
  };

  const handleCreateTask = async () => {
    setLoading(true);
    try {
      const result = await api.createTask(formData);
      setTask(result.task);
      setStep('fund');
    } catch (error) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFundTask = async () => {
    const costs = calculateCosts();
    setTxLoading(true);
    
    try {
      // Check balance
      const balance = parseFloat(walletBalance);
      if (balance < costs.total) {
        throw new Error(`Insufficient balance. Need ${costs.total.toFixed(4)} ETH`);
      }

      // Send transaction from embedded wallet
      const tx = await walletService.fundTask(task.id, costs.total);
      
      // Wait for transaction
      await tx.wait();

      // Refresh balance
      await refreshBalance();
      
      onSuccess?.({ task, tx });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Image Labeling',
        payoutPerWorker: '',
        requiredWorkers: 1,
        deadline: '',
      });
      setStep('create');
      setTask(null);
    } catch (error) {
      if (error.code === 'ACTION_REJECTED') {
        onError?.('Transaction rejected');
      } else {
        onError?.(error.message);
      }
    } finally {
      setTxLoading(false);
    }
  };

  const costs = calculateCosts();
  const hasEnoughBalance = parseFloat(walletBalance) >= costs.total;

  return (
    <div className="datarand-create-task">
      {/* Step Indicator */}
      <div className="step-indicator">
        <div className={`step ${step === 'create' ? 'active' : step === 'fund' ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Create</span>
        </div>
        <div className="step-line" />
        <div className={`step ${step === 'fund' ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Fund</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); step === 'create' ? handleCreateTask() : handleFundTask(); }}>
        {step === 'create' ? (
          <>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Label images for AI training"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Describe the task in detail. Include all requirements and guidelines for workers..."
                rows={5}
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payout per Worker (ETH) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.payoutPerWorker}
                  onChange={(e) => setFormData({ ...formData, payoutPerWorker: e.target.value })}
                  required
                  placeholder="0.01"
                />
                <span className="hint">Minimum 0.001 ETH</span>
              </div>

              <div className="form-group">
                <label>Workers Needed *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.requiredWorkers}
                  onChange={(e) => setFormData({ ...formData, requiredWorkers: e.target.value })}
                  required
                />
                <span className="hint">1-100 workers</span>
              </div>
            </div>

            <div className="form-group">
              <label>Deadline (optional)</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </>
        ) : (
          <div className="funding-summary">
            <h3>Funding Summary</h3>
            
            <div className="summary-card">
              <div className="summary-row">
                <span>Task</span>
                <span>{formData.title}</span>
              </div>
              <div className="summary-row">
                <span>Category</span>
                <span>{formData.category}</span>
              </div>
              <div className="summary-row">
                <span>Payout per Worker</span>
                <span>{formData.payoutPerWorker} ETH</span>
              </div>
              <div className="summary-row">
                <span>Workers</span>
                <span>{formData.requiredWorkers}</span>
              </div>
              <hr />
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{costs.subtotal.toFixed(4)} ETH</span>
              </div>
              <div className="summary-row">
                <span>Platform Fee (15%)</span>
                <span>{costs.fee.toFixed(4)} ETH</span>
              </div>
              <div className="summary-row total">
                <span>Total Required</span>
                <span>{costs.total.toFixed(4)} ETH</span>
              </div>
            </div>

            <div className="wallet-card">
              <div className="wallet-header">
                <span>💳 Embedded Wallet</span>
                <button type="button" onClick={refreshBalance} className="refresh-btn">↻</button>
              </div>
              <div className="wallet-address">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</div>
              <div className="wallet-balance">{parseFloat(walletBalance).toFixed(4)} ETH</div>
              <div className={`balance-status ${hasEnoughBalance ? 'sufficient' : 'insufficient'}`}>
                {hasEnoughBalance ? '✓ Sufficient balance' : '⚠️ Insufficient balance'}
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step === 'fund' && (
            <button type="button" onClick={() => setStep('create')} className="btn-secondary" disabled={txLoading}>
              ← Back
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading || txLoading || (step === 'fund' && !hasEnoughBalance)} 
            className="btn-primary"
          >
            {loading ? 'Creating...' : txLoading ? 'Confirm in Wallet...' : step === 'create' ? 'Continue to Funding' : 'Fund Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// MY TASKS COMPONENT
// ============================================

export function MyTasks() {
  const { token } = useDataRand();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, [token]);

  const loadTasks = async () => {
    try {
      const result = await api.getMyTasks();
      setTasks(result.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': '#6b7280',
      'FUNDED': '#10b981',
      'ASSIGNED': '#3b82f6',
      'COMPLETED': '#8b5cf6',
      'EXPIRED': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="datarand-my-tasks">
      <div className="tasks-header">
        <h2>My Tasks</h2>
        <div className="filter-tabs">
          {['all', 'DRAFT', 'FUNDED', 'ASSIGNED', 'COMPLETED'].map((f) => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">No tasks found</div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className="task-status" style={{ backgroundColor: getStatusColor(task.status) }}>
                  {task.status}
                </span>
              </div>
              <p className="task-category">{task.category}</p>
              <div className="task-stats">
                <div className="stat">
                  <span className="stat-label">Workers</span>
                  <span className="stat-value">{task.assigned_workers_count || 0}/{task.required_workers}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Payout</span>
                  <span className="stat-value">{ethers.formatEther(task.payout_per_worker || '0')} ETH</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================

export default {
  CONFIG,
  CONTRACT_ADDRESS: CONFIG.CONTRACT_ADDRESS,
  CONTRACT_ABI,
  NETWORK_CONFIG: {
    chainId: CONFIG.CHAIN_ID,
    chainName: CONFIG.CHAIN_NAME,
    rpcUrl: CONFIG.RPC_URL,
    blockExplorer: CONFIG.BLOCK_EXPLORER,
  },
  api,
  walletService,
  getDeviceFingerprint,
  useDataRand,
  useAuth,
  useWallet,
  DataRandProvider,
  CreateTask,
  MyTasks,
};
