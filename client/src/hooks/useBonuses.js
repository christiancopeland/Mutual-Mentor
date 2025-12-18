import { useState, useEffect, useCallback } from 'react'
import { bonusesApi } from '../lib/api'

export default function useBonuses() {
  const [bonuses, setBonuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('active')

  // Fetch bonuses
  const fetchBonuses = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter

      const data = await bonusesApi.getAll(params)
      setBonuses(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching bonuses:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  // Initial fetch
  useEffect(() => {
    fetchBonuses()
  }, [fetchBonuses])

  // Create bonus
  const createBonus = async (data) => {
    try {
      const newBonus = await bonusesApi.create(data)
      setBonuses(prev => [newBonus, ...prev])
      return newBonus
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Update bonus
  const updateBonus = async (id, data) => {
    try {
      const updatedBonus = await bonusesApi.update(id, data)
      setBonuses(prev =>
        prev.map(bonus => bonus.id === id ? updatedBonus : bonus)
      )
      return updatedBonus
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Update bonus progress
  const updateProgress = async (id, currentValue) => {
    try {
      const updatedBonus = await bonusesApi.updateProgress(id, currentValue)
      setBonuses(prev =>
        prev.map(bonus => bonus.id === id ? updatedBonus : bonus)
      )
      return updatedBonus
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Delete/archive bonus
  const deleteBonus = async (id) => {
    try {
      await bonusesApi.delete(id)
      setBonuses(prev => prev.filter(bonus => bonus.id !== id))
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Get progress status
  const getProgressStatus = (bonus) => {
    if (bonus.progress_percentage >= 100) return 'green'
    if (bonus.progress_percentage >= 80) return 'yellow'
    return 'red'
  }

  // Get active bonuses count
  const getActiveBonusesCount = () => {
    return bonuses.filter(b => b.status === 'active').length
  }

  return {
    bonuses,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch: fetchBonuses,
    createBonus,
    updateBonus,
    updateProgress,
    deleteBonus,
    getProgressStatus,
    getActiveBonusesCount
  }
}
