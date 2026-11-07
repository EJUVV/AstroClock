import { cn } from '@/compartilhado/ui/utils'
import LogoInfinito from '@/compartilhado/ui/LogoInfinito'

// Logo da EJUVV (infinito animado). O palco do SVG tem folga em volta, então a margem negativa a encaixa.
export function LogoIcone({ className }: { className?: string }) {
  return <LogoInfinito className={cn('-mx-3 -my-4 w-[68px] shrink-0', className)} />
}

export function Logo({ className, compacto }: { className?: string; compacto?: boolean }) {
  return (
    <span className={cn('flex items-center gap-1', className)}>
      <LogoIcone />
      {!compacto && <span className="text-lg font-bold tracking-tight">AstroClock</span>}
    </span>
  )
}
