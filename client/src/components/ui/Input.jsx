import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(function Input({
  label,
  error,
  className,
  ...props
}, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 border rounded-md transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          error
            ? 'border-red-500'
            : 'border-gray-300'
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

export default Input
