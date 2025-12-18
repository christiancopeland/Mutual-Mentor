import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

const METRIC_OPTIONS = [
  { value: 'dials', label: 'Dials' },
  { value: 'meetings_set', label: 'Meetings Set' },
  { value: 'kept_meetings', label: 'Kept Meetings' },
  { value: 'closes', label: 'Closes' },
  { value: 'plans', label: 'Plans' },
  { value: 'lives', label: 'Lives' },
  { value: 'clients', label: 'Clients' },
  { value: 'premium', label: 'Premium' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'fact_finders', label: 'Fact Finders' },
  { value: 'meetings_ahead', label: 'Meetings Ahead' },
  { value: 'points', label: 'Points' },
  { value: 'custom', label: 'Custom' }
]

export default function BonusForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric_type: 'closes',
    custom_metric_name: '',
    target_value: 100,
    current_value: 0,
    start_date: new Date().toISOString().split('T')[0],
    deadline: ''
  })

  const [errors, setErrors] = useState({})

  // Reset form when modal opens with initial data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          metric_type: initialData.metric_type || 'closes',
          custom_metric_name: initialData.custom_metric_name || '',
          target_value: initialData.target_value || 100,
          current_value: initialData.current_value || 0,
          start_date: initialData.start_date || new Date().toISOString().split('T')[0],
          deadline: initialData.deadline || ''
        })
      } else {
        setFormData({
          name: '',
          description: '',
          metric_type: 'closes',
          custom_metric_name: '',
          target_value: 100,
          current_value: 0,
          start_date: new Date().toISOString().split('T')[0],
          deadline: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Challenge name is required'
    }
    if (!formData.target_value || formData.target_value <= 0) {
      newErrors.target_value = 'Target must be a positive number'
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    } else if (new Date(formData.deadline) < new Date(formData.start_date)) {
      newErrors.deadline = 'Deadline must be after start date'
    }
    if (formData.metric_type === 'custom' && !formData.custom_metric_name.trim()) {
      newErrors.custom_metric_name = 'Custom metric name is required when using Custom type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  const resetAndClose = () => {
    setFormData({
      name: '',
      description: '',
      metric_type: 'closes',
      custom_metric_name: '',
      target_value: 100,
      current_value: 0,
      start_date: new Date().toISOString().split('T')[0],
      deadline: ''
    })
    setErrors({})
    onClose()
  }

  // Determine if premium type for decimal support
  const isPremium = formData.metric_type === 'premium'
  const inputStep = isPremium ? '0.01' : '1'

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={initialData ? 'Edit Challenge' : 'Create New Challenge'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Challenge' : 'Create Challenge'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Challenge Name *"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="Q1 Dial Challenge"
          disabled={isLoading}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe the challenge..."
            rows={2}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metric Type *
          </label>
          <select
            value={formData.metric_type}
            onChange={(e) => handleChange('metric_type', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {METRIC_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Metric Name Input - only show when Custom is selected */}
        {formData.metric_type === 'custom' && (
          <Input
            label="Custom Metric Name *"
            value={formData.custom_metric_name}
            onChange={(e) => handleChange('custom_metric_name', e.target.value)}
            error={errors.custom_metric_name}
            placeholder="Enter metric name"
            disabled={isLoading}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Target Value *"
            type="number"
            step={inputStep}
            value={formData.target_value}
            onChange={(e) => handleChange('target_value', isPremium ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            error={errors.target_value}
            min="0.01"
            disabled={isLoading}
          />

          <Input
            label="Current Value"
            type="number"
            step={inputStep}
            value={formData.current_value}
            onChange={(e) => handleChange('current_value', isPremium ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            min="0"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Deadline *"
            type="date"
            value={formData.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
            error={errors.deadline}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  )
}
