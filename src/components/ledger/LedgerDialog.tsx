import { useState } from 'react'
import { toast } from 'sonner'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useCreateLedger, useUpdateLedger } from '@/hooks/useLedgers'
import {
  LEDGER_COLORS,
  LEDGER_ICON_KEYS,
  LedgerIcon,
} from '@/lib/ledger-presets'
import { cn } from '@/lib/utils'
import type { Ledger } from '@/types/database'

interface LedgerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 传入 ledger 为编辑模式 */
  ledger?: Ledger | null
  familyId?: string | null
  /** 创建成功后回调（用于自动切换到新账本） */
  onCreated?: (id: string) => void
}

export default function LedgerDialog({
  open,
  onOpenChange,
  ledger,
  familyId,
  onCreated,
}: LedgerDialogProps) {
  const isEdit = !!ledger
  const createLedger = useCreateLedger(familyId)
  const updateLedger = useUpdateLedger()

  const [name, setName] = useState(ledger?.name ?? '')
  const [icon, setIcon] = useState(ledger?.icon ?? LEDGER_ICON_KEYS[0])
  const [color, setColor] = useState(ledger?.color ?? LEDGER_COLORS[0])

  // 每次打开时同步初始值
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setName(ledger?.name ?? '')
      setIcon(ledger?.icon ?? LEDGER_ICON_KEYS[0])
      setColor(ledger?.color ?? LEDGER_COLORS[0])
    }
  }

  const submitting = createLedger.isPending || updateLedger.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    try {
      if (isEdit && ledger) {
        await updateLedger.mutateAsync({ id: ledger.id, name: trimmed, icon, color })
        toast.success('账本已更新')
      } else {
        const created = await createLedger.mutateAsync({ name: trimmed, icon, color })
        toast.success('账本创建成功')
        onCreated?.(created.id)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <IonModal isOpen={open} onDidDismiss={() => onOpenChange(false)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isEdit ? '编辑账本' : '新建账本'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onOpenChange(false)}>关闭</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          <IonInput
            className="form-field"
            label="账本名称"
            labelPlacement="stacked"
            value={name}
            onIonInput={(e) => setName(e.detail.value ?? '')}
            placeholder="日常账本"
            maxlength={20}
            autoFocus
          />

          <div className="space-y-2">
            <p className="px-1 text-sm font-medium text-muted-foreground">图标</p>
            <div className="flex flex-wrap gap-2">
              {LEDGER_ICON_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg border transition-colors',
                    icon === key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground active:bg-muted',
                  )}
                >
                  <LedgerIcon icon={key} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="px-1 text-sm font-medium text-muted-foreground">颜色</p>
            <div className="flex flex-wrap gap-2">
              {LEDGER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-8 rounded-full border-2 transition-transform active:scale-95',
                    color === c ? 'scale-110 border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`颜色 ${c}`}
                />
              ))}
            </div>
          </div>

          <IonButton type="submit" expand="block" disabled={submitting || !name.trim()}>
            {submitting ? '保存中…' : isEdit ? '保存' : '创建'}
          </IonButton>
        </form>
      </IonContent>
    </IonModal>
  )
}
