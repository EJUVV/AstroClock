import { loginFalso } from './api/auth.ts'

// Partes do piloto que ainda não estão no banco: no login real ficam escondidas, para ninguém ver
// dados de demonstração (decidido pelo Victor em 27/11/2026, para começar o P0 em 30/11). Na
// demonstração (VITE_LOGIN_FALSO=true) continuam aparecendo. Quando a parte ficar real, troque
// por `true` e apague a linha.
export const temSede = true // presença na sede: real desde 27/11/2026 (B13 e G9)
export const temRequerimentos = loginFalso // requerimentos: B8 (banco), G7 (membro) e J7 (RH)
