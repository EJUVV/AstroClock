import { botao } from './estilos.ts'

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-white/80">
      <div className="size-12 animate-spin rounded-full border-4 border-white/15 border-t-[#c084fc]" />
      <p>{texto}</p>
    </div>
  )
}

export function Erro({ mensagem, aoTentar }: { mensagem: string; aoTentar: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p role="alert" className="max-w-sm text-rose-200">
        {mensagem}
      </p>
      <button type="button" onClick={aoTentar} className={botao}>
        Tentar de novo
      </button>
    </div>
  )
}
