import { useEffect, useRef, useState } from 'react'

interface MarqueeTextProps {
  text: string
  className?: string
  /** CSS px/second scroll speed once the marquee engages. */
  speedPxPerSec?: number
}

/**
 * Calm "digital display" marquee: the inner span scrolls right-to-left only
 * when `text` overflows the wrapper. If it fits, it sits still. Driven by a
 * ResizeObserver so the animation re-engages on container resize.
 */
export function MarqueeText({ text, className, speedPxPerSec = 30 }: MarqueeTextProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const inner = innerRef.current
    if (!wrapper || !inner) return

    const measure = () => {
      const wrapW = wrapper.clientWidth
      const innerW = inner.scrollWidth
      const overflow = innerW - wrapW
      setDistance(overflow > 0 ? overflow : 0)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrapper)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [text])

  const active = distance > 0
  const duration = active ? Math.max(6, distance / speedPxPerSec) : 0

  return (
    <span
      ref={wrapperRef}
      className={`block overflow-hidden whitespace-nowrap ${active ? 'marquee-on' : ''} ${className ?? ''}`}
      style={
        active
          ? ({
              ['--marquee-distance']: `${distance}px`,
              ['--marquee-duration']: `${duration}s`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <span ref={innerRef} className='marquee-inner inline-block'>
        {text}
      </span>
    </span>
  )
}
