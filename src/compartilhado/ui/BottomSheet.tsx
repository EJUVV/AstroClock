import type { ReactNode } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/compartilhado/ui/shadcn/drawer'

// Painel que sobe de baixo, usado nos formulários do celular.
export function BottomSheet({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  children,
  rodape,
}: {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  titulo: string
  descricao?: string
  children: ReactNode
  rodape?: ReactNode
}) {
  return (
    <Drawer open={aberto} onOpenChange={onAbertoChange}>
      <DrawerContent className="mx-auto max-w-xl">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-bold">{titulo}</DrawerTitle>
          {descricao && <DrawerDescription>{descricao}</DrawerDescription>}
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-2">{children}</div>
        {rodape && <DrawerFooter>{rodape}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  )
}
