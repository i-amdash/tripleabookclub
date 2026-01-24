'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/hooks'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/books', label: 'Books' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/members', label: 'Members' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, isLoading, isAdmin, signOut, hasMounted } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled
            ? 'py-3 glass-dark shadow-lg'
            : 'py-6 bg-transparent'
        )}
      >
        <div className="container-main">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-10 flex items-center gap-3 group">
              <div className="relative w-10 h-10 overflow-hidden rounded-full ring-2 ring-primary-500/20 group-hover:ring-primary-500/50 transition-all duration-300">
                <Image
                  src="/logo.jpg"
                  alt="Triple A Book Club"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <span className="font-display text-xl font-bold hidden sm:block">
                <span className="text-gradient">Triple A</span>
                <span className="text-white/80 font-normal ml-1">Book Club</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <ul className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
                        pathname === link.href
                          ? 'text-white'
                          : 'text-white/60 hover:text-white'
                      )}
                    >
                      {link.label}
                      {pathname === link.href && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute inset-0 bg-white/10 rounded-full -z-10"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Auth Section - Render consistent state on SSR/initial render, then update after hydration */}
              <div className="flex items-center gap-3">
                {!hasMounted ? (
                  // Always show Sign In on SSR and initial render to prevent hydration mismatch
                  <Link href="/auth/login" className="btn-primary text-sm">
                    Sign In
                  </Link>
                ) : user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-400" />
                      </div>
                      <span className="text-sm text-white/80 hidden xl:block">
                        {user.full_name || 'Member'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-48 py-2 glass rounded-xl shadow-xl"
                        >
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4" />
                              Admin Dashboard
                            </Link>
                          )}
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            My Profile
                          </Link>
                          <button
                            onClick={() => {
                              signOut()
                              setIsUserMenuOpen(false)
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/auth/login" className="btn-primary text-sm">
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden relative z-10 p-2 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-dark-950/95 backdrop-blur-xl">
              <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'text-3xl font-display font-bold transition-colors',
                        pathname === link.href
                          ? 'text-gradient'
                          : 'text-white/60 hover:text-white'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  className="mt-8"
                >
                  {hasMounted && user ? (
                    <div className="flex flex-col items-center gap-4">
                      {isAdmin && (
                        <Link href="/admin" className="btn-secondary">
                          Admin Dashboard
                        </Link>
                      )}
                      <Link href="/profile" className="btn-secondary">
                        My Profile
                      </Link>
                      <button onClick={signOut} className="btn-ghost">
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link href="/auth/login" className="btn-primary">
                      Sign In
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
