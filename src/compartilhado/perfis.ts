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

// Quem dirige o setor RH age como diretor do RH, qualquer que seja o perfil do cadastro.
export function perfilEfetivo(perfil: Perfil, diretorias: Diretoria[]): Perfil {
  return diretorias.some((d) => d.ehRH) ? 'diretor_rh' : perfil
}

// Cargo para mostrar na tela, a partir do perfil do cadastro e das diretorias.
export function nomeDoCargo(perfil: Perfil, diretorias: Diretoria[]): string {
  const dirigeRH = diretorias.some((d) => d.ehRH)
  const outros = diretorias.filter((d) => !d.ehRH).map((d) => d.setor)
  if (perfil === 'presidente') return dirigeRH ? 'Presidente · diretor do RH' : NOME_PERFIL.presidente
  if (perfil === 'diretor_rh' || perfil === 'diretor_setor') {
    if (diretorias.length === 0) return 'Diretor de setor (sem setor)'
    if (outros.length === 0) return 'Diretor do RH'
    const lista = outros.length > 1 ? `${outros.slice(0, -1).join(', ')} e ${outros[outros.length - 1]}` : outros[0]
    return `Diretor de ${lista}${dirigeRH ? ' · diretor do RH' : ''}`
  }
  return NOME_PERFIL[perfil]
}
