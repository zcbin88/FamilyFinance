import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑账本' : '新建账本'}</DialogTitle>
          <DialogDescription>
            例如：日常账本、旅行账本、装修账本…
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ledger-name">账本名称</Label>
            <Input
              id="ledger-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="日常账本"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>图标</Label>
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
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <LedgerIcon icon={key} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>颜色</Label>
            <div className="flex flex-wrap gap-2">
              {LEDGER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-7 rounded-full border-2 transition-transform',
                    color === c ? 'scale-110 border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`颜色 ${c}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
