import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TransactionForm, { type TransactionFormValues } from '@/components/transaction/TransactionForm'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCreateTransaction } from '@/hooks/useTransactions'

/** 记账页：全屏专注模式（不套 AppLayout，无顶部账本切换/底部导航干扰） */
export default function TransactionFormPage() {
  const navigate = useNavigate()
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()
  const createTx = useCreateTransaction(family?.id, currentLedger?.id)

  function goBack() {
    // 有历史则返回来源页，否则回明细
    if (window.history.length > 1) navigate(-1)
    else navigate('/transactions', { replace: true })
  }

  async function handleSubmit(values: TransactionFormValues) {
    try {
      await createTx.mutateAsync(values)
      toast.success('记账成功')
      navigate('/transactions', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '记账失败')
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* 顶部栏：返回 + 当前账本 */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="返回">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-tight">记一笔</h1>
            <p className="truncate text-xs text-muted-foreground">
              {currentLedger?.name ?? '账本加载中…'}
            </p>
          </div>
        </div>
      </header>

      {/* 表单主体：全屏可用空间 */}
      <main className="mx-auto w-full max-w-lg px-4 py-6">
        {family && currentLedger ? (
          <TransactionForm
            familyId={family.id}
            submitting={createTx.isPending}
            onSubmit={handleSubmit}
            submitLabel="保存这笔账"
          />
        ) : (
          <p className="py-10 text-center text-muted-foreground">账本加载中…</p>
        )}
      </main>
    </div>
  )
}
