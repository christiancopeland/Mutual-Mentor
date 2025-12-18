import { useState } from 'react'
import { Plus, TrendingUp, Users, Target, Award, RefreshCw, Download } from 'lucide-react'
import useMetrics from '../hooks/useMetrics'
import useBonuses from '../hooks/useBonuses'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import TimeframeTabs from '../components/shared/TimeframeTabs'
import MetricCard from '../components/shared/MetricCard'
import BonusCard from '../components/shared/BonusCard'
import BonusForm from '../components/shared/BonusForm'
import { exportApi } from '../lib/api'
import { useToast } from '../components/ui/Toast'

// Updated metrics list with all 20 Northwestern Mutual advisor metrics (in order)
const METRIC_TYPES = [
  'days_worked',
  'meetings_made',
  'kept_meetings',
  'dials',
  'reached',
  'meetings_set',
  'meals',
  'qs_obtained',
  'qs_asked',
  'new_seen',
  'new_fact_finder',
  'case_opened',
  'joint_work',
  'plans',
  'closes',
  'points',
  'lives',
  'clients',
  'premium',
  'meetings_ahead'
]

// Metric display labels
const METRIC_LABELS = {
  days_worked: 'Days Worked',
  meetings_made: 'Meetings Made',
  kept_meetings: 'Kept Meetings',
  dials: 'Dials',
  reached: 'Reached',
  meetings_set: 'Meetings Set',
  meals: 'Meals',
  qs_obtained: 'QS Obtained',
  qs_asked: 'QS Asked',
  new_seen: 'New Seen',
  new_fact_finder: 'New Fact Finder',
  case_opened: 'Case Opened',
  joint_work: 'Joint Work',
  plans: 'Plans',
  closes: 'Closes',
  points: 'Points',
  lives: 'Lives',
  clients: 'Clients',
  premium: 'Premium',
  meetings_ahead: 'Meetings Ahead'
}

