import { useState } from 'react'
import { Plus, AlertCircle, Calendar, TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import ClientForm from '../components/shared/ClientForm'
import useClients from '../hooks/useClients'
import useBonuses from '../hooks/useBonuses'
import useMetrics from '../hooks/useMetrics'
import { useToast } from '../components/ui/Toast'

export default function Dashboard() {
  const toast = useToast()
  const { clients, createClient } = useClients()
  const { bonuses } = useBonuses()
  const { metrics, goals, selectedPeriod } = useMetrics()

  const [isClientFormOpen, setIsClientFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get today's date for comparisons
  const today = new Date().toISOString().split('T')[0]

  // Filter clients that need action today
  const clientsNeedingAction = clients.filter(client =>
    client.next_action_due === today && client.status === 'active'
  )

  // Filter challenges expiring in next 7 days
  const expiringChallenges = bonuses.filter(bonus => {
    if (bonus.status !== 'active') return false
    const deadline = new Date(bonus.deadline)
    const todayDate = new Date(today)
    const daysUntilDeadline = Math.ceil((deadline - todayDate) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline >= 0 && daysUntilDeadline <= 7
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  // Check if daily metrics have been logged (any non-zero value)
  const hasLoggedMetrics = metrics && Object.keys(metrics).some(key =>
    key !== 'id' && key !== 'period_type' && key !== 'period_start' &&
    key !== 'period_end' && key !== 'created_at' && key !== 'updated_at' &&
    metrics[key] > 0
  )

  // Calculate weekly goal progress for top 5 metrics
  const topMetrics = [
    { type: 'kept_meetings', label: 'Kept Meetings' },
    { type: 'closes', label: 'Closes' },
    { type: 'dials', label: 'Dials' },
    { type: 'meetings_set', label: 'Meetings Set' },
    { type: 'points', label: 'Points' }
  ]

  // Get pipeline phase counts
  const getPhaseCounts = () => {
    const phases = {
      'Initial Contact': clients.filter(c => c.current_step >= 1 && c.current_step <= 7 && c.status === 'active').length,
      'Discovery': clients.filter(c => c.current_step >= 8 && c.current_step <= 16 && c.status === 'active').length,
      'Planning Prep': clients.filter(c => c.current_step >= 17 && c.current_step <= 22 && c.status === 'active').length,
      'Planning': clients.filter(c => c.current_step >= 23 && c.current_step <= 30 && c.status === 'active').length,
      'Closing': clients.filter(c => c.current_step >= 31 && c.current_step <= 35 && c.status === 'active').length,
      'Application': clients.filter(c => c.current_step >= 36 && c.current_step <= 43 && c.status === 'active').length,
    }
    return phases
  }

  const phaseCounts = getPhaseCounts()

  // Handle create client
  const handleCreateClient = async (data) => {
    setIsSubmitting(true)
    try {
      await createClient(data)
      setIsClientFormOpen(false)
      toast.success(`${data.first_name} ${data.last_name} added successfully`)
    } catch (err) {
      toast.error(`Error creating client: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">Your daily action center</p>
      </div>

      {/* Today's Priorities */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
          Today's Priorities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Metrics Reminder */}
          <Card className={hasLoggedMetrics ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Daily Metrics</p>
                {hasLoggedMetrics ? (
                  <div className="flex items-center text-green-700">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span className="text-sm">Logged for {selectedPeriod}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm">Not yet logged today</span>
                  </div>
                )}
              </div>
              {!hasLoggedMetrics && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/metrics'}
                >
                  Log Now
                </Button>
              )}
            </div>
          </Card>

          {/* Clients Needing Action */}
          <Card className={clientsNeedingAction.length > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Action Items</p>
                <p className="text-2xl font-bold text-gray-900">{clientsNeedingAction.length}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {clientsNeedingAction.length === 0 ? 'No items due today' : 'clients need attention'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
            {clientsNeedingAction.length > 0 && (
              <div className="mt-3 space-y-1">
                {clientsNeedingAction.slice(0, 3).map(client => (
                  <p key={client.id} className="text-xs text-gray-700 truncate">
                    {client.last_name}, {client.first_name}
                  </p>
                ))}
                {clientsNeedingAction.length > 3 && (
                  <p className="text-xs text-gray-500">+{clientsNeedingAction.length - 3} more</p>
                )}
              </div>
            )}
          </Card>

          {/* Expiring Challenges */}
          <Card className={expiringChallenges.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Challenges Expiring</p>
                <p className="text-2xl font-bold text-gray-900">{expiringChallenges.length}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {expiringChallenges.length === 0 ? 'None in next 7 days' : 'in next 7 days'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            {expiringChallenges.length > 0 && (
              <div className="mt-3 space-y-2">
                {expiringChallenges.slice(0, 2).map(bonus => (
                  <div key={bonus.id} className="text-xs">
                    <p className="text-gray-700 font-medium truncate">{bonus.name}</p>
                    <p className="text-gray-500">{bonus.days_remaining} days left - {bonus.progress_percentage}%</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="primary"
            className="h-16 text-base"
            onClick={() => setIsClientFormOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Client
          </Button>
          <Button
            variant="primary"
            className="h-16 text-base"
            onClick={() => window.location.href = '/metrics'}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Log Metrics
          </Button>
          <Button
            variant="primary"
            className="h-16 text-base"
            onClick={() => window.location.href = '/clients'}
          >
            <Users className="h-5 w-5 mr-2" />
            View All Clients
          </Button>
        </div>
      </div>

      {/* This Week */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">This Week</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Goal Progress */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Goals</h3>
            <div className="space-y-4">
              {topMetrics.map(metric => {
                const actual = metrics?.[metric.type] || 0
                const goal = goals?.weekly?.[metric.type] || 0
                const percentage = goal > 0 ? Math.round((actual / goal) * 100) : 0
                const status = percentage >= 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red'

                return (
                  <div key={metric.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className="text-sm text-gray-600">{actual} / {goal}</span>
                    </div>
                    <ProgressBar value={actual} max={goal || 1} color={status} size="md" />
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Pipeline Summary */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Summary</h3>
            <div className="space-y-3">
              {Object.entries(phaseCounts).map(([phase, count]) => (
                <div key={phase} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{phase}</span>
                  <span className="text-lg font-bold text-gray-900">{count}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total Active</span>
                  <span className="text-xl font-bold text-blue-600">
                    {Object.values(phaseCounts).reduce((sum, count) => sum + count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Client Form Modal */}
      <ClientForm
        isOpen={isClientFormOpen}
        onClose={() => setIsClientFormOpen(false)}
        onSubmit={handleCreateClient}
        isLoading={isSubmitting}
      />
    </div>
  )
}
