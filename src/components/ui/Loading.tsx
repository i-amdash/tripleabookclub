'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <svg
      className={cn('animate-spin', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-primary-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  )
}

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Spinning Book */}
        <div className="relative" style={{ perspective: '500px' }}>
          <motion.div
            className="w-12 h-16 relative"
            animate={{ rotateY: [0, 360] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front cover */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-r-md rounded-l-sm shadow-lg"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'translateZ(4px)',
              }}
            >
              {/* Book spine highlight */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-700 rounded-l-sm" />
              {/* Decorative lines */}
              <div className="absolute inset-2 left-3 border border-primary-300/30 rounded-sm" />
            </div>
            
            {/* Back cover */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 rounded-r-md rounded-l-sm shadow-lg"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg) translateZ(4px)',
              }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary-700 rounded-r-sm" />
            </div>
            
            {/* Pages (side) */}
            <div 
              className="absolute top-1 bottom-1 bg-gradient-to-r from-gray-100 to-gray-200"
              style={{ 
                width: '8px',
                right: '-4px',
                transform: 'rotateY(90deg)',
                transformOrigin: 'left center',
              }}
            />
          </motion.div>
          
          {/* Shadow */}
          <motion.div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-primary-500/20 rounded-full blur-sm"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-white/80 text-sm font-medium">{message}</p>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary-500"
                animate={{ 
                  scale: [1, 1.3, 1], 
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-white/5 rounded-lg',
        className
      )}
    />
  )
}
