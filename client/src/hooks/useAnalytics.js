import { useState, useEffect, useCallback } from 'react'
import { analyticsApi } from '../lib/api'

export default function useAnalytics() {
  const [pipelineData, setPipelineData] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [performancePeriod, setPerformancePeriod] = useState('weekly')

  const fetchPipelineData = useCallback(async () => {
    try {
      const data = await analyticsApi.getPipeline()
      setPipelineData(data)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const fetchPerformanceData = useCallback(async () => {
    try {
      const data = await analyticsApi.getPerformance({ period: performancePeriod, limit: 12 })
      setPerformanceData(data)
    } catch (err) {
      setError(err.message)
    }
  }, [performancePeriod])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchPipelineData(), fetchPerformanceData()])
    } finally {
      setLoading(false)
    }
  }, [fetchPipelineData, fetchPerformanceData])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    pipelineData,
    performanceData,
    loading,
    error,
    performancePeriod,
    setPerformancePeriod,
    refetch
  }
}
