'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    quote: "Triple A Book Club has completely transformed my reading habits. The community is incredibly supportive and the book selections are always on point.",
    author: "Victoria O.",
    role: "Member since 2026",
    avatar: null,
  },
  {
    quote: "I love the voting system! It makes me feel like my voice matters in choosing our next read. Best book club I've ever been part of.",
    author: "Tobi B.",
    role: "Member since 2026",
    avatar: null,
  },
  {
    quote: "The mix of fiction and non-fiction keeps things interesting. I've discovered so many amazing books I never would have picked up on my own.",
    author: "Amara O.",
    role: "Member since 2026",
    avatar: null,
  },
]

export function Testimonials() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wider uppercase bg-primary-500/10 text-primary-400 rounded-full border border-primary-500/20">
            Testimonials
          </span>
          <h2 className="heading-section text-gradient-warm mb-4">
            What Our Members Say
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="card relative"
            >
              {/* Quote icon */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <Quote className="w-6 h-6 text-white" />
              </div>

              <div className="pt-6">
                <p className="text-white/80 leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{testimonial.author}</div>
                    <div className="text-sm text-white/50">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
