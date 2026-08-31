import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon, Pencil, Trash2 } from 'lucide-react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import TransactionForm, { type TransactionFormValues } from '@/components/transaction/TransactionForm'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import {
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '@/hooks/useTransactions'
import { CategoryIcon } from '@/lib/category-presets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

/** 按日期分组：{ '2025-02-03': [tx...] } */
function groupByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const list = groups.get(tx.occurred_at) ?? []
    list.push(tx)
    groups.set(tx.occurred_at, list)
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

export default function TransactionsPage() {
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()

  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const { data: categories } = useCategories(family?.id)
  const { data: result, isLoading } = useTransactions(currentLedger?.id, month)
  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()

  const categoryMap = new Map(categories?.map((c) => [c.id, c]))
  const profileMap = result?.profileMap

  const groups = result ? groupByDate(result.transactions) : []

  // 月份统计
  const monthExpense = result?.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0) ?? 0
  const monthIncome = result?.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0) ?? 0

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(format(d, 'yyyy-MM'))
  }

  async function handleUpdate(values: TransactionFormValues) {
    if (!editing) return
    try {
      await updateTx.mutateAsync({ id: editing.id, ...values })
      toast.success('已更新')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteTx.mutateAsync(deleting.id)
      toast.success('已删除')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* 头部 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">明细</h1>
          <p className="text-sm text-muted-foreground">
            账本：{currentLedger?.name ?? '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
            上月
          </Button>
          <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-24">
                <CalendarIcon className="size-4" />
                {month}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={new Date(`${month}-01T00:00:00`)}
                onSelect={(d) => {
                  if (d) {
                    setMonth(format(d, 'yyyy-MM'))
                    setMonthPickerOpen(false)
                  }
                }}
                locale={zhCN}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
            下月
          </Button>
        </div>
      </div>

      {/* 月份汇总 */}
      {!isLoading && result && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">支出</p>
            <p className="text-lg font-semibold text-destructive">
              -{formatMoney(monthExpense)}
            </p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">收入</p>
            <p className="text-lg font-semibold text-emerald-600">
              +{formatMoney(monthIncome)}
            </p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">结余</p>
            <p className="text-lg font-semibold">
              {formatMoney(monthIncome - monthExpense)}
            </p>
          </div>
        </div>
      )}

      {/* 列表 */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">📒</p>
          <p className="mt-3 text-muted-foreground">
            {month} 还没有账单
          </p>
        </div>
      ) : (
        groups.map(([date, txs]) => {
          const dayExpense = txs
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0)
          const dayIncome = txs
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0)

          return (
            <div key={date}>
              <div className="mb-1 flex items-center justify-between px-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {format(new Date(`${date}T00:00:00`), 'M月d日 EEEE', { locale: zhCN })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayIncome > 0 && <span className="text-emerald-600">收 {formatMoney(dayIncome)} </span>}
                  {dayExpense > 0 && <span className="text-destructive">支 {formatMoney(dayExpense)}</span>}
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border bg-card">
                {txs.map((tx) => {
                  const cat = categoryMap.get(tx.category_id)
                  const recorder = profileMap?.get(tx.user_id)
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${cat?.color ?? '#6b7280'}1f` }}
                      >
                        <CategoryIcon
                          icon={cat?.icon ?? 'ellipsis'}
                          color={cat?.color}
                          className="size-4"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {cat?.name ?? '未知分类'}
                          {tx.note && (
                            <span className="ml-2 font-normal text-muted-foreground">
                              {tx.note}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.pay_method ?? '现金'}
                          <span className="mx-1">·</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1">
                                <Avatar className="size-3.5">
                                  <AvatarFallback className="text-[8px]">
                                    {(recorder?.name ?? '?').slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                                {recorder?.name ?? '未知'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {recorder?.name ?? '未知'}记的账
                            </TooltipContent>
                          </Tooltip>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            tx.type === 'expense' ? 'text-destructive' : 'text-emerald-600',
                          )}
                        >
                          {tx.type === 'expense' ? '-' : '+'}
                          {formatMoney(tx.amount)}
                        </p>
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(tx)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => setDeleting(tx)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* 编辑对话框 */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑账单</DialogTitle>
          </DialogHeader>
          {editing && family && currentLedger && (
            <TransactionForm
              key={editing.id}
              familyId={family.id}
              initial={editing}
              submitting={updateTx.isPending}
              onSubmit={handleUpdate}
              submitLabel="保存修改"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除这笔账单？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${categoryMap.get(deleting.category_id)?.name ?? '未知分类'} · ${formatMoney(deleting.amount)} 元`
                : ''}
              ，删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
