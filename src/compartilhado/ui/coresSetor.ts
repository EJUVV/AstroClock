// Uma cor para cada setor, na identidade visual (decidido pelo Victor em 25/11/2026; o time ainda pode trocar).
// Validadas para daltonismo e contraste nos dois temas (guia de gráficos): azul e roxo ficam parecidos para
// quem tem daltonismo, por isso a cor nunca aparece sozinha, sempre com o nome do setor ao lado.
// Setor que não está aqui (criado depois pelo diretor do RH) fica cinza: nunca gerar uma cor nova automaticamente.
const CORES: Record<string, string> = {
  projetos: '#2563eb', // azul
  comercial: '#e03131', // vermelho (pedido do Victor; perto do vermelho de "abaixo da meta", por isso só na bolinha ao lado do nome)
  rh: '#e05ab4', // rosa (um pouco mais quente, para não se confundir com o vermelho do Comercial)
  'gestao e qualidade': '#16a888', // verde-água (diferente do verde de "cumpriu")
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
