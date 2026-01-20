'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Users, Target, Heart, Calendar, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SiteContent } from '@/types/database.types'

interface AboutData {
  mission?: string
  vision?: string
  story?: string
  values?: { title: string; description: string; icon: string }[]
}

const defaultValues = [
  {
    icon: BookOpen,
    title: 'Love of Reading',
    description: 'We believe in the transformative power of books and their ability to expand minds and touch hearts.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'Our strength lies in our diverse community of readers who share perspectives and grow together.',
  },
  {
    icon: Target,
    title: 'Purposeful Selection',
    description: 'Every book we read is chosen with intention, balancing entertainment with enlightenment.',
  },
  {
    icon: Heart,
    title: 'Inclusive Space',
    description: 'Everyone is welcome here, regardless of reading speed or genre preferences.',
  },
  {
    icon: Calendar,
    title: 'Consistent Engagement',
    description: 'Monthly fiction and bi-monthly non-fiction keeps our reading journey steady and exciting.',
  },
  {
    icon: MessageCircle,
    title: 'Open Dialogue',
    description: 'Thoughtful discussions and respectful debates enrich our understanding of every book.',
  },
]

export function AboutContent() {
  const [aboutData, setAboutData] = useState<AboutData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAboutData = async () => {
      const supabase = createClient()
      
      const { data } = await supabase
        .from('site_content')
        .select('*')
        .eq('page', 'about')
        .maybeSingle() as { data: SiteContent | null }

      if (data?.content) {
        setAboutData(data.content as unknown as AboutData)
      }
      setLoading(false)
    }

    fetchAboutData()
  }, [])

  return (
    <div className="section-padding pt-0">
      <div className="container-main">
        {/* Mission & Vision */}
        <div className="grid lg:grid-cols-2 gap-12 mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-500/10 rounded-xl">
                <Target className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Our Mission</h3>
            </div>
            <p className="text-white/70 leading-relaxed text-lg">
              {aboutData?.mission || 
                "To build a social and friendly community geared towards developing the habit of reading books and novels until it becomes second nature for our members. We guarantee a ton of fun as we navigate this journey to become avid readers together."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-secondary-500/10 rounded-xl">
                <Heart className="w-6 h-6 text-secondary-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">Our Goal</h3>
            </div>
            <p className="text-white/70 leading-relaxed text-lg">
              {aboutData?.vision ||
                "To read 18 books through the course of 12 months — 1 fiction book every month following themed selections, and 1 non-fiction (self-help) book every two months. We meet monthly to discuss and connect."}
            </p>
          </motion.div>
        </div>

        {/* Our Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center mb-24"
        >
          <h2 className="heading-section text-gradient-warm mb-8">How It Works</h2>
          <div className="text-xl text-white/70 leading-relaxed space-y-6 text-left">
            <p>
              {aboutData?.story ||
                "We read 1 fiction book every month of the year, following a particular theme each month. Additionally, we read 1 non-fiction (self-help) book every two months."}
            </p>
            <p>
              We have monthly meetups every last Sunday of the month to discuss our reads. The venue and time are shared a week before, alongside the announcement to suggest books for the coming month.
            </p>
            <p>
              At the end of each quarter, our meetups are activity-based — think sip & paint, bowling, and more! The plan for each quarter is shared before the last month of the quarter.
            </p>
            <div className="mt-8 p-6 bg-secondary-500/10 rounded-2xl border border-secondary-500/20">
              <p className="text-white/80 font-medium">
                📌 Registration to the club is open every 6 months. Friends can be shadow members but won't be entitled to member perks. For members in diaspora, we organize online meetups so your views can be equally shared.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Values */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-section text-gradient-warm mb-4">Our Values</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              These principles guide everything we do at Triple A Book Club.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card group hover:scale-105 transition-transform duration-300"
              >
                <div className="p-3 bg-primary-500/10 rounded-xl w-fit mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <value.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Member Journey */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="heading-section text-gradient-warm mb-4">The Member Journey</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              What to expect when you join Triple A Book Club.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Get Invited', description: 'Receive your membership when registration opens' },
              { step: '02', title: 'Suggest', description: 'Nominate up to 3 books per month for selection' },
              { step: '03', title: 'Vote', description: 'Vote for your favorite book from the suggestions' },
              { step: '04', title: 'Read & Meet', description: 'Read together and meet monthly to discuss' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-display font-bold text-primary-500/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/60">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
