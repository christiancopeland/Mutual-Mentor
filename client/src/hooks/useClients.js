import { useState, useEffect, useCallback } from 'react'
import { clientsApi, pipelineApi } from '../lib/api'

export default function useClients() {
  const [clients, setClients] = useState([])
  const [pipelineSteps, setPipelineSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ status: 'all', search: '', sort: 'last_name_asc' })

  // Fetch pipeline steps
  const fetchPipelineSteps = useCallback(async () => {
    try {
      const steps = await pipelineApi.getSteps()
      setPipelineSteps(steps)
    } catch (err) {
      console.error('Error fetching pipeline steps:', err)
    }
  }, [])

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {}
      if (filters.status !== 'all') params.status = filters.status
      if (filters.search) params.search = filters.search
      if (filters.sort) params.sort = filters.sort

      const data = await clientsApi.getAll(params)
      setClients(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Initial fetch
  useEffect(() => {
    fetchPipelineSteps()
  }, [fetchPipelineSteps])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // Create client
  const createClient = async (data) => {
    try {
      const newClient = await clientsApi.create(data)
      setClients(prev => [newClient, ...prev])
      return newClient
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Update client
  const updateClient = async (id, data) => {
    try {
      const updatedClient = await clientsApi.update(id, data)
      setClients(prev =>
        prev.map(client => client.id === id ? updatedClient : client)
      )
      return updatedClient
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Delete client
  const deleteClient = async (id) => {
    try {
      await clientsApi.delete(id)
      setClients(prev => prev.filter(client => client.id !== id))
    } catch (err) {
      throw new Error(err.message)
    }
  }

  // Toggle pipeline step
  const toggleStep = async (clientId, stepNumber, isCompleting) => {
    try {
      const updatedClient = await clientsApi.toggleStep(clientId, stepNumber, isCompleting)
      setClients(prev =>
        prev.map(client => client.id === clientId ? updatedClient : client)
      )
      return updatedClient
    } catch (err) {
      throw new Error(err.message)
    }
  }

  return {
    clients,
    pipelineSteps,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    toggleStep,
  }
}
