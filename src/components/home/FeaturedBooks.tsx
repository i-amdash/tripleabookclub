'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/types/database.types'
import { SectionHeader, BookCard, BookCardSkeleton, Button } from '@/components/ui'
import { getMonthName, getCurrentMonthYear } from '@/lib/utils'

export function FeaturedBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const { month, year } = getCurrentMonthYear()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchBooks = async () => {
      try {
        // Get current month's fiction book
        const { data: fictionBook } = await supabase
          .from('books')
          .select('*')
          .eq('category', 'fiction')
          .eq('month', month)
          .eq('year', year)
          .eq('is_selected', true)
          .limit(1)

        // Get current period's non-fiction book (bi-monthly)
        const { data: nonFictionBook } = await supabase
          .from('books')
          .select('*')
          .eq('category', 'non-fiction')
          .eq('is_selected', true)
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1)

        const currentBooks = [
          ...(fictionBook || []),
          ...(nonFictionBook || [])
        ]

        setBooks(currentBooks)
      } catch (error) {
        console.warn('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [supabase, month, year, mounted])

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2" />

      <div className="container-main relative z-10">
        <SectionHeader
          eyebrow="Current Reads"
          title="Featured Books"
          description={`Discover what we're reading this ${getMonthName(month)} ${year}. Join the conversation and share your thoughts.`}
        />

        <div className={`grid ${books.length <= 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <BookCardSkeleton key={i} />
              ))
            : books.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BookCard book={book} />
                </motion.div>
              ))}
        </div>

        {/* Empty state */}
        {!loading && books.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Books Yet
            </h3>
            <p className="text-white/60 mb-6">
              Our first book selection is coming soon. Stay tuned!
            </p>
          </motion.div>
        )}

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <Link href="/books">
            <Button
              variant="secondary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All Books
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
