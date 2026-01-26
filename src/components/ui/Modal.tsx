'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const sizes = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-4xl w-full',
    full: 'max-w-[95vw] w-full',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full glass rounded-2xl shadow-2xl overflow-hidden flex flex-col',
              size === 'full' ? 'h-[90vh]' : 'max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-64px)]',
              sizes[size]
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex-shrink-0">
                <h2 className="font-display text-lg sm:text-xl font-semibold text-white pr-2">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Close button when no title */}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-dark-900/50 text-white/60 hover:text-white hover:bg-dark-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Content */}
            <div className={cn(
              'p-4 sm:p-6 overflow-y-auto flex-1',
              size === 'full' && 'h-full'
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
