// Uma cor para cada setor, na identidade visual (decidido pelo Victor em 25/11/2026; RH verde e Gestão e
// Qualidade laranja em 26/11/2026; o time ainda pode trocar).
// Contraste conferido nos dois temas. Para quem tem daltonismo, azul e roxo ficam parecidos, e vermelho, verde
// e laranja também: por isso a cor nunca aparece sozinha, sempre com o nome do setor ao lado.
// Setor que não está aqui (criado depois pelo diretor do RH) fica cinza: nunca gerar uma cor nova automaticamente.
const CORES: Record<string, string> = {
  projetos: '#2563eb', // azul
  comercial: '#e03131', // vermelho (pedido do Victor; perto do vermelho de "abaixo da meta", por isso só na bolinha ao lado do nome)
  rh: '#2f9e44', // verde (pedido do Victor em 26/11; perto do verde de "cumpriu", por isso só ao lado do nome)
  'gestao e qualidade': '#f08c00', // laranja (pedido do Victor em 26/11; mais vivo que o âmbar de "alerta")
  marketing: '#a855f7', // roxo
}

export const COR_SEM_SETOR = '#8b8798'

function chave(setor: string): string {
  return setor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

export function corDoSetor(setor: string): string {
  return CORES[chave(setor)] ?? COR_SEM_SETOR
}
