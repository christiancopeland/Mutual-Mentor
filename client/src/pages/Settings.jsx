import { useState, useEffect } from 'react'
import { Save, Info } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { settingsApi } from '../lib/api'
import { useToast } from '../components/ui/Toast'

export default function Settings() {
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fiscal_q1_start: '09-22',
    fiscal_q2_start: '12-22',
    fiscal_q3_start: '03-22',
    fiscal_q4_start: '06-22',
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    week_starts_on: 'sunday'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await settingsApi.get()
      setSettings(data)
      setFormData({
        fiscal_q1_start: data.fiscal_q1_start || '09-22',
        fiscal_q2_start: data.fiscal_q2_start || '12-22',
        fiscal_q3_start: data.fiscal_q3_start || '03-22',
        fiscal_q4_start: data.fiscal_q4_start || '06-22',
        timezone: data.timezone || 'America/New_York',
        date_format: data.date_format || 'MM/DD/YYYY',
        week_starts_on: data.week_starts_on || 'sunday'
      })
    } catch (err) {
      toast.error(`Error loading settings: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updated = await settingsApi.update(formData)
      setSettings(updated)
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error(`Error saving settings: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">Configure your preferences and fiscal quarters</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fiscal Quarter Configuration */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Fiscal Quarter Configuration</h2>
            <div className="group relative">
              <Info className="h-5 w-5 text-gray-400 cursor-help" />
              <div className="invisible group-hover:visible absolute left-0 top-6 w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                Configure your fiscal quarters to match Northwestern Mutual's schedule. Enter dates in MM-DD format (e.g., 09-22 for September 22nd).
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Q1 Start Date (MM-DD)"
              value={formData.fiscal_q1_start}
              onChange={(e) => handleChange('fiscal_q1_start', e.target.value)}
              placeholder="09-22"
              pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
              disabled={saving}
            />

            <Input
              label="Q2 Start Date (MM-DD)"
              value={formData.fiscal_q2_start}
              onChange={(e) => handleChange('fiscal_q2_start', e.target.value)}
              placeholder="12-22"
              pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
              disabled={saving}
            />

            <Input
              label="Q3 Start Date (MM-DD)"
              value={formData.fiscal_q3_start}
              onChange={(e) => handleChange('fiscal_q3_start', e.target.value)}
              placeholder="03-22"
              pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
              disabled={saving}
            />

            <Input
              label="Q4 Start Date (MM-DD)"
              value={formData.fiscal_q4_start}
              onChange={(e) => handleChange('fiscal_q4_start', e.target.value)}
              placeholder="06-22"
              pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
              disabled={saving}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Example: Northwestern Mutual Fiscal Quarters</p>
            <p>Q1: Sept 22 - Dec 21 | Q2: Dec 22 - Mar 21 | Q3: Mar 22 - Jun 21 | Q4: Jun 22 - Sept 21</p>
          </div>
        </Card>

        {/* General Settings */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Format
              </label>
              <select
                value={formData.date_format}
                onChange={(e) => handleChange('date_format', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week Starts On
              </label>
              <select
                value={formData.week_starts_on}
                onChange={(e) => handleChange('week_starts_on', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="px-8"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
