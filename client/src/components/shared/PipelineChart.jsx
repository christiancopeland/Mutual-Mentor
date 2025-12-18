import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PHASE_COLORS = {
  'Initial Contact': '#3B82F6', // blue
  'Discovery': '#8B5CF6', // purple
  'Planning Prep': '#EC4899', // pink
  'Planning': '#F59E0B', // amber
  'Closing': '#10B981', // emerald
  'Application': '#06B6D4', // cyan
  'Follow-up': '#6366F1', // indigo
}

export default function PipelineChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No pipeline data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="phase"
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => value.split(' ')[0]}
          stroke="#9CA3AF"
        />
        <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '14px'
          }}
          formatter={(value) => [`${value} clients`, 'Count']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.phase] || '#6B7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
