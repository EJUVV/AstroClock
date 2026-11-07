import type { CSSProperties, ReactNode } from 'react'

const ESTRELAS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  r: 1 + (i % 3) * 0.7,
  d: 2.5 + (i % 5),
  t: (i * 0.37) % 4,
}))

// Fundo espacial: estrelas piscando e, opcionalmente, o arco roxo brilhante (a "borda do buraco negro").
// variante 'arco' (painel do membro) ou 'brilho' (mais simples, painel do RH).
export default function Fundo({ variante, children }: { variante: 'arco' | 'brilho'; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05040a] text-white">
      <style>{`
        @keyframes pisca { 0%, 100% { opacity: .15 } 50% { opacity: .95 } }
        @keyframes pulsa { from { opacity: .55 } to { opacity: 1 } }
        .estrela { animation: pisca var(--d) ease-in-out infinite; }
        .arco { animation: pulsa 4s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .estrela, .arco { animation: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ESTRELAS.slice(0, variante === 'arco' ? 60 : 40).map((e, i) => (
          <span
            key={i}
            className="estrela absolute rounded-full bg-[#f5f3ff]"
            style={
              {
                left: `${e.x}%`,
                top: `${e.y}%`,
                width: e.r,
                height: e.r,
                animationDelay: `-${e.t}s`,
                '--d': `${e.d}s`,
              } as CSSProperties
            }
          />
        ))}
        {variante === 'arco' ? (
          <div
            className="arco absolute left-1/2 top-32 h-[420px] w-[170%] max-w-[1500px] -translate-x-1/2"
            style={{
              borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
              boxShadow:
                'inset 0 4px 14px 1px rgba(243,232,255,0.95), inset 0 26px 70px 8px rgba(168,85,247,0.8), 0 -8px 90px 8px rgba(124,58,237,0.55)',
              WebkitMaskImage: 'linear-gradient(#000 35%, transparent 92%)',
              maskImage: 'linear-gradient(#000 35%, transparent 92%)',
            }}
          />
        ) : (
          <div
            className="absolute -right-40 -top-56 size-[620px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,0.45), transparent)' }}
          />
        )}
      </div>
      {children}
    </div>
  )
}