export default function GranumMetrics() {
  const {
    metrics,
    goals,
    selectedPeriod,
    setSelectedPeriod,
    loading: metricsLoading,
    error: metricsError,
    updateMetrics,
    updateGoals,
    getProgress,
    getProgressStatus,
    getGutRatio,
    refetch: refetchMetrics
  } = useMetrics()

  const {
    bonuses,
    loading: bonusesLoading,
    error: bonusesError,
    createBonus,
    updateBonus,
    updateProgress,
    deleteBonus,
    getActiveBonusesCount,
    refetch: refetchBonuses
  } = useBonuses()

  const toast = useToast()
  const [isBonusFormOpen, setIsBonusFormOpen] = useState(false)
  const [editingBonus, setEditingBonus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Handle metric actual value update
  const handleUpdateActual = async (metricType, newValue) => {
    try {
      const currentMetrics = { ...metrics }
      currentMetrics[metricType] = newValue
      await updateMetrics(currentMetrics)
      toast.success(`${METRIC_LABELS[metricType]} updated`)
    } catch (err) {
      toast.error(`Error updating ${metricType}: ${err.message}`)
    }
  }

  // Handle goal update
  const handleUpdateGoal = async (metricType, newGoal) => {
    try {
      const currentGoals = goals[selectedPeriod] || {}
      await updateGoals(selectedPeriod, {
        ...currentGoals,
        [metricType]: newGoal
      })
      toast.success(`${METRIC_LABELS[metricType]} goal updated`)
    } catch (err) {
      toast.error(`Error updating goal: ${err.message}`)
    }
  }

  // Bonus handlers
  const handleCreateBonus = () => {
    setEditingBonus(null)
    setIsBonusFormOpen(true)
  }

  const handleEditBonus = (bonus) => {
    setEditingBonus(bonus)
    setIsBonusFormOpen(true)
  }

  const handleDeleteBonus = async (bonus) => {
    if (deleteConfirm === bonus.id) {
      try {
        await deleteBonus(bonus.id)
        setDeleteConfirm(null)
        toast.success(`${bonus.name} deleted successfully`)
      } catch (err) {
        toast.error(`Error deleting bonus: ${err.message}`)
      }
    } else {
      setDeleteConfirm(bonus.id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const handleBonusSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingBonus) {
        await updateBonus(editingBonus.id, data)
        toast.success(`${data.name} updated successfully`)
      } else {
        await createBonus(data)
        toast.success(`${data.name} created successfully`)
      }
      setIsBonusFormOpen(false)
      setEditingBonus(null)
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBonusProgress = async (bonusId, currentValue) => {
    try {
      await updateProgress(bonusId, currentValue)
      toast.success('Progress updated')
    } catch (err) {
      toast.error(`Error updating progress: ${err.message}`)
    }
  }

  const handleRefresh = () => {
    refetchMetrics()
    refetchBonuses()
  }

  // Calculate summary values
  const gutRatio = getGutRatio()
  const totalPoints = metrics?.points || 0
  const activeBonusesCount = getActiveBonusesCount()

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Granum Metrics</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Track your activity metrics and goals</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button variant="secondary" onClick={() => exportApi.downloadMetricsCSV(selectedPeriod)}>
            <Download className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="ghost" onClick={handleRefresh}>
            <RefreshCw className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">GUT Ratio</p>
              <p className="text-3xl font-bold text-gray-900">{gutRatio}%</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Closes / Kept Meetings</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Period Points</p>
              <p className="text-3xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
            </div>
            <Target className="h-12 w-12 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{selectedPeriod} total</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kept Meetings</p>
              <p className="text-3xl font-bold text-gray-900">{metrics?.kept_meetings || 0}</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">{selectedPeriod} meetings</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Challenges</p>
              <p className="text-3xl font-bold text-gray-900">{activeBonusesCount}</p>
            </div>
            <Award className="h-12 w-12 text-pink-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">In progress</p>
        </Card>
      </div>

      {/* Timeframe Tabs */}
      <div className="mb-6">
        <TimeframeTabs
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      {/* Error States */}
      {metricsError && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">Error loading metrics: {metricsError}</p>
        </Card>
      )}

      {/* Loading State */}
      {metricsLoading && (
        <Card className="mb-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading metrics...</p>
          </div>
        </Card>
      )}

      {/* Metrics Grid */}
      {!metricsLoading && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {METRIC_TYPES.map(metricType => (
            <MetricCard
              key={metricType}
              metricType={metricType}
              label={METRIC_LABELS[metricType]}
              actual={metrics[metricType] || 0}
              goal={goals[selectedPeriod]?.[metricType] || 0}
              progress={getProgress(metricType)}
              status={getProgressStatus(metricType)}
              onUpdateActual={handleUpdateActual}
              onUpdateGoal={handleUpdateGoal}
              isLoading={metricsLoading}
            />
          ))}
        </div>
      )}

      {/* Challenges Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Challenges</h2>
          <Button variant="primary" onClick={handleCreateBonus}>
            <Plus className="h-5 w-5 mr-2" />
            Add Challenge
          </Button>
        </div>

        {bonusesError && (
          <Card className="mb-4 bg-red-50 border-red-200">
            <p className="text-red-600">Error loading challenges: {bonusesError}</p>
          </Card>
        )}

        {bonusesLoading && (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-600">Loading challenges...</p>
            </div>
          </Card>
        )}

        {!bonusesLoading && bonuses.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active challenges yet.</p>
              <Button variant="primary" onClick={handleCreateBonus}>
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Challenge
              </Button>
            </div>
          </Card>
        )}

        {!bonusesLoading && bonuses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bonuses.map(bonus => (
              <BonusCard
                key={bonus.id}
                bonus={bonus}
                onEdit={handleEditBonus}
                onDelete={handleDeleteBonus}
                onUpdateProgress={handleUpdateBonusProgress}
              />
            ))}
          </div>
        )}
      </div>

      {/* Challenge Form Modal */}
      <BonusForm
        isOpen={isBonusFormOpen}
        onClose={() => {
          setIsBonusFormOpen(false)
          setEditingBonus(null)
        }}
        onSubmit={handleBonusSubmit}
        initialData={editingBonus}
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
