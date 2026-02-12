// DataRand Frontend Integration - Complete Guide
// ============================================
// Prerequisites:
// 1. Install @privy-io/react-auth: npm install @privy-io/react-auth
// 2. Install ethers: npm install ethers
// ============================================

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  API_BASE_URL: 'https://datarand.onrender.com/api/v1',
  // Smart Contract
  CONTRACT_ADDRESS: '0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34',
  // Network
  CHAIN_ID: '0x66eed', // 421614 (Arbitrum Sepolia)
  CHAIN_NAME: 'Arbitrum Sepolia',
  RPC_URL: 'https://arb-sep.g.alchemy.com/v2/YOUR_ALCHEMY_KEY',
  BLOCK_EXPLORER: 'https://sepolia.arbiscan.io',
};

// ============================================
// API SERVICE
// ============================================

class DataRandAPI {
  constructor(baseUrl = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
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
// ETHEREUM / WALLET SERVICE
// ============================================

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.chainId = CONFIG.CHAIN_ID;
  }

  async initialize(privyWallet) {
    // Get the embedded wallet from Privy
    if (privyWallet) {
      const ethersProvider = await privyWallet.getEthersProvider();
      this.provider = ethersProvider;
      this.signer = ethersProvider.getSigner();
    } else {
      // Fallback to window.ethereum
      if (window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      }
    }
  }

  async getAddress() {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  async getBalance(address) {
    if (!this.provider) return '0';
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async switchNetwork() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.chainId }],
      });
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: this.chainId,
            chainName: CONFIG.CHAIN_NAME,
            rpcUrls: [CONFIG.RPC_URL],
            blockExplorerUrls: [CONFIG.BLOCK_EXPLORER],
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
          }],
        });
      }
    }
  }

  async sendTransaction(to, valueETH) {
    if (!this.signer) throw new Error('Wallet not connected');

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(valueETH.toString()),
    });

    return tx;
  }
}

export const walletService = new WalletService();

// ============================================
// DEVICE FINGERPRINT
// ============================================

export function getDeviceFingerprint() {
  const fingerprint = localStorage.getItem('datarand_fingerprint');
  if (fingerprint) return fingerprint;

  // Generate new fingerprint
  const newFingerprint = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('datarand_fingerprint', newFingerprint);
  return newFingerprint;
}

// ============================================
// HOOKS & COMPONENTS
// ============================================

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (privyAccessToken) => {
    const deviceFingerprint = getDeviceFingerprint();
    const result = await api.login(privyAccessToken, deviceFingerprint);
    
    api.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
    
    localStorage.setItem('datarand_token', result.token);
    localStorage.setItem('datarand_user', JSON.stringify(result.user));
    
    return result;
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('datarand_token');
    localStorage.removeItem('datarand_user');
  };

  return { user, token, loading, login, logout };
}

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState('0');
  const [connected, setConnected] = useState(false);

  const connect = async (privyWallet) => {
    await walletService.initialize(privyWallet);
    const addr = await walletService.getAddress();
    const bal = await walletService.getBalance(addr);
    
    setAddress(addr);
    setBalance(bal);
    setConnected(true);
    
    // Switch to correct network
    await walletService.switchNetwork();
  };

  const refreshBalance = async () => {
    if (address) {
      const bal = await walletService.getBalance(address);
      setBalance(bal);
    }
  };

  return { address, balance, connected, connect, refreshBalance };
}

// ============================================
// REACT COMPONENTS
// ============================================

export function DataRandProvider({ children }) {
  const auth = useAuth();
  const wallet = useWallet();

  return (
    <DataRandContext.Provider value={{ ...auth, ...wallet }}>
      {children}
    </DataRandContext.Provider>
  );
}

import { createContext, useContext } from 'react';
const DataRandContext = createContext(null);

export function useDataRand() {
  return useContext(DataRandContext);
}

// ============================================
// TASK CREATION COMPONENT
// ============================================

export function CreateTask({ onSuccess, onError }) {
  const { token } = useDataRand();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Image Labeling',
    payoutPerWorker: '',
    requiredWorkers: 1,
    deadline: '',
  });
  const [step, setStep] = useState('create'); // 'create' | 'fund'
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(null);

  const categories = [
    'Image Labeling',
    'Audio Transcription',
    'AI Evaluation',
    'ComputeShare'
  ];

  const calculateCosts = () => {
    const payout = parseFloat(formData.payoutPerWorker) || 0;
    const workers = parseInt(formData.requiredWorkers) || 1;
    const subtotal = payout * workers;
    const fee = subtotal * 0.15;
    return { subtotal, fee, total: subtotal + fee };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === 'create') {
        const result = await api.createTask(formData);
        setTask(result.task);
        setStep('fund');
      } else {
        await api.fundTask(task.id);
        onSuccess?.();
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
      }
    } catch (error) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const costs = calculateCosts();

  return (
    <div className="datarand-create-task">
      <div className="step-indicator">
        <span className={step === 'create' ? 'active' : 'completed'}>1. Create</span>
        <span className="divider">→</span>
        <span className={step === 'fund' ? 'active' : ''}>2. Fund</span>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 'create' ? (
          <>
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter a clear, descriptive title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Describe the task in detail..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payout per Worker (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.payoutPerWorker}
                  onChange={(e) => setFormData({ ...formData, payoutPerWorker: e.target.value })}
                  required
                  placeholder="0.01"
                />
              </div>

              <div className="form-group">
                <label>Workers Needed</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.requiredWorkers}
                  onChange={(e) => setFormData({ ...formData, requiredWorkers: e.target.value })}
                  required
                />
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
                <span>Payout/Worker</span>
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
                <span>Total</span>
                <span>{costs.total.toFixed(4)} ETH</span>
              </div>
            </div>

            <div className="wallet-info">
              <p>💳 Payment will be made from your embedded wallet</p>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step === 'fund' && (
            <button type="button" onClick={() => setStep('create')} className="btn-secondary">
              Back
            </button>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : step === 'create' ? 'Continue to Funding' : 'Fund Task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// EXAMPLE APP SETUP
// ============================================

/*
// App.jsx
import { PrivyProvider, usePrivy, WalletProvider } from '@privy-io/react-auth';
import { DataRandProvider, useDataRand, CreateTask, api, getDeviceFingerprint } from './datarand';

function LoginButton() {
  const { login, user } = useDataRand();
  const { login: privyLogin, authenticated } = usePrivy();

  const handleLogin = async () => {
    const result = await privyLogin();
    if (result.user) {
      // Get Privy access token
      const privyToken = await result.getAccessToken();
      await login(privyToken);
    }
  };

  if (user) return <p>Welcome!</p>;

  return <button onClick={handleLogin}>Login with Wallet</button>;
}

function App() {
  return (
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <DataRandProvider>
        <div className="app">
          <LoginButton />
          <CreateTask />
        </div>
      </DataRandProvider>
    </PrivyProvider>
  );
}
*/

export default {
  CONFIG,
  api,
  walletService,
  getDeviceFingerprint,
  useAuth,
  useWallet,
  useDataRand,
  DataRandProvider,
  CreateTask,
};
