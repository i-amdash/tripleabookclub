'use client'

import { useState, useEffect } from 'react'
import { Check, X, BookOpen, Trophy } from 'lucide-react'
import { useSupabase } from '@/hooks'
import { Suggestion } from '@/types/database.types'
import { Button, Skeleton } from '@/components/ui'
import { getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

export function SuggestionsManager() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useSupabase()

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from('suggestions')
      .select('*, profiles(full_name, email)')
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })

    setSuggestions(data || [])
    setLoading(false)
  }

  const handleSelectWinner = async (suggestion: Suggestion) => {
    if (!confirm(`Select "${suggestion.title}" as the ${suggestion.category} book for ${getMonthName(suggestion.month)} ${suggestion.year}?`)) {
      return
    }

    try {
      // Add as a book
      const { error: bookError } = await supabase
        .from('books')
        .insert({
          title: suggestion.title,
          author: suggestion.author,
          synopsis: suggestion.synopsis,
          image_url: suggestion.image_url,
          category: suggestion.category,
          month: suggestion.month,
          year: suggestion.year,
          is_selected: true,
        })

      if (bookError) throw bookError

      // Close voting for this period
      await supabase
        .from('portal_status')
        .update({ voting_open: false, nomination_open: false })
        .eq('month', suggestion.month)
        .eq('year', suggestion.year)
        .eq('category', suggestion.category)

      toast.success(`"${suggestion.title}" selected as winner!`)
      fetchSuggestions()
    } catch (error) {
      console.error(error)
      toast.error('Failed to select winner')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this suggestion?')) return

    const { error } = await supabase.from('suggestions').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete suggestion')
      return
    }

    setSuggestions(suggestions.filter((s) => s.id !== id))
    toast.success('Suggestion deleted')
  }

  // Group suggestions by month/year/category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const key = `${suggestion.year}-${suggestion.month}-${suggestion.category}`
    if (!acc[key]) {
      acc[key] = {
        month: suggestion.month,
        year: suggestion.year,
        category: suggestion.category,
        items: [],
      }
    }
    acc[key].items.push(suggestion)
    return acc
  }, {} as Record<string, { month: number; year: number; category: string; items: Suggestion[] }>)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Manage Suggestions</h2>
        <div className="text-center py-12 card">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No suggestions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Manage Suggestions</h2>

      {Object.values(groupedSuggestions).map((group) => (
        <div key={`${group.year}-${group.month}-${group.category}`} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${group.category === 'fiction' ? 'bg-primary-500/10' : 'bg-accent-500/10'}`}>
              <BookOpen className={`w-5 h-5 ${group.category === 'fiction' ? 'text-primary-400' : 'text-accent-400'}`} />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {getMonthName(group.month)} {group.year} - {group.category === 'fiction' ? 'Fiction' : 'Non-Fiction'}
            </h3>
            <span className="text-sm text-white/40">({group.items.length} suggestions)</span>
          </div>

          <div className="grid gap-3">
            {group.items.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`card flex items-center gap-4 ${index === 0 ? 'ring-1 ring-accent-500/50' : ''}`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-accent-500 text-dark-950' : 'bg-white/10 text-white/60'
                }`}>
                  {index === 0 ? <Trophy className="w-4 h-4" /> : index + 1}
                </div>

                {/* Book cover */}
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {suggestion.image_url ? (
                    <img
                      src={suggestion.image_url}
                      alt={suggestion.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{suggestion.title}</h4>
                  <p className="text-sm text-white/60">{suggestion.author}</p>
                  <p className="text-xs text-white/40">
                    Suggested by {(suggestion as any).profiles?.full_name || 'Unknown'}
                  </p>
                </div>

                {/* Vote count */}
                <div className="text-center px-4">
                  <div className="text-2xl font-bold text-primary-400">{suggestion.vote_count || 0}</div>
                  <div className="text-xs text-white/40">votes</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSelectWinner(suggestion)}
                    leftIcon={<Check className="w-3 h-3" />}
                  >
                    Select
                  </Button>
                  <button
                    onClick={() => handleDelete(suggestion.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
