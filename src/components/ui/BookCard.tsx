'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { BookOpen, User, Vote } from 'lucide-react'
import { Book, Suggestion } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface BookCardProps {
  book: Book | Suggestion
  variant?: 'default' | 'suggestion' | 'featured'
  showVoteButton?: boolean
  hasVoted?: boolean
  onVote?: () => void
  onClick?: () => void
}

export function BookCard({
  book,
  variant = 'default',
  showVoteButton = false,
  hasVoted = false,
  onVote,
  onClick,
}: BookCardProps) {
  const isSuggestion = 'vote_count' in book
  const voteCount = isSuggestion ? (book as Suggestion).vote_count : 0

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'group relative perspective-1000 h-full',
        variant === 'featured' && 'md:col-span-2'
      )}
      onClick={onClick}
    >
      <div className="relative card card-hover overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Book cover image */}
        <div
          className={cn(
            'relative aspect-[3/4] overflow-hidden rounded-xl mb-4 flex-shrink-0',
            variant === 'featured' && 'md:aspect-[4/5]'
          )}
        >
          {book.image_url ? (
            <Image
              src={book.image_url}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/40" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-60" />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full',
                book.category === 'fiction'
                  ? 'bg-primary-500/90 text-white'
                  : 'bg-accent-500/90 text-dark-950'
              )}
            >
              {book.category === 'fiction' ? 'Fiction' : 'Non-Fiction'}
            </span>
          </div>

          {/* Vote count for suggestions */}
          {isSuggestion && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-dark-950/80 rounded-full">
              <Vote className="w-3 h-3 text-primary-400" />
              <span className="text-xs font-medium text-white">{voteCount}</span>
            </div>
          )}
        </div>

        {/* Book info */}
        <div className="flex flex-col flex-1">
          <h3
            className={cn(
              'font-display font-bold text-white group-hover:text-gradient transition-all duration-300 line-clamp-2 min-h-[2.5rem]',
              variant === 'featured' ? 'text-2xl' : 'text-lg'
            )}
          >
            {book.title}
          </h3>

          <div className="flex items-center gap-2 text-white/60 mt-2">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{book.author}</span>
          </div>

          <p className="text-white/50 text-sm leading-relaxed mt-2 line-clamp-3 flex-1">
            {book.synopsis}
          </p>

          <p className="text-white/50 text-sm leading-relaxed mt-2 line-clamp-3 flex-1">
            {book.synopsis}
          </p>

          {/* Vote button for suggestions */}
          {showVoteButton && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation()
                onVote?.()
              }}
              disabled={hasVoted}
              className={cn(
                'mt-4 w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-300',
                hasVoted
                  ? 'bg-primary-500/20 text-primary-400 cursor-default'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              )}
            >
              {hasVoted ? '✓ Voted' : 'Vote for this book'}
            </motion.button>
          )}
        </div>

        {/* Decorative border gradient */}
        <div className="absolute inset-0 rounded-2xl p-px pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
    </motion.div>
  )
}

interface BookCardSkeletonProps {
  variant?: 'default' | 'featured'
}

export function BookCardSkeleton({ variant = 'default' }: BookCardSkeletonProps) {
  return (
    <div
      className={cn(
        'card overflow-hidden',
        variant === 'featured' && 'md:col-span-2'
      )}
    >
      <div
        className={cn(
          'relative aspect-[3/4] rounded-xl mb-4 bg-white/5 animate-pulse',
          variant === 'featured' && 'md:aspect-[4/5]'
        )}
      />
      <div className="space-y-3">
        <div className="h-6 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-4 w-2/3 bg-white/5 rounded-lg animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-3 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-3 w-1/2 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
