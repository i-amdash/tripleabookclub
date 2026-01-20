'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BookOpen, Heart, MessageCircle, Star, Users, Calendar } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Curated Reads',
    description: 'Handpicked fiction every month and non-fiction bi-monthly, voted by our community.',
    color: 'from-primary-400 to-primary-600',
  },
  {
    icon: Users,
    title: 'Vibrant Community',
    description: 'Connect with fellow book lovers, share insights, and grow together through literature.',
    color: 'from-accent-400 to-accent-600',
  },
  {
    icon: MessageCircle,
    title: 'Book Discussions',
    description: 'Engage in thought-provoking discussions about characters, themes, and plot twists.',
    color: 'from-secondary-400 to-secondary-600',
  },
  {
    icon: Star,
    title: 'Member Voting',
    description: 'Your voice matters! Suggest and vote for the next book selection each month.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Heart,
    title: 'Reading Goals',
    description: 'Track your reading journey and achieve your literary goals with our community.',
    color: 'from-pink-400 to-rose-600',
  },
  {
    icon: Calendar,
    title: 'Regular Events',
    description: 'Join our book club meetings, author sessions, and special literary events.',
    color: 'from-emerald-400 to-teal-600',
  },
]

export function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Calculate how far to scroll horizontally
  // 8 cards (intro + 6 features + CTA) * 350px + gaps
  const totalScrollDistance = (8 * 350) + (7 * 32) - (typeof window !== 'undefined' ? window.innerWidth : 1200) + 100

  const x = useTransform(scrollYProgress, [0, 1], [0, -totalScrollDistance])
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '300vh' }}
    >
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
        {/* Section header */}
        <div className="flex-shrink-0 pt-8 px-8">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div>
              <span className="inline-block px-4 py-1.5 mb-2 text-xs font-semibold tracking-wider uppercase bg-primary-500/10 text-primary-400 rounded-full border border-primary-500/20">
                Why Join Us
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-warm">
                The Triple A Experience
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/40">
              <span className="text-sm">Scroll</span>
              <div className="w-20 h-0.5 bg-white/20 relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary-500"
                  style={{ width: progressWidth }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal scroll wrapper */}
        <motion.div
          ref={scrollerRef}
          className="flex items-center gap-8 flex-1 px-8"
          style={{ x }}
        >
          {/* Intro card */}
          <div className="flex-shrink-0 w-[350px] h-[450px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-6">📚</div>
              <p className="text-xl text-white/60 leading-relaxed">
                Discover what makes our book club special
              </p>
            </div>
          </div>

          {/* Feature cards */}
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex-shrink-0 w-[350px] h-[450px] card group hover:scale-105 transition-transform duration-500"
            >
              <div className="h-full flex flex-col">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-6`}
                >
                  <div className="w-full h-full bg-dark-900 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-8xl font-display font-bold text-white/5 mb-4">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="mt-auto">
                  <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-gradient transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* CTA card */}
          <div className="flex-shrink-0 w-[350px] h-[450px] card bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
            <div className="text-center px-8">
              <h3 className="text-3xl font-display font-bold text-white mb-4">
                Interested?
              </h3>
              <p className="text-white/80 mb-8">
                Registration opens every 6 months. Learn more about us!
              </p>
              <a
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-full hover:bg-white/90 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
