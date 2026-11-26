import type { Diretoria, Perfil } from './tipos.ts'

// O que cada perfil pode fazer (docs/regras-de-negocio.md, seção 5).
// A tela usa isto só para esconder botões; a proteção real é o RLS.

export const NOME_PERFIL: Record<Perfil, string> = {
  membro: 'Membro',
  rh: 'RH',
  diretor_rh: 'Diretor do RH',
  diretor_setor: 'Diretor de setor',
  presidente: 'Presidente',
}

// Diretores não contabilizam horas: sem meta, fora do ranking e das métricas.
export function ehDiretor(perfil: Perfil): boolean {
  return perfil === 'diretor_rh' || perfil === 'diretor_setor' || perfil === 'presidente'
}

export function temPainelRH(perfil: Perfil): boolean {
  return perfil !== 'membro'
}

// O diretor de setor não vê requerimentos, porque os anexos podem ter dado de saúde.
export function veRequerimentos(perfil: Perfil): boolean {
  return perfil === 'rh' || perfil === 'diretor_rh' || perfil === 'presidente'
}

export function corrigeRegistros(perfil: Perfil): boolean {
  return perfil === 'rh' || perfil === 'diretor_rh'
}

// Quem dirige o setor RH age como diretor do RH, qualquer que seja o perfil do cadastro. Um diretor_rh
// sem a diretoria do RH não tem os poderes dele: age como diretor dos setores que dirige (se dirigir).
export function perfilEfetivo(perfil: Perfil, diretorias: Diretoria[]): Perfil {
  if (diretorias.some((d) => d.ehRH)) return 'diretor_rh'
  return perfil === 'diretor_rh' ? 'diretor_setor' : perfil
}

// "A", "A e B", "A, B e C".
export function juntarSetores(setores: string[]): string {
  return setores.length > 1 ? `${setores.slice(0, -1).join(', ')} e ${setores[setores.length - 1]}` : (setores[0] ?? '')
}

// Cargo para mostrar na tela, a partir do perfil do cadastro e das diretorias.
export function nomeDoCargo(perfil: Perfil, diretorias: Diretoria[]): string {
  const dirigeRH = diretorias.some((d) => d.ehRH)
  const outros = diretorias.filter((d) => !d.ehRH).map((d) => d.setor)
  if (perfil === 'presidente') return dirigeRH ? 'Presidente · diretor do RH' : NOME_PERFIL.presidente
  if (perfil === 'diretor_rh' || perfil === 'diretor_setor') {
    if (diretorias.length === 0) return 'Diretor de setor (sem setor)'
    if (outros.length === 0) return 'Diretor do RH'
    const lista = juntarSetores(outros)
    return `Diretor de ${lista}${dirigeRH ? ' · diretor do RH' : ''}`
  }
  return NOME_PERFIL[perfil]
}
