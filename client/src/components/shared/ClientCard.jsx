import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, Phone, Users, Edit, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import PipelineChecklist from './PipelineChecklist'

// Get current phase based on current step
function getCurrentPhase(currentStep) {
  if (currentStep <= 7) return 'Initial Contact'
  if (currentStep <= 16) return 'Discovery'
  if (currentStep <= 22) return 'Planning Prep'
  if (currentStep <= 30) return 'Planning'
  if (currentStep <= 35) return 'Closing'
  if (currentStep <= 43) return 'Application'
  return 'Application'
}

const STATUS_CONFIG = {
  active: { label: 'Active', variant: 'primary' },
  stalled: { label: 'Stalled', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  lost: { label: 'Lost', variant: 'danger' },
}

export default function ClientCard({
  client,
  pipelineSteps,
  onToggleStep,
  onEdit,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleStep = async (stepNumber, isCompleting) => {
    setIsToggling(true)
    try {
      await onToggleStep(client.id, stepNumber, isCompleting)
    } finally {
      setIsToggling(false)
    }
  }

  const progress = (client.completed_steps.length / 43) * 100
  const currentPhase = getCurrentPhase(client.current_step)
  const statusConfig = STATUS_CONFIG[client.status] || STATUS_CONFIG.active

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{client.last_name}, {client.first_name}</h3>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              {client.jw_partner && (
                <Badge variant="purple">
                  <Users className="h-3 w-3 mr-1" />
                  JW
                </Badge>
              )}
            </div>
            <Badge variant="default">{currentPhase}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(client)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(client)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
          {client.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{client.email}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <ProgressBar
            value={client.completed_steps.length}
            max={43}
            showLabel
            color="blue"
          />
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Current Step: {client.current_step}/43</span>
          {client.jw_partner && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              JW Partner: {client.jw_partner}
            </span>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Pipeline
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View Pipeline
            </>
          )}
        </button>
      </div>

      {/* Expanded Pipeline Checklist */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <PipelineChecklist
            steps={pipelineSteps}
            completedSteps={client.completed_steps}
            currentStep={client.current_step}
            onToggleStep={handleToggleStep}
            isLoading={isToggling}
          />
        </div>
      )}
    </div>
  )
}
