import { useState, useMemo } from 'react'
import { Plus, Search, Download } from 'lucide-react'
import useClients from '../hooks/useClients'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ClientCard from '../components/shared/ClientCard'
import ClientForm from '../components/shared/ClientForm'
import Pagination from '../components/ui/Pagination'
import { exportApi } from '../lib/api'
import { useToast } from '../components/ui/Toast'

const ITEMS_PER_PAGE = 10

// Simplified pipeline phase filters (per user feedback)
const STATUS_FILTERS = [
  { value: 'all', label: 'All Clients' },
  { value: 'initial_contact', label: 'Initial Contact' },
  { value: 'discovery_meeting', label: 'Discovery Meeting' },
  { value: 'planning_prep', label: 'Planning Prep' },
  { value: 'planning_meeting', label: 'Planning Meeting' },
  { value: 'closing_meeting', label: 'Closing Meeting' },
  { value: 'application_process', label: 'Application Process' },
  { value: 'completed', label: 'Completed' },
]

const SORT_OPTIONS = [
  { value: 'last_name_asc', label: 'Last Name (A-Z)' },
  { value: 'last_name_desc', label: 'Last Name (Z-A)' },
  { value: 'date_added_desc', label: 'Date Added (Newest)' },
  { value: 'date_added_asc', label: 'Date Added (Oldest)' },
]

export default function Clients() {
  const {
    clients,
    pipelineSteps,
    loading,
    error,
    filters,
    setFilters,
    createClient,
    updateClient,
    deleteClient,
    toggleStep,
  } = useClients()

  const toast = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate stats
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    stalled: clients.filter(c => c.status === 'stalled').length,
    completed: clients.filter(c => c.status === 'completed').length,
  }

  // Pagination logic
  const totalPages = Math.ceil(clients.length / ITEMS_PER_PAGE)
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return clients.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [clients, currentPage])

  // Reset to page 1 when filters change
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value }))
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }))
    setCurrentPage(1)
  }

  const handleCreateClient = () => {
    setEditingClient(null)
    setIsFormOpen(true)
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDeleteClient = async (client) => {
    if (deleteConfirm === client.id) {
      try {
        await deleteClient(client.id)
        setDeleteConfirm(null)
        toast.success(`${client.first_name} ${client.last_name} deleted successfully`)
      } catch (err) {
        toast.error(`Error deleting client: ${err.message}`)
      }
    } else {
      setDeleteConfirm(client.id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const handleSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data)
        toast.success(`${data.first_name} ${data.last_name} updated successfully`)
      } else {
        await createClient(data)
        toast.success(`${data.first_name} ${data.last_name} added successfully`)
      }
      setIsFormOpen(false)
      setEditingClient(null)
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Clients</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.active}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Stalled</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.stalled}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={handleStatusFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort || 'last_name_asc'}
            onChange={handleSortChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => exportApi.downloadClientsCSV()}
          >
            <Download className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateClient}
          >
            <Plus className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Add Client</span>
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">Error loading clients: {error}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">Loading clients...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && clients.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {filters.search || filters.status !== 'all'
                ? 'No clients match your filters.'
                : 'No clients yet. Add your first client to get started!'}
            </p>
            {!filters.search && filters.status === 'all' && (
              <Button variant="primary" onClick={handleCreateClient}>
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Client
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Client List */}
      {!loading && clients.length > 0 && (
        <>
          <div className="space-y-4">
            {paginatedClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                pipelineSteps={pipelineSteps}
                onToggleStep={toggleStep}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={clients.length}
            itemsPerPage={ITEMS_PER_PAGE}
            className="mt-6"
          />
        </>
      )}

      {/* Client Form Modal */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingClient(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingClient}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Click delete again to confirm
        </div>
      )}
    </div>
  )
}
