import { type HTMLAttributes } from 'react'

type BadgeVariant = 'genre' | 'discovery' | 'trending' | 'success' | 'warning' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  genre:    'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  discovery: 'bg-purple-50 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  trending: 'bg-orange-50 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  success:  'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning:  'bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  neutral:  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

export function Badge({ variant = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
