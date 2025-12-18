const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Generic API request handler
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

// Client API methods
export const clientsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/clients${queryString ? `?${queryString}` : ''}`)
  },

  getById: (id) => request(`/clients/${id}`),

  create: (data) => request('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => request(`/clients/${id}`, {
    method: 'DELETE',
  }),

  toggleStep: (id, stepNumber, isCompleting) => {
    const action = isCompleting ? 'complete' : 'uncomplete'
    return request(`/clients/${id}/steps/${stepNumber}/${action}`, {
      method: 'POST',
    })
  },
}

// Pipeline API methods
export const pipelineApi = {
  getSteps: () => request('/clients/pipeline/steps'),
}

// Metrics API methods (Phase 2)
export const metricsApi = {
  get: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/metrics${queryString ? `?${queryString}` : ''}`)
  },
  update: (data) => request('/metrics', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  logEntry: (data) => request('/metrics/entry', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSummary: () => request('/metrics/summary'),
}

// Goals API methods (Phase 2)
export const goalsApi = {
  getAll: () => request('/goals'),
  update: (periodType, data) => request(`/goals/${periodType}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}

// Bonuses API methods (Phase 2)
export const bonusesApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/bonuses${queryString ? `?${queryString}` : ''}`)
  },
  create: (data) => request('/bonuses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/bonuses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/bonuses/${id}`, {
    method: 'DELETE',
  }),
  updateProgress: (id, currentValue) => request(`/bonuses/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ current_value: currentValue }),
  }),
}

// Export API methods (Phase 3)
export const exportApi = {
  // Trigger file download from export endpoints
  downloadClientsCSV: () => {
    window.open(`${API_BASE_URL}/export/clients/csv`, '_blank')
  },
  downloadMetricsCSV: (periodType = '') => {
    const params = periodType ? `?period_type=${periodType}` : ''
    window.open(`${API_BASE_URL}/export/metrics/csv${params}`, '_blank')
  },
  downloadGoalsCSV: () => {
    window.open(`${API_BASE_URL}/export/goals/csv`, '_blank')
  },
  downloadBonusesCSV: () => {
    window.open(`${API_BASE_URL}/export/bonuses/csv`, '_blank')
  },
  downloadBackup: () => {
    window.open(`${API_BASE_URL}/export/backup`, '_blank')
  },
}

// Dashboard API methods (Phase 2)
export const dashboardApi = {
  getSummary: () => request('/dashboard/summary'),
}

// Analytics API methods (Phase 3)
export const analyticsApi = {
  getPipeline: () => request('/analytics/pipeline'),
  getPerformance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return request(`/analytics/performance${queryString ? `?${queryString}` : ''}`)
  },
  getSummary: () => request('/analytics/summary'),
}

// Settings API methods
export const settingsApi = {
  get: () => request('/settings'),
  update: (data) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getFiscalQuarter: (date) => {
    const params = date ? `?date=${date}` : ''
    return request(`/settings/fiscal-quarter${params}`)
  },
}

export default {
  clients: clientsApi,
  pipeline: pipelineApi,
  metrics: metricsApi,
  goals: goalsApi,
  bonuses: bonusesApi,
  export: exportApi,
  dashboard: dashboardApi,
  analytics: analyticsApi,
  settings: settingsApi,
}
