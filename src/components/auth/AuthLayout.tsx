'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
  alternativeText?: string
  alternativeLink?: string
  alternativeLinkText?: string
}

export function AuthLayout({
  children,
  title,
  description,
  alternativeText,
  alternativeLink,
  alternativeLinkText,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="hidden md:flex items-center gap-3 mb-12">
            <div className="relative w-10 h-10 overflow-hidden rounded-full ring-2 ring-primary-500/20">
              <Image
                src="/logo.jpg"
                alt="Triple A Book Club"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-display text-xl font-bold">
              <span className="text-gradient">Triple A</span>
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              {title}
            </h1>
            <p className="text-white/60">{description}</p>
          </div>

          {/* Form */}
          {children}

          {/* Alternative link */}
          {alternativeText && (
            <p className="mt-8 text-center text-white/60">
              {alternativeText}{' '}
              {alternativeLink && alternativeLinkText && (
                <Link
                  href={alternativeLink}
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  {alternativeLinkText}
                </Link>
              )}
            </p>
          )}
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500" />

        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 dot-pattern" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-8xl mb-6">📚</div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Build Your Reading Habit
            </h2>
            <p className="text-xl text-white/80 max-w-md">
              A social and friendly community where reading becomes second nature.
            </p>

            {/* Floating books illustration */}
            <div className="mt-12 flex items-center justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, i === 2 ? 5 : -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-16 h-24 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 shadow-lg"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
