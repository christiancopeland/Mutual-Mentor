import { useState } from 'react'
import { BarChart3, TrendingUp, Users, Target, RefreshCw } from 'lucide-react'
import useAnalytics from '../hooks/useAnalytics'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PipelineChart from '../components/shared/PipelineChart'
import PerformanceTrendChart from '../components/shared/PerformanceTrendChart'

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export default function Analytics() {
  const {
    pipelineData,
    performanceData,
    loading,
    error,
    performancePeriod,
    setPerformancePeriod,
    refetch
  } = useAnalytics()

  const [selectedMetrics, setSelectedMetrics] = useState(['contacts', 'kept_appointments', 'closes'])

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        // Don't allow removing the last metric
        if (prev.length === 1) return prev
        return prev.filter(m => m !== metric)
      }
      return [...prev, metric]
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Track your performance trends and pipeline health</p>
        </div>
        <Button
          variant="secondary"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">Error loading analytics: {error}</p>
        </Card>
      )}

      {/* Summary Stats */}
      {pipelineData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{pipelineData.totalClients}</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-3xl font-bold text-green-600">{pipelineData.averageProgress}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-3xl font-bold text-blue-600">{pipelineData.byStatus?.active || 0}</p>
              </div>
              <Target className="h-10 w-10 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Need Attention</p>
                <p className="text-3xl font-bold text-amber-600">{pipelineData.potentiallyStalled}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-amber-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Pipeline Distribution */}
      <Card className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Pipeline Distribution</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading pipeline data...
          </div>
        ) : (
          <>
            <PipelineChart data={pipelineData?.byPhase || []} />
            {pipelineData && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-600">Active:</span>{' '}
                  <span className="font-semibold text-blue-600">{pipelineData.byStatus?.active || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Stalled:</span>{' '}
                  <span className="font-semibold text-yellow-600">{pipelineData.byStatus?.stalled || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Completed:</span>{' '}
                  <span className="font-semibold text-green-600">{pipelineData.byStatus?.completed || 0}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Lost:</span>{' '}
                  <span className="font-semibold text-red-600">{pipelineData.byStatus?.lost || 0}</span>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Performance Trends */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Performance Trends</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Period:</span>
            <select
              value={performancePeriod}
              onChange={(e) => setPerformancePeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Toggle Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => toggleMetric('contacts')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes('contacts')
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => toggleMetric('kept_appointments')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes('kept_appointments')
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Kept Appointments
          </button>
          <button
            onClick={() => toggleMetric('closes')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes('closes')
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Closes
          </button>
          <button
            onClick={() => toggleMetric('gut_ratio')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedMetrics.includes('gut_ratio')
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            GUT Ratio
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading performance data...
          </div>
        ) : (
          <PerformanceTrendChart
            data={performanceData?.trends || []}
            metrics={selectedMetrics}
          />
        )}

        {performanceData && performanceData.trends?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {performanceData.trends.length} {performancePeriod === 'weekly' ? 'weeks' : 'months'} of data
            </p>
          </div>
        )}
      </Card>

      {/* Insights */}
      {pipelineData && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Insights & Recommendations</h2>
          <div className="space-y-3">
            {pipelineData.potentiallyStalled > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Clients Need Attention</p>
                  <p className="text-sm text-gray-600">
                    {pipelineData.potentiallyStalled} client{pipelineData.potentiallyStalled > 1 ? 's have' : ' has'} been
                    inactive for more than 14 days. Consider following up to keep the momentum going.
                  </p>
                </div>
              </div>
            )}

            {pipelineData.byStatus?.stalled > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Stalled Clients</p>
                  <p className="text-sm text-gray-600">
                    {pipelineData.byStatus.stalled} client{pipelineData.byStatus.stalled > 1 ? 's are' : ' is'} marked
                    as stalled. Review these clients and decide whether to re-engage or update their status.
                  </p>
                </div>
              </div>
            )}

            {pipelineData.averageProgress < 50 && pipelineData.totalClients > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Pipeline Progress</p>
                  <p className="text-sm text-gray-600">
                    Your average pipeline progress is {pipelineData.averageProgress}%. Focus on moving existing
                    clients through the pipeline before adding new prospects.
                  </p>
                </div>
              </div>
            )}

            {pipelineData.potentiallyStalled === 0 && pipelineData.byStatus?.stalled === 0 && pipelineData.averageProgress >= 50 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Great Progress!</p>
                  <p className="text-sm text-gray-600">
                    Your pipeline is healthy with no immediate attention needed. Keep up the excellent work!
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
