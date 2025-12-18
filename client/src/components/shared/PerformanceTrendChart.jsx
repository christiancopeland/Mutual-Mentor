import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const METRIC_COLORS = {
  contacts: '#3B82F6', // blue
  kept_appointments: '#10B981', // emerald
  closes: '#8B5CF6', // purple
  gut_ratio: '#F59E0B', // amber
}

export default function PerformanceTrendChart({ data, metrics = ['contacts', 'kept_appointments', 'closes'] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No performance data available
      </div>
    )
  }

  const formatLabel = (key) => {
    const labels = {
      contacts: 'Contacts',
      kept_appointments: 'Kept Appointments',
      closes: 'Closes',
      gut_ratio: 'GUT Ratio %',
    }
    return labels[key] || key
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="period_label"
          tick={{ fontSize: 11 }}
          stroke="#9CA3AF"
          tickFormatter={(value) => {
            // Shorten the label for mobile
            if (value.length > 10) {
              return value.slice(0, 7) + '...'
            }
            return value
          }}
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value) => formatLabel(value)}
        />
        {metrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            name={metric}
            stroke={METRIC_COLORS[metric] || '#6B7280'}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
