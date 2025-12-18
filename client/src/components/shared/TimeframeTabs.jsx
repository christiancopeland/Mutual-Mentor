import clsx from 'clsx'

const TIMEFRAMES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export default function TimeframeTabs({ selectedPeriod, onPeriodChange }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg min-w-max">
        {TIMEFRAMES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onPeriodChange(value)}
            className={clsx(
              'px-3 md:px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap',
              selectedPeriod === value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
