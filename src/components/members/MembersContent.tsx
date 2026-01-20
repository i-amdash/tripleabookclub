'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { User, Instagram, Twitter, Linkedin } from 'lucide-react'
import { useSupabase } from '@/hooks'
import { Member } from '@/types/database.types'
import { Skeleton } from '@/components/ui'

gsap.registerPlugin(ScrollTrigger)

export function MembersContent() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabase()

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('is_visible', true)
        .order('order_index', { ascending: true })

      setMembers(data || [])
      setLoading(false)
    }

    fetchMembers()
  }, [])

  useEffect(() => {
    if (!containerRef.current || loading) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.member-card',
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [loading])

  if (loading) {
    return (
      <section className="section-padding pt-0">
        <div className="container-main">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card">
                <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (members.length === 0) {
    return (
      <section className="section-padding pt-0">
        <div className="container-main">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 card"
          >
            <div className="text-6xl mb-4">👥</div>
            <h4 className="text-xl font-semibold text-white mb-2">
              Members Coming Soon
            </h4>
            <p className="text-white/60">
              Our member profiles are being prepared. Check back soon!
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding pt-0">
      <div className="container-main">
        <div ref={containerRef} className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface MemberCardProps {
  member: Member
}

function MemberCard({ member }: MemberCardProps) {
  const socialLinks = member.social_links as { instagram?: string; twitter?: string; linkedin?: string } | null

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
      className="member-card card text-center group"
    >
      {/* Avatar */}
      <div className="relative w-28 h-28 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="absolute inset-1 rounded-full overflow-hidden bg-dark-800">
          {member.image_url ? (
            <img
              src={member.image_url}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
              <User className="w-12 h-12 text-white/60" />
            </div>
          )}
        </div>
        
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary-500/0 group-hover:border-primary-500/50 transition-colors" />
      </div>

      {/* Info */}
      <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-gradient transition-all duration-300">
        {member.name}
      </h3>
      <p className="text-primary-400 text-sm font-medium mb-4">{member.role}</p>

      {member.bio && (
        <p className="text-white/60 text-sm leading-relaxed mb-6 line-clamp-3">
          {member.bio}
        </p>
      )}

      {/* Social Links */}
      {socialLinks && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
          {socialLinks.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {socialLinks.twitter && (
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
            >
              <Twitter className="w-4 h-4" />
            </a>
          )}
          {socialLinks.linkedin && (
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  )
}
