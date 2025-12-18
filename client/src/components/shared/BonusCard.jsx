import { Edit, Trash2, Calendar, Target } from 'lucide-react'
import clsx from 'clsx'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const METRIC_LABELS = {
  dials: 'Dials',
  appointments: 'Appointments',
  kept_appointments: 'Kept Appointments',
  closes: 'Closes',
  lives: 'Lives',
  points: 'Points',
  clients: 'Clients',
  custom: 'Custom'
}

const STATUS_CONFIG = {
  active: { label: 'Active', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  expired: { label: 'Expired', variant: 'danger' },
  archived: { label: 'Archived', variant: 'default' }
}

export default function BonusCard({
  bonus,
  onEdit,
  onDelete,
  onUpdateProgress
}) {
  const {
    id,
    name,
    description,
    metric_type,
    target_value,
    current_value,
    deadline,
    status,
    days_remaining,
    progress_percentage
  } = bonus

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.active

  // Determine progress bar color
  const getProgressColor = () => {
    if (progress_percentage >= 100) return 'green'
    if (progress_percentage >= 80) return 'yellow'
    return 'red'
  }

  // Format deadline
  const formatDeadline = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleProgressChange = (e) => {
    const newValue = parseInt(e.target.value) || 0
    onUpdateProgress(id, newValue)
  }

  return (
    <Card className="relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>

        {status === 'active' && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(bonus)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(bonus)}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}
      </div>

      {/* Metric Type & Deadline */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4" />
          <span>{METRIC_LABELS[metric_type] || metric_type}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formatDeadline(deadline)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className={clsx(
            'font-bold',
            progress_percentage >= 100 ? 'text-green-600' :
            progress_percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {progress_percentage}%
          </span>
        </div>
        <ProgressBar
          value={current_value}
          max={target_value}
          color={getProgressColor()}
          size="md"
        />
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>Current: {current_value}</span>
          <span>Target: {target_value}</span>
        </div>
      </div>

      {/* Days Remaining */}
      {status === 'active' && (
        <div className={clsx(
          'text-center py-2 rounded-md text-sm font-medium',
          days_remaining <= 0 ? 'bg-red-100 text-red-800' :
          days_remaining <= 7 ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        )}>
          {days_remaining <= 0
            ? 'Deadline passed!'
            : `${days_remaining} day${days_remaining !== 1 ? 's' : ''} remaining`
          }
        </div>
      )}

      {/* Quick Progress Update (for active bonuses) */}
      {status === 'active' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <label className="block text-sm text-gray-600 mb-1">Update Progress</label>
          <input
            type="number"
            value={current_value}
            onChange={handleProgressChange}
            min="0"
            max={target_value * 2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </Card>
  )
}
