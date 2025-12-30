/**
 * Format a phone number for display
 * Converts raw phone number to (XXX) XXX-XXXX format
 * @param {string} value - Raw phone number
 * @returns {string} - Formatted phone number
 */
export function formatPhoneNumber(value) {
  if (!value) return ''

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Format based on length
  if (digits.length === 0) {
    return ''
  } else if (digits.length <= 3) {
    return digits
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  } else {
    // Limit to 10 digits for US numbers
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
}

/**
 * Clean phone number for storage (remove formatting)
 * @param {string} value - Formatted phone number
 * @returns {string} - Digits only
 */
export function cleanPhoneNumber(value) {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/**
 * Format phone number as user types
 * Auto-applies formatting during input
 * @param {string} value - Current input value
 * @param {string} previousValue - Previous input value
 * @returns {string} - Formatted phone number
 */
export function formatPhoneInput(value, previousValue = '') {
  if (!value) return ''

  // If user is deleting, don't auto-format
  const isDeleting = previousValue && value.length < previousValue.length

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10)

  // If deleting, just clean the value
  if (isDeleting) {
    if (limitedDigits.length <= 3) {
      return limitedDigits
    } else if (limitedDigits.length <= 6) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
    } else {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
    }
  }

  // Format as user types
  return formatPhoneNumber(limitedDigits)
}
