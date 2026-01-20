'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { BookOpen, BookMarked, Plus, Vote, User, Calendar } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Book, Suggestion, PortalStatus } from '@/types/database.types'
import { useAuth } from '@/hooks'
import { Tabs, TabPanel, BookCard, BookCardSkeleton, Button, Modal } from '@/components/ui'
import { SuggestionForm } from './SuggestionForm'
import { VotingSection } from './VotingSection'
import { getMonthName, getCurrentMonthYear, getNextMonth, getBiMonthlyPeriod } from '@/lib/utils'
import toast from 'react-hot-toast'

const tabs = [
  { id: 'fiction', label: 'Fiction', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'non-fiction', label: 'Non-Fiction', icon: <BookMarked className="w-4 h-4" /> },
]

export function BooksPageContent() {
  const [activeTab, setActiveTab] = useState('fiction')
  const [books, setBooks] = useState<Book[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [userSuggestionCount, setUserSuggestionCount] = useState(0)
  const [userVotes, setUserVotes] = useState<string[]>([])

  const { user } = useAuth()
  const userRef = useRef(user)
  userRef.current = user
  
  const supabase = useMemo(() => createClient(), [])
  
  // Memoize date calculations to prevent re-renders
  const { month, year } = useMemo(() => getCurrentMonthYear(), [])
  const nextMonth = useMemo(() => getNextMonth(month, year), [month, year])
  const targetMonth = useMemo(() => 
    activeTab === 'fiction' ? nextMonth.month : getBiMonthlyPeriod(nextMonth.month, nextMonth.year).startMonth,
    [activeTab, nextMonth.month, nextMonth.year]
  )

  // Fetch data based on active tab - only depends on activeTab
  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (!initialLoad) {
        setLoading(true)
      }

      try {
        // Fetch books
        const { data: booksData } = await supabase
          .from('books')
          .select('*')
          .eq('category', activeTab)
          .eq('is_selected', true)
          .order('year', { ascending: false })
          .order('month', { ascending: false })

        if (!isMounted) return
        setBooks(booksData || [])

        // Only fetch portal status and suggestions for fiction tab
        if (activeTab === 'fiction') {
          const currentTargetMonth = nextMonth.month
          
          const { data: statusData } = await supabase
            .from('portal_status')
            .select('*')
            .eq('month', currentTargetMonth)
            .eq('year', nextMonth.year)
            .eq('category', 'fiction')
            .maybeSingle()

          if (!isMounted) return
          setPortalStatus(statusData)

          // Fetch suggestions for next month
          if (statusData?.nomination_open || statusData?.voting_open) {
            const { data: suggestionsData } = await supabase
              .from('suggestions')
              .select('*, profiles(full_name)')
              .eq('month', currentTargetMonth)
              .eq('year', nextMonth.year)
              .eq('category', 'fiction')
              .order('vote_count', { ascending: false })

            if (!isMounted) return
            setSuggestions(suggestionsData || [])

            // Count user's suggestions
            const currentUser = userRef.current
            if (currentUser) {
              const userSuggestions = (suggestionsData || []).filter(s => s.user_id === currentUser.id)
              setUserSuggestionCount(userSuggestions.length)

              // Fetch user's votes
              const { data: votesData } = await supabase
                .from('votes')
                .select('suggestion_id')
                .eq('user_id', currentUser.id)
                .eq('month', currentTargetMonth)
                .eq('year', nextMonth.year)

              if (!isMounted) return
              setUserVotes((votesData || []).map(v => v.suggestion_id))
            }
          } else {
            setSuggestions([])
            setUserSuggestionCount(0)
            setUserVotes([])
          }
        } else {
          // Clear suggestions for non-fiction tab
          setPortalStatus(null)
          setSuggestions([])
          setUserSuggestionCount(0)
          setUserVotes([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitialLoad(false)
        }
      }
    }

    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [activeTab, supabase, nextMonth.month, nextMonth.year])

  const handleSuggestionSubmit = async (suggestion: Omit<Suggestion, 'id' | 'user_id' | 'vote_count' | 'created_at'>) => {
    if (!user) {
      toast.error('Please login to suggest books')
      return
    }

    if (userSuggestionCount >= 3) {
      toast.error('You can only suggest 3 books per month')
      return
    }

    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          ...suggestion,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      setSuggestions(prev => [...prev, data])
      setUserSuggestionCount(prev => prev + 1)
      setShowSuggestionModal(false)
      toast.success('Book suggestion submitted!')
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast.error('Failed to submit suggestion')
    }
  }

  const handleVote = async (suggestionId: string) => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }

    if (userVotes.includes(suggestionId)) {
      toast.error('You have already voted for this book')
      return
    }

    try {
      const targetMonth = activeTab === 'fiction' ? nextMonth.month : getBiMonthlyPeriod(nextMonth.month, nextMonth.year).startMonth

      // Add vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          suggestion_id: suggestionId,
          month: targetMonth,
          year: nextMonth.year,
        })

      if (voteError) throw voteError

      // Increment vote count
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (suggestion) {
        await supabase
          .from('suggestions')
          .update({ vote_count: (suggestion.vote_count || 0) + 1 })
          .eq('id', suggestionId)
      }

      // Update local state
      setUserVotes(prev => [...prev, suggestionId])
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestionId
            ? { ...s, vote_count: (s.vote_count || 0) + 1 }
            : s
        ).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      )

      toast.success('Vote recorded!')
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Failed to record vote')
    }
  }

  const periodLabel = getMonthName(nextMonth.month)

  return (
    <section className="section-padding pt-0">
      <div className="container-main">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Nomination/Voting status - Only show on Fiction tab */}
          {activeTab === 'fiction' && portalStatus && (
            <div className="flex items-center gap-3">
              {portalStatus.nomination_open && user && (
                <Button
                  onClick={() => setShowSuggestionModal(true)}
                  disabled={userSuggestionCount >= 3}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Suggest a Book ({3 - userSuggestionCount} left)
                </Button>
              )}
              {portalStatus.voting_open && (
                <div className="flex items-center gap-2 px-4 py-2 bg-accent-500/10 rounded-full text-accent-400 text-sm">
                  <Vote className="w-4 h-4" />
                  <span>Voting Open for {periodLabel}</span>
                </div>
              )}
              {portalStatus.nomination_open && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-400 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Nominations Open for {periodLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <TabPanel value="fiction" activeValue={activeTab}>
          <BooksGrid
            books={books}
            suggestions={suggestions}
            portalStatus={portalStatus}
            loading={loading}
            userVotes={userVotes}
            onVote={handleVote}
            onBookClick={setSelectedBook}
            category="fiction"
          />
        </TabPanel>

        <TabPanel value="non-fiction" activeValue={activeTab}>
          <BooksGrid
            books={books}
            suggestions={[]}
            portalStatus={null}
            loading={loading}
            userVotes={[]}
            onVote={handleVote}
            onBookClick={setSelectedBook}
            category="non-fiction"
          />
        </TabPanel>
      </div>

      {/* Suggestion Modal */}
      <Modal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
        title="Suggest a Fiction Book"
        size="lg"
      >
        <SuggestionForm
          category="fiction"
          month={targetMonth}
          year={nextMonth.year}
          onSubmit={handleSuggestionSubmit}
          onCancel={() => setShowSuggestionModal(false)}
        />
      </Modal>

      {/* Book Detail Modal */}
      <Modal
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        title=""
        size="lg"
      >
        {selectedBook && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Book Cover */}
            <div className="flex-shrink-0 w-full md:w-64">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                {selectedBook.image_url ? (
                  <Image
                    src={selectedBook.image_url}
                    alt={selectedBook.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="flex-1 space-y-4">
              <div>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                  selectedBook.category === 'fiction'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-accent-500/20 text-accent-400'
                }`}>
                  {selectedBook.category === 'fiction' ? 'Fiction' : 'Non-Fiction'}
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
                  {selectedBook.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-white/60">
                <User className="w-4 h-4" />
                <span>{selectedBook.author}</span>
              </div>

              <div className="flex items-center gap-2 text-white/60">
                <Calendar className="w-4 h-4" />
                <span>{getMonthName(selectedBook.month)} {selectedBook.year}</span>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white/80 mb-2">Synopsis</h4>
                <p className="text-white/60 leading-relaxed">
                  {selectedBook.synopsis}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

interface BooksGridProps {
  books: Book[]
  suggestions: Suggestion[]
  portalStatus: PortalStatus | null
  loading: boolean
  userVotes: string[]
  onVote: (id: string) => void
  onBookClick: (book: Book) => void
  category: 'fiction' | 'non-fiction'
}

function BooksGrid({ books, suggestions, portalStatus, loading, userVotes, onVote, onBookClick, category }: BooksGridProps) {
  const { user } = useAuth()
  const [hasAnimated, setHasAnimated] = useState(false)

  // Mark as animated after first render with books
  useEffect(() => {
    if (books.length > 0 && !hasAnimated) {
      setHasAnimated(true)
    }
  }, [books.length, hasAnimated])

  // Group books by month/year
  const groupedBooks = useMemo(() => {
    const groups: { [key: string]: Book[] } = {}
    books.forEach(book => {
      const key = `${book.year}-${book.month}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(book)
    })
    
    // Sort keys by date (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const [yearA, monthA] = a.split('-').map(Number)
      const [yearB, monthB] = b.split('-').map(Number)
      if (yearA !== yearB) return yearB - yearA
      return monthB - monthA
    })
    
    return sortedKeys.map(key => {
      const [year, month] = key.split('-').map(Number)
      return {
        label: `${getMonthName(month)} ${year}`,
        books: groups[key]
      }
    })
  }, [books])

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {/* Voting Section - Only for Fiction */}
      {category === 'fiction' && portalStatus?.voting_open && suggestions.length > 0 && (
        <VotingSection
          suggestions={suggestions}
          userVotes={userVotes}
          onVote={onVote}
          isLoggedIn={!!user}
        />
      )}

      {/* Books by Month */}
      {groupedBooks.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-6xl mb-4">📚</div>
          <h4 className="text-xl font-semibold text-white mb-2">
            No Books Yet
          </h4>
          <p className="text-white/60">
            {category === 'fiction'
              ? 'Our first fiction read is coming soon!'
              : 'Our first non-fiction read is coming soon!'}
          </p>
        </div>
      ) : (
        groupedBooks.map(({ label, books: monthBooks }) => (
          <div key={label}>
            <h3 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              {label}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {monthBooks.map((book) => (
                <div key={book.id}>
                  <BookCard book={book} onClick={() => onBookClick(book)} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
