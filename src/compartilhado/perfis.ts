import type { Perfil } from './tipos.ts'

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
