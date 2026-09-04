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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>修改家庭名称</DialogTitle>
          <DialogDescription>名称会显示在应用顶部的系统名称与浏览器标签页中</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="family-name">家庭名称</Label>
            <Input
              id="family-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：我们的小家"
              maxLength={30}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={updateFamily.isPending || !name.trim() || unchanged}
            >
              {updateFamily.isPending && <Loader2 className="size-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
