'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, BookOpen, BookMarked, Lock, Unlock, Vote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PortalStatus } from '@/types/database.types'
import { Button, Skeleton } from '@/components/ui'
import { getMonthName, getCurrentMonthYear, getNextMonth } from '@/lib/utils'
import toast from 'react-hot-toast'

export function PortalManager() {
  const [statuses, setStatuses] = useState<PortalStatus[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])
  const { month, year } = getCurrentMonthYear()
  const nextMonth = getNextMonth(month, year)

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    // Fetch statuses for current and next 3 months
    const { data } = await supabase
      .from('portal_status')
      .select('*')
      .order('year', { ascending: true })
      .order('month', { ascending: true })

    setStatuses(data || [])
    setLoading(false)
  }

  const toggleNomination = async (status: PortalStatus) => {
    const newStatus = !status.nomination_open
    
    // If opening nominations, close voting
    const updates: Partial<PortalStatus> = {
      nomination_open: newStatus,
      ...(newStatus && { voting_open: false }),
    }

    const { error } = await supabase
      .from('portal_status')
      .update(updates)
      .eq('id', status.id)

    if (error) {
      toast.error('Failed to update status')
      return
    }

    setStatuses(statuses.map((s) => 
      s.id === status.id ? { ...s, ...updates } : s
    ))
    toast.success(`Nominations ${newStatus ? 'opened' : 'closed'}`)
  }

  const toggleVoting = async (status: PortalStatus) => {
    const newStatus = !status.voting_open
    
    // If opening voting, close nominations
    const updates: Partial<PortalStatus> = {
      voting_open: newStatus,
      ...(newStatus && { nomination_open: false }),
    }

    const { error } = await supabase
      .from('portal_status')
      .update(updates)
      .eq('id', status.id)

    if (error) {
      toast.error('Failed to update status')
      return
    }

    setStatuses(statuses.map((s) => 
      s.id === status.id ? { ...s, ...updates } : s
    ))
    toast.success(`Voting ${newStatus ? 'opened' : 'closed'}`)
  }

  const createPortalStatus = async (targetMonth: number, targetYear: number, category: 'fiction' | 'non-fiction') => {
    const { data, error } = await supabase
      .from('portal_status')
      .insert({
        month: targetMonth,
        year: targetYear,
        category,
        nomination_open: false,
        voting_open: false,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create portal status')
      return
    }

    setStatuses([...statuses, data])
    toast.success('Portal status created')
  }

  // Generate periods for the next 6 months
  const periods = []
  for (let i = 1; i <= 6; i++) {
    const targetMonth = ((month + i - 1) % 12) + 1
    const targetYear = year + Math.floor((month + i - 1) / 12)
    periods.push({ month: targetMonth, year: targetYear })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Portal Control</h2>
      </div>

      <p className="text-white/60">
        Control when users can nominate and vote for books. Only one portal can be open at a time per category.
      </p>

      {/* Fiction Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Fiction (Monthly)</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {periods.map((period) => {
            const status = statuses.find(
              (s) => s.month === period.month && s.year === period.year && s.category === 'fiction'
            )

            return (
              <PortalCard
                key={`fiction-${period.month}-${period.year}`}
                period={period}
                category="fiction"
                status={status}
                onToggleNomination={() => status && toggleNomination(status)}
                onToggleVoting={() => status && toggleVoting(status)}
                onCreate={() => createPortalStatus(period.month, period.year, 'fiction')}
              />
            )
          })}
        </div>
      </div>

      {/* Non-Fiction Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-500/10 rounded-lg">
            <BookMarked className="w-5 h-5 text-accent-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Non-Fiction (Bi-Monthly)</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {periods.filter((_, i) => i % 2 === 0).map((period) => {
            const status = statuses.find(
              (s) => s.month === period.month && s.year === period.year && s.category === 'non-fiction'
            )

            return (
              <PortalCard
                key={`non-fiction-${period.month}-${period.year}`}
                period={period}
                category="non-fiction"
                status={status}
                onToggleNomination={() => status && toggleNomination(status)}
                onToggleVoting={() => status && toggleVoting(status)}
                onCreate={() => createPortalStatus(period.month, period.year, 'non-fiction')}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface PortalCardProps {
  period: { month: number; year: number }
  category: 'fiction' | 'non-fiction'
  status: PortalStatus | undefined
  onToggleNomination: () => void
  onToggleVoting: () => void
  onCreate: () => void
}

function PortalCard({ period, category, status, onToggleNomination, onToggleVoting, onCreate }: PortalCardProps) {
  if (!status) {
    return (
      <div className="card border-dashed">
        <div className="text-center py-4">
          <Calendar className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">
            {getMonthName(period.month)} {period.year}
          </p>
          <p className="text-sm text-white/40 mb-4">Not configured</p>
          <Button size="sm" variant="secondary" onClick={onCreate}>
            Configure
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white font-medium">
            {getMonthName(period.month)} {period.year}
          </p>
          <p className="text-xs text-white/40 capitalize">{category}</p>
        </div>
        <div className="flex items-center gap-1">
          {status.nomination_open && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-400">
              Nominations
            </span>
          )}
          {status.voting_open && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-accent-500/20 text-accent-400">
              Voting
            </span>
          )}
          {!status.nomination_open && !status.voting_open && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/40">
              Closed
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={status.nomination_open ? 'primary' : 'secondary'}
          onClick={onToggleNomination}
          className="flex-1"
          leftIcon={status.nomination_open ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        >
          Nominate
        </Button>
        <Button
          size="sm"
          variant={status.voting_open ? 'primary' : 'secondary'}
          onClick={onToggleVoting}
          className="flex-1"
          leftIcon={status.voting_open ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        >
          Vote
        </Button>
      </div>
    </div>
  )
}
