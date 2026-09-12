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
import { useUpdateFamily } from '@/hooks/useFamily'
import type { Family } from '@/types/database'

interface RenameFamilyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  family: Family | null
}

/** 修改家庭名称（仅房主可见入口，RLS 兜底） */
export default function RenameFamilyDialog({
  open,
  onOpenChange,
  family,
}: RenameFamilyDialogProps) {
  const updateFamily = useUpdateFamily()

  const [name, setName] = useState(family?.name ?? '')

  // 每次打开时同步最新名称（render 期间调整状态模式，与 LedgerDialog 一致）
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setName(family?.name ?? '')
  }

  const unchanged = name.trim() === (family?.name ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!family) return
    const trimmed = name.trim()
    if (!trimmed || unchanged) return
    try {
      await updateFamily.mutateAsync({ id: family.id, name: trimmed })
      toast.success('家庭名称已更新')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  return (
    <IonModal isOpen={open} onDidDismiss={() => onOpenChange(false)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>修改家庭名称</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onOpenChange(false)}>关闭</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          <IonInput
            className="form-field"
            label="家庭名称"
            labelPlacement="stacked"
            value={name}
            onIonInput={(e) => setName(e.detail.value ?? '')}
            placeholder="例如：我们的小家"
            maxlength={30}
            autoFocus
          />

          <IonButton
            type="submit"
            expand="block"
            disabled={updateFamily.isPending || !name.trim() || unchanged}
          >
            {updateFamily.isPending ? '保存中…' : '保存'}
          </IonButton>
        </form>
      </IonContent>
    </IonModal>
  )
}
