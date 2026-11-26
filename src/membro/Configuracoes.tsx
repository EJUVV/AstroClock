import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CameraIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import {
  definirFundoAnimado,
  reduzirImagem,
  salvarFoto,
  useFotoDoGoogle,
  useFotoEscolhida,
  useFundoAnimado,
} from '@/compartilhado/ui/preferencias'
import { nomeDoCargo } from '@/compartilhado/perfis'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Switch } from '@/compartilhado/ui/shadcn/switch'
import { SeletorTema } from '@/compartilhado/ui/tema'
import { useEhDesktop } from '@/compartilhado/ui/useEhDesktop'
import { EtiquetaSetor } from '@/compartilhado/ui/EtiquetaSetor'

const TAMANHO_MAXIMO = 15 * 1024 * 1024

function Configuracoes() {
  const { eu, cargo, diretorias } = useSessao()
  const { pathname } = useLocation()
  const ehDesktop = useEhDesktop()
  const escolhida = useFotoEscolhida(eu.email)
  const doGoogle = useFotoDoGoogle()
  const foto = escolhida ?? doGoogle
  const fundoLigado = useFundoAnimado()
  const campo = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // deixa escolher o mesmo arquivo de novo depois
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) return void toast.error('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
    if (arquivo.size > TAMANHO_MAXIMO) return void toast.error('A imagem é muito grande. Use uma de até 15 MB.')
    setEnviando(true)
    try {
      if (salvarFoto(eu.email, await reduzirImagem(arquivo))) toast.success('Foto de perfil atualizada')
      else toast.error('Não foi possível salvar a foto neste navegador. Se estiver numa aba anônima, use uma aba normal.')
    } catch (erro) {
      toast.error((erro as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      {/* No computador (e no painel do RH) o título já está no topo da página. */}
      {pathname.startsWith('/membro') && !ehDesktop && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Sua foto, aparência e preferências.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Perfil</CardTitle>
            <CardDescription>
              Por padrão, é a foto da sua conta Google. Se escolher outra, ela fica salva só neste aparelho.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <AvatarMembro nome={eu.nome} foto={foto} className="size-20 text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{eu.nome}</p>
                <p className="truncate text-sm text-muted-foreground">{eu.email}</p>
                <p className="truncate text-sm text-muted-foreground">{nomeDoCargo(cargo, diretorias)}</p>
                <EtiquetaSetor setor={eu.setor} className="max-w-full text-sm text-muted-foreground" />
              </div>
            </div>
            <input ref={campo} type="file" accept="image/*" className="sr-only" onChange={(e) => void escolher(e)} tabIndex={-1} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => campo.current?.click()} disabled={enviando}>
                <CameraIcon />
                {enviando ? 'Enviando...' : foto ? 'Trocar foto' : 'Escolher foto'}
              </Button>
              {escolhida && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!salvarFoto(eu.email, null)) toast.error('Não foi possível remover a foto neste navegador.')
                  }}
                >
                  <Trash2Icon />
                  {doGoogle ? 'Voltar para a foto do Google' : 'Remover foto'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aparência</CardTitle>
            <CardDescription>Escolha o tema e se o fundo de estrelas se mexe.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Tema</p>
                <p className="text-sm text-muted-foreground">Claro ou escuro (roxo espacial).</p>
              </div>
              <SeletorTema />
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-4">
              <label htmlFor="fundo-animado" className="min-w-0">
                <span className="block font-semibold">Fundo de estrelas animado</span>
                <span className="block text-sm text-muted-foreground">Desligue se o aparelho estiver lento ou para poupar bateria.</span>
              </label>
              <Switch id="fundo-animado" checked={fundoLigado} onCheckedChange={definirFundoAnimado} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default Configuracoes
