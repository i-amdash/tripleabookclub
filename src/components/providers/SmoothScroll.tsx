'use client'

import { useEffect, useRef, ReactNode } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProps {
  children: ReactNode
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    // RAF loop
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Integrate with GSAP ScrollTrigger if available
    const initScrollTrigger = async () => {
      try {
        const gsap = (await import('gsap')).default
        const { ScrollTrigger } = await import('gsap/ScrollTrigger')
        
        gsap.registerPlugin(ScrollTrigger)

        // Update ScrollTrigger on Lenis scroll
        lenis.on('scroll', ScrollTrigger.update)

        // Use Lenis requestAnimationFrame with GSAP ticker
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000)
        })

        // Disable GSAP's lag smoothing
        gsap.ticker.lagSmoothing(0)
      } catch (error) {
        // GSAP not available, continue without it
      }
    }

    initScrollTrigger()

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
