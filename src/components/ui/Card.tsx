'use client'

import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: boolean
}

export function Card({ hover = true, padding = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg shadow-sm
        border border-gray-200 dark:border-gray-700
        ${padding ? 'p-4 sm:p-6' : ''}
        ${hover ? 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1' : ''}
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
