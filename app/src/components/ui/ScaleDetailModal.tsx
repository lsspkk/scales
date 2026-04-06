import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ScaleDetailModalProps {
  title: string
  children: ReactNode
  onClose: () => void
}

/** Fullscreen modal overlay for mobile. Closes via X button or browser back. */
export function ScaleDetailModal({ title, children, onClose }: ScaleDetailModalProps) {
  // Push a history entry so browser back closes the modal
  useEffect(() => {
    history.pushState({ scaleModal: true }, '')

    const handlePopState = () => {
      onClose()
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])

  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-[#fffbe9]'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 min-h-[52px] bg-[#a0563f]'>
        <h2 className='text-lg font-bold text-white truncate pr-2'>{title}</h2>
        <button
          onClick={() => {
            history.back()
          }}
          className='w-11 h-11 flex items-center justify-center text-white text-2xl shrink-0'
          aria-label='Sulje'
        >
          &#10005;
        </button>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto px-4 py-4'>{children}</div>
    </div>
  )
}
