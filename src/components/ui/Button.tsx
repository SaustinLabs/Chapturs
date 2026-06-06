'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'simple' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg',
  simple:
    'bg-blue-600 hover:bg-blue-700 text-white',
  ghost:
    'bg-white/10 hover:bg-white/20 text-white',
  danger:
    'bg-red-500 hover:bg-red-600 text-white',
}

const sizeStyles = {
  sm: 'text-sm rounded-lg px-3 py-1.5',
  md: 'text-sm rounded-lg px-4 py-2',
  lg: 'text-sm font-semibold rounded-xl px-5 py-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center transition-all duration-200
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
