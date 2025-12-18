import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'
import Badge from '../ui/Badge'

// Phase color mapping
const PHASE_COLORS = {
  'Initial Contact': {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'default',
  },
  'Discovery': {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    badge: 'primary',
  },
  'Planning Prep': {
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    text: 'text-indigo-700',
    badge: 'indigo',
  },
  'Planning': {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    badge: 'purple',
  },
  'Closing': {
    bg: 'bg-pink-50',
    border: 'border-pink-300',
    text: 'text-pink-700',
    badge: 'pink',
  },
  'Application': {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
    badge: 'orange',
  },
}

export default function PipelineChecklist({
  steps = [],
  completedSteps = [],
  currentStep = 1,
  onToggleStep,
  isLoading = false
}) {
  // Find the phase containing the current step
  const getCurrentPhase = () => {
    const currentStepData = steps.find(s => s.step_number === currentStep)
    return currentStepData?.phase || null
  }

  // Start with only the current phase expanded
  const [expandedPhases, setExpandedPhases] = useState(() => {
    const currentPhase = getCurrentPhase()
    return new Set(currentPhase ? [currentPhase] : [])
  })

  // Update expanded phases when current step changes
  useEffect(() => {
    const currentPhase = getCurrentPhase()
    if (currentPhase) {
      setExpandedPhases(new Set([currentPhase]))
    }
  }, [currentStep])

  // Group steps by phase
  const stepsByPhase = steps.reduce((acc, step) => {
    if (!acc[step.phase]) {
      acc[step.phase] = []
    }
    acc[step.phase].push(step)
    return acc
  }, {})

  const togglePhase = (phase) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phase)) {
        newSet.delete(phase)
      } else {
        newSet.add(phase)
      }
      return newSet
    })
  }

  const getPhaseCompletion = (phaseSteps) => {
    const completed = phaseSteps.filter(step =>
      completedSteps.includes(step.step_number)
    ).length
    return { completed, total: phaseSteps.length }
  }

  return (
    <div className="space-y-3">
      {Object.entries(stepsByPhase).map(([phase, phaseSteps]) => {
        const isExpanded = expandedPhases.has(phase)
        const colors = PHASE_COLORS[phase] || PHASE_COLORS['Initial Contact']
        const { completed, total } = getPhaseCompletion(phaseSteps)
        const isPhaseComplete = completed === total

        return (
          <div
            key={phase}
            className={clsx(
              'border-2 rounded-lg overflow-hidden',
              colors.border
            )}
          >
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phase)}
              className={clsx(
                'w-full px-4 py-3 flex items-center justify-between transition-colors',
                colors.bg,
                'hover:opacity-90'
              )}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span className={clsx('font-semibold', colors.text)}>
                  {phase}
                </span>
                <Badge variant={colors.badge}>
                  {completed}/{total}
                </Badge>
                {isPhaseComplete && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
            </button>

            {/* Phase Steps */}
            {isExpanded && (
              <div className="bg-white divide-y divide-gray-100">
                {phaseSteps.map((step) => {
                  const isCompleted = completedSteps.includes(step.step_number)

                  return (
                    <label
                      key={step.step_number}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => onToggleStep(step.step_number, !isCompleted)}
                        disabled={isLoading}
                        className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">
                            Step {step.step_number}
                          </span>
                        </div>
                        <p
                          className={clsx(
                            'text-sm',
                            isCompleted
                              ? 'text-gray-500 line-through'
                              : 'text-gray-800'
                          )}
                        >
                          {step.name}
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
