import { useState } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { atribuirDiretoria, removerDiretoria, situacaoDosSetores } from '@/compartilhado/api/diretorias'
import type { Membro, SituacaoSetor } from '@/compartilhado/tipos'
import { ConfirmDialog } from '@/compartilhado/ui/ConfirmDialog'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

function mensagemDeErro(e: unknown): string {
  return e instanceof Error ? e.message : 'Não foi possível concluir. Tente de novo.'
}

// Setores que um diretor ou o presidente dirige. Só aparece para quem dirige o RH e para o presidente
// (quem decide as diretorias); a proteção real é a regra do banco.
export function SecaoDiretorias({ membro }: { membro: Membro }) {
  const { recarregarSessao } = useSessao()
  const [versao, setVersao] = useState(0)
  const situacao = useCarregar(() => situacaoDosSetores(), [versao])
  const [escolhido, setEscolhido] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [removendo, setRemovendo] = useState<SituacaoSetor | null>(null)

  async function atribuir(setor: string) {
    setEnviando(true)
    try {
      await atribuirDiretoria(setor, membro.id)
      toast.success(`${membro.nome} agora dirige ${setor}`)
      setEscolhido('')
      setVersao((v) => v + 1)
      // Pode mudar as diretorias de quem está logado (o novo diretor, ou quem dirigia o setor, como o
      // presidente que passa o RH): recarrega sempre, para o cargo e os poderes da tela mudarem junto.
      await recarregarSessao()
    } catch (e) {
      toast.error(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Diretorias</CardTitle>
        <CardDescription>Setores que esta pessoa dirige. Quem dirige o setor RH age como diretor do RH.</CardDescription>
      </CardHeader>
      <CardContent>
        <Carregavel carga={situacao} esqueleto={<Skeleton className="h-24 rounded-2xl" />}>
          {(setores) => {
            const dela = setores.filter((s) => s.diretor?.id === membro.id)
            const alvo = setores.find((s) => s.setor === escolhido)
            const atual = alvo?.diretor && alvo.diretor.id !== membro.id ? alvo.diretor : null
            return (
              <div className="flex flex-col gap-4">
                {dela.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Esta pessoa não dirige nenhum setor.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {dela.map((s) => (
                      <li key={s.setor} className="flex items-center gap-1 rounded-full border bg-card py-1 pr-1 pl-3 text-sm">
                        <span className="font-medium">{s.setor}</span>
                        {s.ehRH && <StatusPill tom="roxo">Diretor do RH</StatusPill>}
                        <Button variant="ghost" size="icon-sm" aria-label={`Remover ${s.setor}`} onClick={() => setRemovendo(s)}>
                          <XIcon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={escolhido} onValueChange={setEscolhido}>
                      <SelectTrigger aria-label="Atribuir setor" className="min-w-52">
                        <SelectValue placeholder="Atribuir setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {setores
                            .filter((s) => s.diretor?.id !== membro.id)
                            .map((s) => (
                              <SelectItem key={s.setor} value={s.setor}>
                                {s.setor}
                                {s.diretor ? ` (hoje: ${s.diretor.nome})` : ' (vago)'}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button disabled={!escolhido || enviando} onClick={() => void atribuir(escolhido)}>
                      <PlusIcon data-icon="inline-start" /> {enviando ? 'Aguarde...' : 'Atribuir'}
                    </Button>
                  </div>
                  {atual && (
                    <p className="text-sm text-muted-foreground">
                      {escolhido} hoje é dirigido por {atual.nome}. Ao atribuir, {atual.nome} deixa de dirigir esse setor.
                    </p>
                  )}
                </div>
                <ConfirmDialog
                  aberto={removendo !== null}
                  onAbertoChange={(a) => !a && setRemovendo(null)}
                  titulo={`Remover ${membro.nome} de ${removendo?.setor ?? ''}?`}
                  descricao={`${removendo?.setor ?? 'O setor'} fica sem diretor até alguém ser atribuído.${removendo?.ehRH ? ' Sem o RH, esta pessoa perde os poderes de diretor do RH.' : ''}`}
                  confirmar="Remover"
                  perigoso
                  onConfirmar={async () => {
                    if (!removendo) return
                    try {
                      await removerDiretoria(removendo.setor)
                      toast.success(`${removendo.setor} ficou sem diretor`)
                      setVersao((v) => v + 1)
                      // Pode ser a diretoria de quem está logado: recarrega sempre (cargo e poderes da tela).
                      await recarregarSessao()
                    } catch (e) {
                      toast.error(mensagemDeErro(e))
                    }
                  }}
                />
              </div>
            )
          }}
        </Carregavel>
      </CardContent>
    </Card>
  )
}
