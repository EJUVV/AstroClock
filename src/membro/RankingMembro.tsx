import { useState } from 'react'
import { minhaPosicaoNoRanking, podioDoMes, rankingDosSetores } from '@/compartilhado/api/ranking'
import { mesAtual, rotuloMes, somarMeses } from '@/compartilhado/datas'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { ListaPodio } from '@/compartilhado/ui/ListaPodio'
import { RankingSetores } from '@/compartilhado/ui/RankingSetores'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { frasePosicao } from './frasePosicao.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartilhado/ui/shadcn/tabs'

function RankingMembro() {
  const { eu } = useSessao()
  const [mes, setMes] = useState(mesAtual())
  const meses = Array.from({ length: 6 }, (_, i) => somarMeses(mesAtual(), -i))
  const carga = useCarregar(() => Promise.all([podioDoMes(mes), minhaPosicaoNoRanking(mes), rankingDosSetores(mes)]), [mes])

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
        <p className="text-xs text-muted-foreground">Por horas totais. Cada semana conta para o mês da sua segunda-feira.</p>
      </div>

      <Carregavel
        carga={carga}
        esqueleto={<Skeleton className="h-96 rounded-[24px]" />}
        vazio={{ titulo: 'Sem horas neste mês', descricao: 'O ranking aparece quando houver registros.' }}
        ehVazio={([podio, , setores]) => podio.ej.length === 0 && setores.length === 0}
      >
        {([podio, posicao, setores]) => (
          <Tabs defaultValue="ej">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="ej">EJ</TabsTrigger>
              <TabsTrigger value="setor">Meu setor</TabsTrigger>
              <TabsTrigger value="setores">Setores</TabsTrigger>
            </TabsList>
            <TabsContent value="ej">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pódio da EJ</CardTitle>
                  <CardDescription>Os 5 que mais registraram horas em {rotuloMes(mes).toLowerCase()}.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ListaPodio linhas={podio.ej} destaqueId={eu.id} />
                  <p className="rounded-2xl bg-muted px-4 py-3 text-sm font-medium">{frasePosicao(posicao, 'ej')}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="setor">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pódio de {eu.setor}</CardTitle>
                  <CardDescription>Os 3 do seu setor que mais registraram horas no mês.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ListaPodio linhas={podio.setor} destaqueId={eu.id} />
                  <p className="rounded-2xl bg-muted px-4 py-3 text-sm font-medium">{frasePosicao(posicao, 'setor')}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="setores">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ranking dos setores</CardTitle>
                  <CardDescription>Média de horas por membro no mês. Quem foi dispensado não entra na conta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RankingSetores linhas={setores} meuSetor={eu.setor} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </Carregavel>
    </>
  )
}

export default RankingMembro
