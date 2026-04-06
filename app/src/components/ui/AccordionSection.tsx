import { useState } from 'react'

interface AccordionSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  isMobile: boolean
}

/** Collapsible section for mobile, always-open section for desktop. */
export function AccordionSection({ title, children, defaultOpen = false, isMobile }: AccordionSectionProps) {
  const [open, setOpen] = useState(!isMobile || defaultOpen)

  if (!isMobile) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-[#5a2d0c] mb-4 pb-2 border-b-2 border-[#c9a96e]">{title}</h2>
        {children}
      </section>
    )
  }

  return (
    <section className="mb-3 border border-[#c9a96e] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 bg-[#f5e9cc] text-left min-h-[44px] py-3"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-base font-bold text-[#5a2d0c]">{title}</span>
        <span className="text-[#5a2d0c] text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4 bg-[#fffbe9]">{children}</div>}
    </section>
  )
}
