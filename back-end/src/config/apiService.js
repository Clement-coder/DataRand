// DataRand Frontend Integration - API Service
// Base URL for the backend
const API_BASE_URL = 'https://datarand.onrender.com/api/v1';

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Login with Privy and get JWT token
 * @param {string} privyId - The user's Privy ID
 * @param {string} walletAddress - The user's wallet address
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = async (privyId, walletAddress) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ privyId, walletAddress }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};

/**
 * Get current user profile
 * @param {string} token - JWT token
 * @returns {Promise<object>}
 */
export const getProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get profile');
  }

  return response.json();
};

// ============================================
// TASK CREATION
// ============================================

/**
 * Create a new task (saves as DRAFT)
 * @param {object} taskData - Task creation data
 * @param {string} token - JWT token
 * @returns {Promise<{task: object}>}
 * 
 * Required taskData fields:
 * - title: string
 * - description: string  
 * - category: 'Image Labeling' | 'Audio Transcription' | 'AI Evaluation' | 'ComputeShare'
 * - payoutPerWorker: number (in ETH)
 * - requiredWorkers: number
 * - deadline: ISO date string (optional)
 */
export const createTask = async (taskData, token) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }

  return response.json();
};

/**
 * Fund a draft task (requires ETH payment)
 * @param {number} taskId - The task ID
 * @param {string} token - JWT token
 * @returns {Promise<{task: object}>}
 */
export const fundTask = async (taskId, token) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/fund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fund task');
  }

  return response.json();
};

/**
 * Get all tasks for current user
 * @param {string} token - JWT token
 * @returns {Promise<{tasks: array}>}
 */
export const getMyTasks = async (token) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get tasks');
  }

  return response.json();
};

/**
 * Get available tasks for workers
 * @param {string} token - JWT token
 * @returns {Promise<{tasks: array}>}
 */
export const getAvailableTasks = async (token) => {
  const response = await fetch(`${API_BASE_URL}/tasks/available`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get available tasks');
  }

  return response.json();
};

// ============================================
// SUBMISSIONS
// ============================================

/**
 * Submit work for a task
 * @param {object} submissionData - Submission data
 * @param {string} token - JWT token
 * @returns {Promise<{submission: object}>}
 */
export const submitWork = async (submissionData, token) => {
  const response = await fetch(`${API_BASE_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(submissionData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit work');
  }

  return response.json();
};

/**
 * Get submissions for a task
 * @param {number} taskId - Task ID
 * @param {string} token - JWT token
 * @returns {Promise<{submissions: array}>}
 */
export const getTaskSubmissions = async (taskId, token) => {
  const response = await fetch(`${API_BASE_URL}/submissions/task/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get submissions');
  }

  return response.json();
};

/**
 * Approve or reject a submission
 * @param {number} submissionId - Submission ID
 * @param {boolean} approved - Approval status
 * @param {string} token - JWT token
 * @returns {Promise<{submission: object}>}
 */
export const reviewSubmission = async (submissionId, approved, token) => {
  const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ approved }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to review submission');
  }

  return response.json();
};

// ============================================
// WORKER TASKS
// ============================================

/**
 * Request to work on a task (for workers)
 * @param {string} token - JWT token
 * @returns {Promise<{assignment: object}>}
 */
export const requestTask = async (token) => {
  const response = await fetch(`${API_BASE_URL}/tasks/request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request task');
  }

  return response.json();
};

/**
 * Get my assigned tasks
 * @param {string} token - JWT token
 * @returns {Promise<{tasks: array}>}
 */
export const getMyAssignedTasks = async (token) => {
  const response = await fetch(`${API_BASE_URL}/tasks/my-assignments`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get assigned tasks');
  }

  return response.json();
};

// ============================================
// COMPUTE (ComputeShare)
// ============================================

/**
 * Submit a ComputeShare task
 * @param {object} computeData - Compute task data
 * @param {string} token - JWT token
 * @returns {Promise<{job: object}>}
 */
export const submitComputeTask = async (computeData, token) => {
  const response = await fetch(`${API_BASE_URL}/compute/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(computeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit compute task');
  }

  return response.json();
};

/**
 * Get ComputeShare job status
 * @param {string} jobId - Job ID
 * @param {string} token - JWT token
 * @returns {Promise<{job: object}>}
 */
export const getComputeJobStatus = async (jobId, token) => {
  const response = await fetch(`${API_BASE_URL}/compute/status/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  return response.json();
};

export default {
  login,
  getProfile,
  createTask,
  fundTask,
  getMyTasks,
  getAvailableTasks,
  submitWork,
  getTaskSubmissions,
  reviewSubmission,
  requestTask,
  getMyAssignedTasks,
  submitComputeTask,
  getComputeJobStatus,
};
