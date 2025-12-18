import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export default function useDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/summary`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard summary')
      }
      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching dashboard summary:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  }
}
