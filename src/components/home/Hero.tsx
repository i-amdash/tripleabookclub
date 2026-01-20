'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Users, Sparkles, User } from 'lucide-react'
import { Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, Profile } from '@/types/database.types'
import { getCurrentMonthYear, getMonthName } from '@/lib/utils'

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [currentBook, setCurrentBook] = useState<Book | null>(null)
  const [randomMembers, setRandomMembers] = useState<Profile[]>([])
  const [memberCount, setMemberCount] = useState(20)
  const [mounted, setMounted] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const { month, year } = getCurrentMonthYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Fetch current month's fiction book, or latest if not found
    const fetchCurrentBook = async () => {
      try {
        // First try to get current month's book
        let { data } = await supabase
          .from('books')
          .select('*')
          .eq('category', 'fiction')
          .eq('month', month)
          .eq('year', year)
          .eq('is_selected', true)
        .maybeSingle()
        // If no book for current month, get the latest selected fiction book
        if (!data) {
          const { data: latestBook } = await supabase
            .from('books')
            .select('*')
            .eq('category', 'fiction')
            .eq('is_selected', true)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(1)
          .maybeSingle()
          data = latestBook
        }

        if (data) {
          setCurrentBook(data)
        }
      } catch (error) {
        console.warn('Error fetching current book:', error)
      }
    }

    // Fetch random members for avatars
    const fetchRandomMembers = async () => {
      try {
        const { data, count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .not('avatar_url', 'is', null)
          .limit(10)

        if (data) {
          // Shuffle and take 3 random members
          const shuffled = [...data].sort(() => Math.random() - 0.5)
          setRandomMembers(shuffled.slice(0, 3))
        }
        if (count) {
          setMemberCount(count)
        }
      } catch (error) {
        console.warn('Error fetching members:', error)
      }
    }

    fetchCurrentBook()
    fetchRandomMembers()
  }, [supabase, month, year, mounted])

  useEffect(() => {
    if (!heroRef.current || !mounted) return

    // Dynamically import GSAP to avoid SSR issues
    const initAnimations = async () => {
      try {
        const gsap = (await import('gsap')).default
        
        const ctx = gsap.context(() => {
          // Animate floating elements
          gsap.to('.float-element', {
            y: -20,
            duration: 2,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1,
            stagger: 0.3,
          })

          // Animate background blobs
          gsap.to('.blob', {
            scale: 1.1,
            duration: 4,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1,
            stagger: 0.5,
          })
        }, heroRef)

        return () => ctx.revert()
      } catch (error) {
        console.warn('GSAP animation failed:', error)
      }
    }

    initAnimations()
  }, [mounted])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="blob absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="blob absolute -bottom-1/4 right-0 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[100px]" />
        <div className="blob absolute top-0 right-1/4 w-[400px] h-[400px] bg-secondary-500/10 rounded-full blur-[80px]" />
        
        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-30" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/50 to-dark-950" />
      </div>

      <div className="container-main relative z-10 py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/5 rounded-full border border-white/10"
            >
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-white/80">Welcome to the club</span>
            </motion.div>

            {/* Title */}
            <h1 ref={titleRef} className="heading-display mb-6">
              <span className="block text-white">Build Your</span>
              <span className="block text-gradient-warm">Reading Habit</span>
            </h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/60 leading-relaxed mb-8"
            >
              A social and friendly community geared towards building the habit of 
              reading books until it becomes second nature. We read 1 fiction book monthly, 
              1 non-fiction bi-monthly, and meetup monthly to discuss our reads.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link href="/books">
                <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Explore Books
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </Link>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">18</div>
                  <div className="text-sm text-white/50">Books/Year</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-secondary-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">20+</div>
                  <div className="text-sm text-white/50">Members</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image / 3D Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main floating book */}
              <div className="float-element absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-80 perspective-1000">
                  {currentBook?.image_url ? (
                    <div className="absolute inset-0 rounded-lg shadow-2xl shadow-primary-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                      <Image
                        src={currentBook.image_url}
                        alt={currentBook.title}
                        fill
                        className="object-cover"
                        sizes="256px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-2xl shadow-primary-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <div className="absolute inset-2 border border-white/10 rounded-md" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white/30" />
                      </div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="h-2 bg-white/20 rounded mb-2" />
                        <div className="h-2 bg-white/10 rounded w-2/3" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating cards */}
              <div className="float-element absolute top-0 right-0 p-4 glass rounded-2xl shadow-xl max-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {currentBook?.title || 'New Book'}
                    </div>
                    <div className="text-xs text-white/50">
                      {currentBook ? `${getMonthName(currentBook.month)} ${currentBook.year}` : `${getMonthName(month)} ${year}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="float-element absolute bottom-10 -left-10 p-4 glass rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {randomMembers.length > 0 ? (
                      randomMembers.map((member) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full border-2 border-dark-900 overflow-hidden bg-dark-800"
                        >
                          {member.avatar_url ? (
                            <Image
                              src={member.avatar_url}
                              alt={member.full_name || 'Member'}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 border-2 border-dark-900"
                        />
                      ))
                    )}
                  </div>
                  <div className="text-sm text-white/80">+{memberCount} reading</div>
                </div>
              </div>

              {/* Glow effect - uses book cover as base when available */}
              {currentBook?.image_url ? (
                <div className="absolute inset-0 -z-10">
                  <Image
                    src={currentBook.image_url}
                    alt=""
                    fill
                    className="object-cover blur-[100px] opacity-40 scale-150"
                    sizes="512px"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-[100px]" />
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white/50 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
