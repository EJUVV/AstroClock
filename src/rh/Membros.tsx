import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EllipsisVerticalIcon, EyeIcon, PlusIcon, SearchIcon, UserMinusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { alterarPerfil, cadastrarMembro, desativarMembro, listarMembros, listarSetores } from '@/compartilhado/api/membros'
import { hoje } from '@/compartilhado/datas'
import { corrigeRegistros, NOME_PERFIL } from '@/compartilhado/perfis'
import type { Membro, Perfil } from '@/compartilhado/tipos'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { ConfirmDialog } from '@/compartilhado/ui/ConfirmDialog'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardContent } from '@/compartilhado/ui/shadcn/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/compartilhado/ui/shadcn/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/compartilhado/ui/shadcn/dropdown-menu'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/compartilhado/ui/shadcn/field'
import { Input } from '@/compartilhado/ui/shadcn/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartilhado/ui/shadcn/table'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

function CadastroMembro({
  aberto,
  onAbertoChange,
  setores,
  onCadastrado,
}: {
  aberto: boolean
  onAbertoChange: (a: boolean) => void
  setores: string[]
  onCadastrado: () => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [setor, setSetor] = useState('')
  const [perfil, setPerfil] = useState<Perfil>('membro')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (aberto) {
      setNome('')
      setEmail('')
      setSetor('')
      setPerfil('membro')
      setErro(null)
    }
  }, [aberto])

  async function salvar() {
    if (!setor) {
      setErro('Escolha o setor')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const novo = await cadastrarMembro({ nome, email, setor, dataEntrada: hoje() })
      if (perfil !== 'membro') await alterarPerfil(novo.id, perfil)
      toast.success('Membro cadastrado', { description: 'A meta dele começa a valer na semana que vem.' })
      onCadastrado()
      onAbertoChange(false)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar membro</DialogTitle>
          <DialogDescription>A pessoa entra com a conta Google @ejuvv.com. A meta começa na semana seguinte ao cadastro.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="cad-nome">Nome</FieldLabel>
            <Input id="cad-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
          </Field>
          <Field>
            <FieldLabel htmlFor="cad-email">E-mail</FieldLabel>
            <Input id="cad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome.sobrenome@ejuvv.com" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Setor</FieldLabel>
              <Select value={setor} onValueChange={setSetor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {setores.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Perfil</FieldLabel>
              <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(NOME_PERFIL) as Perfil[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {NOME_PERFIL[p]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {perfil === 'diretor_setor' && <FieldDescription>Cada setor tem um único diretor. Diretores não contabilizam horas.</FieldDescription>}
          {(perfil === 'presidente' || perfil === 'diretor_rh') && <FieldDescription>Diretores não contabilizam horas: ficam fora da meta e do ranking.</FieldDescription>}
          {erro && <FieldError>{erro}</FieldError>}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onAbertoChange(false)} disabled={enviando}>
            Voltar
          </Button>
          <Button onClick={() => void salvar()} disabled={enviando}>
            {enviando ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Membros() {
  const { perfil } = useSessao()
  const veTodosOsSetores = perfil !== 'diretor_setor'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const busca = useRef<HTMLInputElement>(null)
  const [versao, setVersao] = useState(0)
  const carga = useCarregar(() => Promise.all([listarMembros(), listarSetores()]), [versao])
  const [texto, setTexto] = useState('')
  const [setor, setSetor] = useState('todos')
  const [status, setStatus] = useState('ativos')
  const [cadastroAberto, setCadastroAberto] = useState(false)
  const [desativando, setDesativando] = useState<Membro | null>(null)

  useEffect(() => {
    if (params.get('busca')) busca.current?.focus()
  }, [params])

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input ref={busca} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nome ou e-mail" className="pl-10" aria-label="Buscar membro" />
        </div>
        {veTodosOsSetores && (
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger aria-label="Setor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="todos">Todos os setores</SelectItem>
              {(carga.atual?.[1] ?? []).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        )}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="desativados">Desativados</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Só o diretor do RH cadastra membros. */}
        {perfil === 'diretor_rh' && (
          <Button onClick={() => setCadastroAberto(true)}>
            <PlusIcon data-icon="inline-start" /> Cadastrar membro
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <Carregavel
            carga={carga}
            esqueleto={<Skeleton className="h-96 rounded-2xl" />}
            vazio={{ titulo: 'Nenhum membro cadastrado', descricao: 'Cadastre o primeiro membro da EJ.' }}
            ehVazio={([lista]) => lista.length === 0}
          >
            {([lista]) => {
              const termo = texto.trim().toLowerCase()
              const filtrados = lista.filter(
                (m) =>
                  (setor === 'todos' || m.setor === setor) &&
                  (status === 'todos' || (status === 'ativos' ? m.ativo : !m.ativo)) &&
                  (!termo || m.nome.toLowerCase().includes(termo) || m.email.includes(termo)),
              )
              if (filtrados.length === 0) {
                return <p className="py-10 text-center text-sm text-muted-foreground">Nenhum membro encontrado com esses filtros.</p>
              }
              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      {veTodosOsSetores && <TableHead className="hidden md:table-cell">Setor</TableHead>}
                      <TableHead className="hidden md:table-cell">Perfil</TableHead>
                      <TableHead className="hidden lg:table-cell">Desde</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrados.map((m) => (
                      <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/rh/membros/${m.id}`)}>
                        <TableCell>
                          <span className="flex items-center gap-3">
                            <AvatarMembro nome={m.nome} className="size-9" />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{m.nome}</span>
                              <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
                            </span>
                          </span>
                        </TableCell>
                        {veTodosOsSetores && <TableCell className="hidden text-muted-foreground md:table-cell">{m.setor}</TableCell>}
                        <TableCell className="hidden md:table-cell">
                          <StatusPill tom={m.perfil === 'membro' ? 'neutro' : 'roxo'}>{NOME_PERFIL[m.perfil]}</StatusPill>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {new Date(`${m.dataEntrada}T12:00:00`).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {m.ativo ? <StatusPill tom="sucesso">Ativo</StatusPill> : <StatusPill tom="neutro">Desativado</StatusPill>}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${m.nome}`}>
                                <EllipsisVerticalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl">
                              <DropdownMenuGroup>
                                <DropdownMenuItem onSelect={() => navigate(`/rh/membros/${m.id}`)}>
                                  <EyeIcon /> Ver detalhe
                                </DropdownMenuItem>
                                {corrigeRegistros(perfil) && (
                                  <DropdownMenuItem variant="destructive" disabled={!m.ativo} onSelect={() => setDesativando(m)}>
                                    <UserMinusIcon /> Desativar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            }}
          </Carregavel>
        </CardContent>
      </Card>

      <CadastroMembro
        aberto={cadastroAberto}
        onAbertoChange={setCadastroAberto}
        setores={carga.atual?.[1] ?? []}
        onCadastrado={() => setVersao((v) => v + 1)}
      />

      <ConfirmDialog
        aberto={desativando !== null}
        onAbertoChange={(a) => !a && setDesativando(null)}
        titulo={`Desativar ${desativando?.nome ?? ''}?`}
        descricao="A pessoa não consegue mais entrar e deixa de contar na meta a partir desta semana. O histórico fica guardado e só o RH vê."
        confirmar="Desativar"
        perigoso
        onConfirmar={async () => {
          if (!desativando) return
          await desativarMembro(desativando.id)
          toast.success('Membro desativado')
          setVersao((v) => v + 1)
        }}
      />
    </>
  )
}

export default Membros
