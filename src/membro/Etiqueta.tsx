// Classes de botão compartilhadas (tema roxo/espacial).
const foco = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c084fc]'
export const botaoBase = `min-h-12 rounded-xl border px-4 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${foco}`
export const botao = `${botaoBase} border-white/25 text-white hover:bg-white/10`
export const botaoMarcado = `${botaoBase} border-[#f3e8ff] bg-[#f3e8ff] text-[#1a1033]`
export const botaoVerde = `${botaoBase} border-emerald-300 bg-emerald-400/15 text-white`
export const botaoPrincipal = `${botaoBase} border-[#6d28d9] bg-[#6d28d9] text-white hover:bg-[#7c3aed]`
export const campo = `min-h-12 rounded-xl border border-white/25 bg-black/25 px-3 text-white placeholder:text-white/60 ${foco}`
