import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import LedgerDialog from '@/components/ledger/LedgerDialog'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import {
  useDeleteLedger,
  useLedgers,
  useSetDefaultLedger,
} from '@/hooks/useLedgers'
import { LedgerIcon } from '@/lib/ledger-presets'
import type { Ledger } from '@/types/database'

export default function LedgerManager() {
  const { data: family } = useCurrentFamily()
  const { data: ledgers, isLoading } = useLedgers(family?.id)
  const { currentLedger, setCurrentLedger } = useLedgerContext()

  const setDefault = useSetDefaultLedger(family?.id)
  const deleteLedger = useDeleteLedger()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Ledger | null>(null)
  const [deleting, setDeleting] = useState<Ledger | null>(null)

  async function handleSetDefault(ledger: Ledger) {
    try {
      await setDefault.mutateAsync(ledger.id)
      toast.success(`已将「${ledger.name}」设为默认`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteLedger.mutateAsync(deleting.id)
      toast.success(`「${deleting.name}」已删除`)
      // 如果删除的是当前账本，切到剩余第一个
      if (currentLedger?.id === deleting.id && ledgers) {
        const next = ledgers.find((l) => l.id !== deleting.id)
        if (next) setCurrentLedger(next.id)
      }
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>账本管理</CardTitle>
          <CardDescription>为不同用途建独立账本，互不干扰</CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          新建
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : ledgers && ledgers.length > 0 ? (
          <ul className="divide-y">
            {ledgers.map((ledger) => (
              <li key={ledger.id} className="flex items-center gap-3 py-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${ledger.color}1a` }}
                >
                  <LedgerIcon icon={ledger.icon} color={ledger.color} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{ledger.name}</span>
                    {ledger.is_default && <Badge variant="secondary">默认</Badge>}
                    {ledger.id === currentLedger?.id && (
                      <span className="text-xs text-muted-foreground">当前</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!ledger.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="设为默认"
                      onClick={() => handleSetDefault(ledger)}
                      disabled={setDefault.isPending}
                    >
                      <Star className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="重命名"
                    onClick={() => setEditing(ledger)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="删除"
                    onClick={() => setDeleting(ledger)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            还没有账本，点击右上角「新建」创建一个
          </p>
        )}
      </CardContent>

      <LedgerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        familyId={family?.id}
        onCreated={(id) => setCurrentLedger(id)}
      />
      <LedgerDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        ledger={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除账本「{deleting?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              账本会被移入回收站，其中的账单记录将不再显示。此操作可以恢复吗？
              目前暂不支持恢复，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLedger.isPending && <Loader2 className="size-4 animate-spin" />}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
