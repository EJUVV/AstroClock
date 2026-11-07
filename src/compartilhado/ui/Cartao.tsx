import type { ReactNode } from 'react'

export default function Cartao({
  titulo,
  children,
  className = '',
}: {
  titulo: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-sm ${className}`}
    >
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}
