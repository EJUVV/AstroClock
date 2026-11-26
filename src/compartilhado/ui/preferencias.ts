import { useEffect, useState, useSyncExternalStore } from 'react'
import { minhaFotoDoGoogle } from '@/compartilhado/api/auth'

// Preferências da pessoa guardadas neste aparelho (localStorage). Quando o banco tiver
// um lugar para foto de perfil, a foto escolhida passa a ser enviada para lá.
const EVENTO = 'preferencias-mudou'

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

// Devolve false se o navegador não deixou gravar (aba anônima, espaço cheio): quem chamou avisa a pessoa.
function gravar(chave: string, valor: string | null): boolean {
  let gravou = true
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    gravou = false
  }
  window.dispatchEvent(new Event(EVENTO))
  return gravou
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
// Por padrão, a foto da conta Google (regras-de-negocio.md, seção dos selos). A pessoa pode
// escolher outra nas Configurações; essa fica só neste aparelho.

// A foto que a pessoa escolheu neste aparelho (null = usa a do Google).
export function useFotoEscolhida(email: string): string | null {
  return useSyncExternalStore(assinar, () => ler(`fotoPerfil:${email}`), () => null)
}

// Lida uma vez por carregamento da página: não muda enquanto a pessoa está logada.
let fotoDoGoogle: Promise<string | null> | null = null

export function useFotoDoGoogle(): string | null {
  const [foto, setFoto] = useState<string | null>(null)
  useEffect(() => {
    let ativo = true
    fotoDoGoogle ??= minhaFotoDoGoogle().catch(() => null)
    void fotoDoGoogle.then((f) => ativo && setFoto(f))
    return () => {
      ativo = false
    }
  }, [])
  return foto
}

// A foto que aparece no avatar: a escolhida, senão a do Google, senão null (iniciais).
export function useMinhaFoto(email: string): string | null {
  const escolhida = useFotoEscolhida(email)
  const doGoogle = useFotoDoGoogle()
  return escolhida ?? doGoogle
}

// null volta para a foto do Google. Devolve false se não deu para gravar neste aparelho.
export function salvarFoto(email: string, foto: string | null): boolean {
  return gravar(`fotoPerfil:${email}`, foto)
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
