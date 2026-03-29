// src/utils/api.js
const API_BASE = 'http://localhost:5001/api/v1/contracts';
const API_DASHBOARD = 'http://localhost:5001/api';
const HEALTH_URL = 'http://localhost:5001/health';
const TENANT_ID = 'tenant-test-123';

export const fetchApi = (url, opts = {}) => {
  opts.headers = { ...opts.headers, 'X-Tenant-ID': TENANT_ID };
  return fetch(url, opts);
};

export const api = {
  // Health
  checkHealth: () => fetch(HEALTH_URL),
  
  // Contracts
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
  },
  
  uploadAndAnalyzeBatch: (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return fetchApi(`${API_BASE}/upload-and-analyze-batch`, {
      method: 'POST',
      body: formData
    });
  },
  
  analyzeText: (text) => {
    return fetchApi(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  },
  
  saveContract: (extractedData, filename = null) => {
    return fetchApi(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: 'frontend-user', 
        extracted_data: extractedData,
        filename: filename
      })
    });
  },
  
  listContracts: () => {
    return fetchApi(`${API_BASE}/list`);
  },
  
  getContract: (contractId) => {
    return fetchApi(`${API_BASE}/${contractId}`);
  },
  
  getMapContracts: () => {
    return fetchApi(`${API_BASE}/map`);
  },
  
  downloadFile: (filename) => {
    return `${API_BASE}/download/${filename}`;
  },
  
  addContractVersion: (contractId, versionData) => {
    return fetchApi(`${API_BASE}/${contractId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(versionData)
    });
  },
  
  preSignAnalysis: (contractData) => {
    return fetchApi(`${API_BASE}/pre-sign-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract_data: contractData })
    });
  },
  
  // Dashboard
  getKpi: () => fetchApi(`${API_DASHBOARD}/kpi`),
  getDashboardContracts: () => fetchApi(`${API_DASHBOARD}/contracts`),
  getDashboardContract: (index) => fetchApi(`${API_DASHBOARD}/contracts/${index}`),
  getCosts: (prod) => fetchApi(`${API_DASHBOARD}/costs/${prod}`),
  getAnomalies: () => fetchApi(`${API_DASHBOARD}/anomalies`),
  getExpiring: () => fetchApi(`${API_DASHBOARD}/expiring`),
  getMapData: () => fetchApi(`${API_DASHBOARD}/map-data`),
  getTopClients: () => fetchApi(`${API_DASHBOARD}/top-clients`),
  getAiAdvice: () => fetchApi(`${API_DASHBOARD}/ai-advice`)
};
