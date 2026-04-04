/** Card container that groups a set of related controls with an optional section label. */
interface SectionCardProps {
  label?: string
  children: React.ReactNode
}

export function SectionCard({ label, children }: SectionCardProps) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl p-3">
      {label && <div className="text-xs font-bold text-[#555] mb-1">{label}</div>}
      {children}
    </div>
  )
}
