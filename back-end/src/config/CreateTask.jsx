// DataRand - Task Creation Component
// React component for creating tasks

import { useState } from 'react';
import { createTask, fundTask } from './apiService';

const TASK_CATEGORIES = [
  'Image Labeling',
  'Audio Transcription', 
  'AI Evaluation',
  'ComputeShare'
];

export default function CreateTask({ token, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: TASK_CATEGORIES[0],
    payoutPerWorker: '',
    requiredWorkers: 1,
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('create'); // 'create' or 'fund'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create task (saves as DRAFT)
      const result = await createTask(formData, token);
      
      if (step === 'create') {
        // Show funding step
        setStep('fund');
        setLoading(false);
        return;
      }

      // Step 2: Fund the task
      await fundTask(result.task.id, token);
      
      // Success!
      onSuccess?.(result);
      setFormData({
        title: '',
        description: '',
        category: TASK_CATEGORIES[0],
        payoutPerWorker: '',
        requiredWorkers: 1,
        deadline: ''
      });
      setStep('create');
    } catch (error) {
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate costs
  const payoutETH = parseFloat(formData.payoutPerWorker) || 0;
  const workers = parseInt(formData.requiredWorkers) || 1;
  const subtotal = payoutETH * workers;
  const platformFee = subtotal * 0.15;
  const total = subtotal + platformFee;

  return (
    <div className="create-task-form">
      <h2>{step === 'create' ? 'Create New Task' : 'Fund Task'}</h2>
      
      <form onSubmit={handleSubmit}>
        {step === 'create' ? (
          <>
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter task title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe the task in detail..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {TASK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payout per Worker (ETH)</label>
                <input
                  type="number"
                  name="payoutPerWorker"
                  value={formData.payoutPerWorker}
                  onChange={handleChange}
                  required
                  min="0.001"
                  step="0.001"
                  placeholder="0.01"
                />
              </div>

              <div className="form-group">
                <label>Required Workers</label>
                <input
                  type="number"
                  name="requiredWorkers"
                  value={formData.requiredWorkers}
                  onChange={handleChange}
                  required
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Deadline (optional)</label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </>
        ) : (
          <div className="funding-summary">
            <h3>Funding Summary</h3>
            <div className="cost-breakdown">
              <p><strong>Task:</strong> {formData.title}</p>
              <p><strong>Category:</strong> {formData.category}</p>
              <p><strong>Payout per worker:</strong> {payoutETH} ETH</p>
              <p><strong>Workers:</strong> {workers}</p>
              <hr />
              <p>Subtotal: {subtotal.toFixed(4)} ETH</p>
              <p>Platform Fee (15%): {platformFee.toFixed(4)} ETH</p>
              <p className="total"><strong>Total: {total.toFixed(4)} ETH</strong></p>
            </div>
            <p className="warning">
              ⚠️ You need to have {total.toFixed(4)} ETH in your wallet to fund this task.
            </p>
          </div>
        )}

        <div className="form-actions">
          {step === 'fund' && (
            <button 
              type="button" 
              onClick={() => setStep('create')}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : step === 'create' ? 'Create Task' : 'Fund with ETH'}
          </button>
        </div>
      </form>
    </div>
  );
}
