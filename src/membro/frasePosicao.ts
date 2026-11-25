import { formatarHoras } from '@/compartilhado/datas'
import type { PosicaoRanking } from '@/compartilhado/tipos'

// "Você: 12º de 40 · faltam 6h para o 5º" (ou já no pódio, ou fora do ranking do mês).
export function frasePosicao(p: PosicaoRanking | null, escopo: 'ej' | 'setor'): string {
  if (!p) return 'Você ainda não entra no ranking deste mês.'
  const posicao = escopo === 'ej' ? p.posicaoEJ : p.posicaoSetor
  const total = escopo === 'ej' ? p.totalEJ : p.totalSetor
  const faltam = escopo === 'ej' ? p.faltamParaPodioEJ : p.faltamParaPodioSetor
  const ultimo = escopo === 'ej' ? '5º' : '3º'
  if (faltam === 0 && p.horasTotal > 0) return `Você: ${posicao}º de ${total} · você está no pódio!`
  if (faltam === 0) return `Você: ${posicao}º de ${total}.`
  return `Você: ${posicao}º de ${total} · faltam ${formatarHoras(faltam)} para o ${ultimo}`
}
