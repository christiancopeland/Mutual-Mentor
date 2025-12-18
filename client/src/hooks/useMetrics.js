import { useState, useEffect, useCallback } from 'react'
import { metricsApi, goalsApi } from '../lib/api'

const PERIOD_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

export default function useMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [goals, setGoals] = useState({})
  const [selectedPeriod, setSelectedPeriod] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch metrics for current period
  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await metricsApi.get({
        period_type: selectedPeriod,
        date: selectedDate.toISOString().split('T')[0]
      })
      setMetrics(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedDate])

  // Fetch all goals
  const fetchGoals = useCallback(async () => {
    try {
      const data = await goalsApi.getAll()
      setGoals(data)
    } catch (err) {
      console.error('Error fetching goals:', err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Update metrics
  const updateMetrics = async (data) => {
    try {
      const updated = await metricsApi.update({
        period_type: selectedPeriod,
        date: selectedDate.toISOString().split('T')[0],
        ...data
      })
      setMetrics(updated)
      return updated
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Log single metric entry
  const logEntry = async (metricType, value = 1, notes = '') => {
    try {
      await metricsApi.logEntry({
        metric_type: metricType,
        value,
        date: selectedDate.toISOString().split('T')[0],
        notes
      })
      // Refetch metrics to get updated values
      await fetchMetrics()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Update goals for a period
  const updateGoalsForPeriod = async (periodType, data) => {
    try {
      const updated = await goalsApi.update(periodType, data)
      setGoals(prev => ({
        ...prev,
        [periodType]: updated
      }))
      return updated
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Calculate progress percentage
  const getProgress = (metricType) => {
    const actual = metrics?.[metricType] || 0
    const goal = goals[selectedPeriod]?.[metricType] || 0
    if (goal === 0) return 0
    return Math.round((actual / goal) * 100)
  }

  // Get progress status color
  const getProgressStatus = (metricType) => {
    const percentage = getProgress(metricType)
    if (percentage >= 100) return 'green'
    if (percentage >= 80) return 'yellow'
    return 'red'
  }

  // Calculate GUT ratio
  const getGutRatio = () => {
    const keptMeetings = metrics?.kept_meetings || 0
    const closes = metrics?.closes || 0
    if (keptMeetings === 0) return 0
    return Math.round((closes / keptMeetings) * 100)
  }

  return {
    metrics,
    goals,
    selectedPeriod,
    setSelectedPeriod,
    selectedDate,
    setSelectedDate,
    loading,
    error,
    refetch: fetchMetrics,
    updateMetrics,
    logEntry,
    updateGoals: updateGoalsForPeriod,
    getProgress,
    getProgressStatus,
    getGutRatio,
    periodTypes: PERIOD_TYPES
  }
}
