'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, BookOpen, BookMarked, Lock, Unlock, Vote } from 'lucide-react'
import { PortalStatus } from '@/types/database.types'
import { Button, Skeleton } from '@/components/ui'
import { getMonthName, getCurrentMonthYear } from '@/lib/utils'
import toast from 'react-hot-toast'

export function PortalManager() {
  const [statuses, setStatuses] = useState<PortalStatus[]>([])
  const [loading, setLoading] = useState(true)

  const { month, year } = getCurrentMonthYear()

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/portal')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setStatuses(data || [])
    } catch (error) {
      console.error('Error fetching statuses:', error)
      toast.error('Failed to load portal statuses')
    } finally {
      setLoading(false)
    }
  }

  const toggleNomination = async (status: PortalStatus) => {
    const newStatus = !status.nomination_open
    
    // If opening nominations, close voting
    const updates: Partial<PortalStatus> = {
      nomination_open: newStatus,
      ...(newStatus && { voting_open: false }),
    }

    try {
      const response = await fetch('/api/portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: status.id, ...updates }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setStatuses(statuses.map((s) => 
        s.id === status.id ? { ...s, ...updates } : s
      ))
      toast.success(`Nominations ${newStatus ? 'opened' : 'closed'}`)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const toggleVoting = async (status: PortalStatus) => {
    const newStatus = !status.voting_open
    
    // If opening voting, close nominations
    const updates: Partial<PortalStatus> = {
      voting_open: newStatus,
      ...(newStatus && { nomination_open: false }),
    }

    try {
      const response = await fetch('/api/portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: status.id, ...updates }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setStatuses(statuses.map((s) => 
        s.id === status.id ? { ...s, ...updates } : s
      ))
      toast.success(`Voting ${newStatus ? 'opened' : 'closed'}`)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const createPortalStatus = async (targetMonth: number, targetYear: number, category: 'fiction' | 'non-fiction') => {
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: targetMonth,
          year: targetYear,
          category,
          nomination_open: false,
          voting_open: false,
        }),
      })

      if (!response.ok) throw new Error('Failed to create')

      const data = await response.json()
      setStatuses([...statuses, data])
      toast.success('Portal status created')
    } catch (error) {
      toast.error('Failed to create portal status')
    }
  }

  // Show a rolling planning window (current + next 6) plus any already-configured periods.
  // This keeps past reopened months (e.g. March) manageable from admin.
  const periods = useMemo(() => {
    const periodMap = new Map<string, { month: number; year: number }>()

    for (let i = 0; i <= 6; i++) {
      const totalMonths = (month - 1) + i
      const targetMonth = (totalMonths % 12) + 1
      const targetYear = year + Math.floor(totalMonths / 12)
      periodMap.set(`${targetYear}-${targetMonth}`, { month: targetMonth, year: targetYear })
    }

    statuses.forEach((status) => {
      periodMap.set(`${status.year}-${status.month}`, { month: status.month, year: status.year })
    })

    return Array.from(periodMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  }, [month, year, statuses])

  const nonFictionPeriods = useMemo(() => {
    return periods.filter((period) => {
      const hasConfiguredNonFiction = statuses.some(
        (status) =>
          status.month === period.month &&
          status.year === period.year &&
          status.category === 'non-fiction'
      )

      // Default bi-monthly cadence starts on odd months (Jan, Mar, May...)
      return hasConfiguredNonFiction || period.month % 2 === 1
    })
  }, [periods, statuses])

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
          {nonFictionPeriods.map((period) => {
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
