import { useState } from 'react'
import { MedalIcon } from 'lucide-react'
import { listarSetores } from '@/compartilhado/api/membros'
import { rankingDosSetores } from '@/compartilhado/api/ranking'
import { rankingDoMes } from '@/compartilhado/api/rh'
import { mesAtual, rotuloMes, somarMeses } from '@/compartilhado/datas'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Horas } from '@/compartilhado/ui/Horas'
import { NotaEmAberto } from '@/compartilhado/ui/NotaEmAberto'
import { RankingSetores } from '@/compartilhado/ui/RankingSetores'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Card, CardContent } from '@/compartilhado/ui/shadcn/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartilhado/ui/shadcn/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartilhado/ui/shadcn/tabs'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { cn } from '@/compartilhado/ui/utils'
import { EtiquetaSetor } from '@/compartilhado/ui/EtiquetaSetor'

const CORES_PODIO = ['bg-[#FDE68A] text-[#92400E]', 'bg-[#E5E7EB] text-[#374151]', 'bg-[#FED7AA] text-[#9A3412]']

function Ranking() {
  const { perfil, setoresQueDirijo } = useSessao()
  const doSetor = perfil === 'diretor_setor'
  const [mes, setMes] = useState(mesAtual())
  const [setor, setSetor] = useState('todos')
  const carga = useCarregar(() => Promise.all([rankingDoMes(mes), listarSetores()]), [mes])
  const meses = Array.from({ length: 6 }, (_, i) => somarMeses(mesAtual(), -i))
  const [aba, setAba] = useState('membros')
  const setores = useCarregar(() => rankingDosSetores(mes), [mes])

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
        {(!doSetor || setoresQueDirijo.length > 1) && aba === 'membros' && (
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger size="sm" aria-label="Setor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="todos">{doSetor ? 'Meus setores' : 'Todos os setores'}</SelectItem>
              {(doSetor ? setoresQueDirijo : (carga.atual?.[1] ?? [])).map((s) => (
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

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="membros">Membros</TabsTrigger>
          <TabsTrigger value="setores">Setores</TabsTrigger>
        </TabsList>
        <TabsContent value="membros" className="flex flex-col gap-4">
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
                            {/* No celular: posição curta, sem avatar e com as horas na sede embaixo do total, para caber sem rolar. */}
                            <TableHead className="w-10 sm:w-16">
                              <span className="sm:hidden">#</span>
                              <span className="hidden sm:inline">Posição</span>
                            </TableHead>
                            <TableHead>Membro</TableHead>
                            <TableHead className="hidden md:table-cell">Setor</TableHead>
                            <TableHead className="text-right">
                              <span className="sm:hidden">Horas</span>
                              <span className="hidden sm:inline">Horas totais</span>
                            </TableHead>
                            <TableHead className="hidden text-right sm:table-cell">Na sede</TableHead>
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
                                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-normal">
                                  <AvatarMembro nome={l.membro.nome} className="size-8 max-sm:hidden" />
                                  <span className="font-semibold">{l.membro.nome}</span>
                                  {/* No celular, só "dispensada": o selo inteiro não quebra linha e empurrava a tabela para os lados. */}
                                  {l.dispensado && (
                                    <StatusPill tom="neutro">
                                      <span className="hidden sm:inline">semana</span> dispensada
                                    </StatusPill>
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="hidden text-muted-foreground md:table-cell">
                                <EtiquetaSetor setor={l.membro.setor} />
                              </TableCell>
                              <TableCell className="text-right">
                                <Horas valor={l.horasTotal} />
                                <span className="block text-xs text-muted-foreground sm:hidden">
                                  <Horas valor={l.horasSede} /> na sede
                                </span>
                              </TableCell>
                              <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
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
        </TabsContent>
        <TabsContent value="setores">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-lg font-semibold">Ranking dos setores</p>
                <p className="text-sm text-muted-foreground">Média de horas por membro no mês. Quem foi dispensado não entra na conta.</p>
              </div>
              <Carregavel carga={setores} esqueleto={<Skeleton className="h-72 rounded-[24px]" />}>
                {(linhas) => <RankingSetores linhas={linhas} meuSetor={doSetor ? setoresQueDirijo[0] : undefined} />}
              </Carregavel>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {doSetor && (
        <NotaEmAberto>se o diretor de setor vê o ranking do próprio setor. No protótipo, ele vê só o setor dele, com as posições dentro do setor.</NotaEmAberto>
      )}
    </>
  )
}

export default Ranking
