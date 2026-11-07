const TONS = {
  ok: 'bg-emerald-400/15 text-emerald-200',
  alerta: 'bg-amber-300/15 text-amber-200',
  ruim: 'bg-rose-400/15 text-rose-200',
  neutro: 'bg-white/10 text-white/70',
}

export default function Etiqueta({ tom, children }: { tom: keyof typeof TONS; children: string }) {
  return (
    <span className={`shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-semibold ${TONS[tom]}`}>
      {children}
    </span>
  )
}
