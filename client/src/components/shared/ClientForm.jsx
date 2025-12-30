import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { formatPhoneInput } from '../../lib/utils'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'stalled', label: 'Stalled' },
  { value: 'completed', label: 'Completed' },
  { value: 'lost', label: 'Lost' },
]

export default function ClientForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    referral_source: '',
    jw_partner: '',
    notes: '',
    status: 'active',
  })

  const [errors, setErrors] = useState({})
  const firstNameInputRef = useRef(null)

  // Reset form when modal opens/closes or when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          referral_source: initialData.referral_source || '',
          jw_partner: initialData.jw_partner || '',
          notes: initialData.notes || '',
          status: initialData.status || 'active',
        })
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          referral_source: '',
          jw_partner: '',
          notes: '',
          status: 'active',
        })
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  // Auto-focus first name field when modal opens
  useEffect(() => {
    if (isOpen && firstNameInputRef.current) {
      // Small delay to wait for modal animation
      const timer = setTimeout(() => {
        firstNameInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value, formData.phone)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
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
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      referral_source: '',
      jw_partner: '',
      notes: '',
      status: 'active',
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={initialData ? 'Edit Client' : 'Add New Client'}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={resetAndClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Client' : 'Add Client'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            ref={firstNameInputRef}
            label="First Name *"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            error={errors.first_name}
            placeholder="John"
            disabled={isLoading}
          />

          <Input
            label="Last Name *"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            error={errors.last_name}
            placeholder="Smith"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(555) 555-1234"
            disabled={isLoading}
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="john@example.com"
            disabled={isLoading}
          />
        </div>

        <Input
          label="Referral Source"
          value={formData.referral_source}
          onChange={(e) => handleChange('referral_source', e.target.value)}
          placeholder="Friend referral, cold call, etc."
          disabled={isLoading}
        />

        <Input
          label="JW Partner"
          value={formData.jw_partner}
          onChange={(e) => handleChange('jw_partner', e.target.value)}
          placeholder="Partner name (if joint work)"
          disabled={isLoading}
        />

        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes about this client..."
            rows={4}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    </Modal>
  )
}
