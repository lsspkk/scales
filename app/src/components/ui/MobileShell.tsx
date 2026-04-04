/** Wraps app content in a centered ~390px mobile viewport; shows grey letterbox on desktop. */
interface MobileShellProps {
  children: React.ReactNode
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-[#888] flex items-start justify-center">
      <div className="relative w-full max-w-[390px] min-h-[100svh] bg-[#fffbe9] flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
