// Só do protótipo: força o estado das telas (carregando, erro, vazio) e troca o perfil falso.
import { createContext, useCallback, useContext, useEffect, useState, type DependencyList, type ReactNode } from 'react'
import { FlaskConicalIcon } from 'lucide-react'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/compartilhado/ui/shadcn/popover'
import { ToggleGroup, ToggleGroupItem } from '@/compartilhado/ui/shadcn/toggle-group'
import { EstadoErro } from '@/compartilhado/ui/EstadoErro'
import { EstadoVazio } from '@/compartilhado/ui/EstadoVazio'

export type EstadoDemo = 'conteudo' | 'carregando' | 'erro' | 'vazio'

function lerLocal(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravarLocal(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    // Sem localStorage: vale só nesta visita.
  }
}

const ContextoDemo = createContext<{ estado: EstadoDemo; trocar: (e: EstadoDemo) => void }>({
  estado: 'conteudo',
  trocar: () => {},
})

export function ProvedorDemo({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDemo>(() => {
    const salvo = lerLocal('estadoDemo')
    return salvo === 'carregando' || salvo === 'erro' || salvo === 'vazio' ? salvo : 'conteudo'
  })
  const trocar = useCallback((novo: EstadoDemo) => {
    setEstado(novo)
    gravarLocal('estadoDemo', novo)
  }, [])
  return <ContextoDemo.Provider value={{ estado, trocar }}>{children}</ContextoDemo.Provider>
}

export function useDemo() {
  return useContext(ContextoDemo)
}

export type Carregamento<T> =
  | { status: 'carregando' }
  | { status: 'erro'; erro: string }
  | { status: 'vazio' }
  | { status: 'conteudo'; dados: T }

// Chama uma função de api/ e devolve o estado da tela. O seletor de demonstração pode forçar outro estado.
export function useCarregar<T>(buscar: () => Promise<T>, deps: DependencyList) {
  const { estado: forcado } = useDemo()
  const [resultado, setResultado] = useState<Carregamento<T>>({ status: 'carregando' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true
    setResultado({ status: 'carregando' })
    buscar()
      .then((dados) => ativo && setResultado({ status: 'conteudo', dados }))
      .catch((e: Error) => ativo && setResultado({ status: 'erro', erro: e.message }))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  let final: Carregamento<T> = resultado
  if (forcado === 'carregando') final = { status: 'carregando' }
  if (forcado === 'erro') final = { status: 'erro', erro: 'Não foi possível carregar os dados. Verifique sua conexão.' }
  if (forcado === 'vazio' && resultado.status === 'conteudo') final = { status: 'vazio' }
  return { ...final, recarregar, atual: resultado.status === 'conteudo' ? resultado.dados : undefined }
}

// Mostra esqueleto, erro, vazio ou o conteúdo, conforme o carregamento.
export function Carregavel<T>({
  carga,
  esqueleto,
  vazio,
  ehVazio,
  children,
}: {
  carga: Carregamento<T> & { recarregar: () => void }
  esqueleto: ReactNode
  vazio?: { titulo: string; descricao?: string; acao?: ReactNode }
  ehVazio?: (dados: T) => boolean
  children: (dados: T) => ReactNode
}) {
  if (carga.status === 'carregando') return <>{esqueleto}</>
  if (carga.status === 'erro') return <EstadoErro mensagem={carga.erro} onTentar={carga.recarregar} />
  const semDados = carga.status === 'vazio' || (ehVazio !== undefined && ehVazio(carga.dados))
  if (semDados) {
    if (!vazio) return carga.status === 'conteudo' ? <>{children(carga.dados)}</> : null
    return <EstadoVazio titulo={vazio.titulo} descricao={vazio.descricao} acao={vazio.acao} />
  }
  return <>{children(carga.dados)}</>
}

const PERFIS = [
  { valor: 'membro', rotulo: 'Membro' },
  { valor: 'rh', rotulo: 'RH' },
  { valor: 'diretor_rh', rotulo: 'Diretor RH' },
  { valor: 'diretor_setor', rotulo: 'Diretor de setor' },
  { valor: 'presidente', rotulo: 'Presidente' },
  { valor: 'nenhum', rotulo: 'Sem acesso' },
]

const ESTADOS: { valor: EstadoDemo; rotulo: string }[] = [
  { valor: 'conteudo', rotulo: 'Conteúdo' },
  { valor: 'carregando', rotulo: 'Carregando' },
  { valor: 'erro', rotulo: 'Erro' },
  { valor: 'vazio', rotulo: 'Vazio' },
]

// Botão discreto no canto da tela, só para demonstrar o protótipo.
export function PainelDemo() {
  const { estado, trocar } = useDemo()
  const perfil = lerLocal('perfilFalso') ?? 'membro'

  function trocarPerfil(novo: string) {
    if (!novo) return
    gravarLocal('perfilFalso', novo)
    window.location.assign('/inicio')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Opções de demonstração"
          className="fixed bottom-24 left-3 z-40 opacity-40 hover:opacity-100 lg:right-4 lg:bottom-4 lg:left-auto"
        >
          <FlaskConicalIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="flex w-80 flex-col gap-4 rounded-2xl">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Perfil (protótipo)</p>
          <ToggleGroup type="single" size="sm" spacing={1} value={perfil} onValueChange={trocarPerfil} className="flex-wrap">
            {PERFIS.map((p) => (
              <ToggleGroupItem key={p.valor} value={p.valor}>
                {p.rotulo}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Estado das telas</p>
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            value={estado}
            onValueChange={(v) => v && trocar(v as EstadoDemo)}
            className="flex-wrap"
          >
            {ESTADOS.map((e) => (
              <ToggleGroupItem key={e.valor} value={e.valor}>
                {e.rotulo}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  )
}
