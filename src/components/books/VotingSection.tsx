'use client'

import { motion } from 'framer-motion'
import { Trophy, Vote } from 'lucide-react'
import { Suggestion } from '@/types/database.types'
import { BookCard } from '@/components/ui'
import Link from 'next/link'

interface VotingSectionProps {
  suggestions: Suggestion[]
  userVotes: string[]
  onVote: (id: string) => void
  isLoggedIn: boolean
  onBookClick: (book: Suggestion) => void
}

export function VotingSection({ suggestions, userVotes, onVote, isLoggedIn, onBookClick }: VotingSectionProps) {
  if (suggestions.length === 0) {
    return null
  }

  // Sort by vote count
  const sortedSuggestions = [...suggestions].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
  const topSuggestion = sortedSuggestions[0]
  const otherSuggestions = sortedSuggestions.slice(1)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Vote className="w-6 h-6 text-primary-400" />
            Vote for Next Month's Read
          </h3>
          <p className="text-white/60">
            The book with the most votes will be selected as our next read.
          </p>
        </div>

        {!isLoggedIn && (
          <Link href="/auth/login" className="btn-primary text-sm">
            Login to Vote
          </Link>
        )}
      </div>

      {/* Leading suggestion */}
      {topSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute -top-3 -left-3 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-500 rounded-full text-dark-950 text-sm font-semibold">
              <Trophy className="w-4 h-4" />
              Leading
            </div>
          </div>

          <div className="p-1 rounded-3xl bg-gradient-to-br from-accent-400 to-primary-500">
            <div className="bg-dark-900 rounded-2xl p-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <BookCard
                  book={topSuggestion}
                  showVoteButton={isLoggedIn}
                  hasVoted={userVotes.includes(topSuggestion.id)}
                  onVote={() => onVote(topSuggestion.id)}
                  onClick={() => onBookClick(topSuggestion)}
                />
                <div className="space-y-4">
                  <div>
                    <div className="text-6xl font-display font-bold text-gradient mb-2">
                      {topSuggestion.vote_count || 0}
                    </div>
                    <div className="text-white/60">votes received</div>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    {topSuggestion.synopsis}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Other suggestions */}
      {otherSuggestions.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-6">Other Suggestions</h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BookCard
                  book={suggestion}
                  showVoteButton={isLoggedIn}
                  hasVoted={userVotes.includes(suggestion.id)}
                  onVote={() => onVote(suggestion.id)}
                  onClick={() => onBookClick(suggestion)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
