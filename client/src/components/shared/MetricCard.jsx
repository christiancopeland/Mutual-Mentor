import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import clsx from 'clsx'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'

export default function MetricCard({
  metricType,
  label,
  actual = 0,
  goal = 0,
  progress = 0,
  status = 'red',
  onUpdateActual,
  onUpdateGoal,
  isLoading = false
}) {
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [isEditingActual, setIsEditingActual] = useState(false)
  const [editGoalValue, setEditGoalValue] = useState(goal)
  const [editActualValue, setEditActualValue] = useState(actual)

  const statusColors = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600'
  }

  const progressBarColors = {
    green: 'green',
    yellow: 'yellow',
    red: 'red'
  }

  // Handle actual value save on Enter or blur
  const handleSaveActual = () => {
    if (onUpdateActual) {
      const value = metricType === 'premium'
        ? parseFloat(editActualValue) || 0
        : parseInt(editActualValue) || 0
      onUpdateActual(metricType, value)
    }
    setIsEditingActual(false)
  }

  // Handle goal value save
  const handleSaveGoal = () => {
    if (onUpdateGoal) {
      const value = metricType === 'premium'
        ? parseFloat(editGoalValue) || 0
        : parseInt(editGoalValue) || 0
      onUpdateGoal(metricType, value)
    }
    setIsEditingGoal(false)
  }

  const handleCancelActualEdit = () => {
    setEditActualValue(actual)
    setIsEditingActual(false)
  }

  const handleCancelGoalEdit = () => {
    setEditGoalValue(goal)
    setIsEditingGoal(false)
  }

  const handleActualKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveActual()
    } else if (e.key === 'Escape') {
      handleCancelActualEdit()
    }
  }

  const handleGoalKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveGoal()
    } else if (e.key === 'Escape') {
      handleCancelGoalEdit()
    }
  }

  // Format display value for premium (currency)
  const formatValue = (value) => {
    if (metricType === 'premium') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return value.toLocaleString()
  }

  return (
    <Card className="relative">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{label || metricType}</h3>
        <span className={clsx('text-2xl font-bold', statusColors[status])}>
          {progress}%
        </span>
      </div>

      {/* Actual Value with Text Input */}
      <div className="flex items-center justify-center mb-4">
        {isEditingActual ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={metricType === 'premium' ? '0.01' : '1'}
              value={editActualValue}
              onChange={(e) => setEditActualValue(e.target.value)}
              onKeyDown={handleActualKeyPress}
              onBlur={handleSaveActual}
              className="w-32 px-3 py-2 border border-blue-300 rounded text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleSaveActual}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Save (Enter)"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={handleCancelActualEdit}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Cancel (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditActualValue(actual)
              setIsEditingActual(true)
            }}
            disabled={isLoading}
            className="text-3xl font-bold text-gray-900 min-w-[120px] text-center hover:bg-gray-50 px-4 py-2 rounded transition-colors"
            title="Click to edit"
          >
            {formatValue(actual)}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={actual}
        max={goal || 1}
        color={progressBarColors[status]}
        size="lg"
        className="mb-3"
      />

      {/* Goal Display/Edit */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Goal:</span>

        {isEditingGoal ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={metricType === 'premium' ? '0.01' : '1'}
              value={editGoalValue}
              onChange={(e) => setEditGoalValue(e.target.value)}
              onKeyDown={handleGoalKeyPress}
              onBlur={handleSaveGoal}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleSaveGoal}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Save (Enter)"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelGoalEdit}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Cancel (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{formatValue(goal)}</span>
            <button
              onClick={() => {
                setEditGoalValue(goal)
                setIsEditingGoal(true)
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit goal"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
