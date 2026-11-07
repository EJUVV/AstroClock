import { useState } from 'react'
import { MedalIcon } from 'lucide-react'
import { listarSetores } from '@/compartilhado/api/membros'
import { rankingDoMes } from '@/compartilhado/api/rh'
import { mesAtual, rotuloMes, somarMeses } from '@/compartilhado/datas'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Horas } from '@/compartilhado/ui/Horas'
import { NotaEmAberto } from '@/compartilhado/ui/NotaEmAberto'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Card, CardContent } from '@/compartilhado/ui/shadcn/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartilhado/ui/shadcn/table'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { cn } from '@/compartilhado/ui/utils'

const CORES_PODIO = ['bg-[#FDE68A] text-[#92400E]', 'bg-[#E5E7EB] text-[#374151]', 'bg-[#FED7AA] text-[#9A3412]']

function Ranking() {
  const { perfil } = useSessao()
  const doSetor = perfil === 'diretor_setor'
  const [mes, setMes] = useState(mesAtual())
  const [setor, setSetor] = useState('todos')
  const carga = useCarregar(() => Promise.all([rankingDoMes(mes), listarSetores()]), [mes])
  const meses = Array.from({ length: 6 }, (_, i) => somarMeses(mesAtual(), -i))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger size="sm" aria-label="Mês">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {meses.map((m) => (
                <SelectItem key={m} value={m}>
                  {rotuloMes(m)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {!doSetor && (
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger size="sm" aria-label="Setor">
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
        <p className="text-xs text-muted-foreground">Cada semana conta para o mês da sua segunda-feira.</p>
      </div>

      <Carregavel
        carga={carga}
        esqueleto={<Skeleton className="h-96 rounded-[24px]" />}
        vazio={{ titulo: 'Sem horas neste mês', descricao: 'O ranking aparece quando houver registros.' }}
        ehVazio={([linhas]) => linhas.length === 0}
      >
        {([linhas]) => {
          const filtradas = linhas.filter((l) => setor === 'todos' || l.membro.setor === setor)
          const podio = filtradas.slice(0, 3)
          return (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {podio.map((l, i) => (
                  <Card key={l.membro.id} className={cn(i === 0 && 'cartao-roxo border-transparent')}>
                    <CardContent className="flex items-center gap-4">
                      <span className={cn('flex size-10 items-center justify-center rounded-[12px] font-bold', i === 0 ? 'bg-white/20 text-white' : CORES_PODIO[i])}>
                        {i === 0 ? <MedalIcon className="size-5" /> : `${l.posicao}º`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{l.membro.nome}</p>
                        <p className={cn('text-xs', i === 0 ? 'text-white/75' : 'text-muted-foreground')}>{l.membro.setor}</p>
                      </div>
                      <Horas valor={l.horasTotal} className="text-2xl" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Posição</TableHead>
                        <TableHead>Membro</TableHead>
                        <TableHead className="hidden md:table-cell">Setor</TableHead>
                        <TableHead className="text-right">Horas totais</TableHead>
                        <TableHead className="text-right">Na sede</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtradas.map((l) => (
                        <TableRow key={l.membro.id}>
                          <TableCell>
                            {l.posicao <= 3 ? (
                              <span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold', CORES_PODIO[l.posicao - 1])}>
                                {l.posicao}
                              </span>
                            ) : (
                              <span className="pl-2 font-semibold text-muted-foreground">{l.posicao}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-3">
                              <AvatarMembro nome={l.membro.nome} className="size-8" />
                              <span className="font-semibold">{l.membro.nome}</span>
                              {l.dispensado && <StatusPill tom="neutro">semana dispensada</StatusPill>}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{l.membro.setor}</TableCell>
                          <TableCell className="text-right">
                            <Horas valor={l.horasTotal} />
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            <Horas valor={l.horasSede} className="font-semibold" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )
        }}
      </Carregavel>

      {doSetor && (
        <NotaEmAberto>se o diretor de setor vê o ranking do próprio setor. No protótipo, ele vê só o setor dele, com as posições dentro do setor.</NotaEmAberto>
      )}
    </>
  )
}

export default Ranking
