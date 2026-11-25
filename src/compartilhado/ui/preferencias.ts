import { useSyncExternalStore } from 'react'

// Preferências da pessoa guardadas neste aparelho (localStorage). Quando o banco tiver
// um lugar para foto de perfil, a foto passa a ser enviada para lá.
const EVENTO = 'preferencias-mudou'

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    // Sem localStorage (aba anônima cheia, por exemplo): vale só até recarregar.
  }
  window.dispatchEvent(new Event(EVENTO))
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso)
  window.addEventListener('storage', aviso)
  return () => {
    window.removeEventListener(EVENTO, aviso)
    window.removeEventListener('storage', aviso)
  }
}

// ---- Foto de perfil ----
export function useMinhaFoto(email: string): string | null {
  return useSyncExternalStore(assinar, () => ler(`fotoPerfil:${email}`), () => null)
}

export function salvarFoto(email: string, foto: string | null) {
  gravar(`fotoPerfil:${email}`, foto)
}

// Corta a imagem em quadrado e reduz para 256 px: a foto do celular tem vários MB e não cabe no localStorage.
export function reduzirImagem(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const lado = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 256
      const ctx = canvas.getContext('2d')
      if (!ctx) return rejeitar(new Error('Não foi possível processar a imagem.'))
      ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256)
      resolver(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      rejeitar(new Error('Esse arquivo não parece ser uma imagem válida.'))
    }
    img.src = url
  })
}

// ---- Fundo animado de estrelas ----
export function useFundoAnimado(): boolean {
  return useSyncExternalStore(assinar, () => ler('fundoAnimado') !== 'desligado', () => true)
}

export function definirFundoAnimado(ligado: boolean) {
  gravar('fundoAnimado', ligado ? null : 'desligado')
}
