import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  IonActionSheet,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
} from '@ionic/react'
import { ellipsisVertical, pencilOutline, trashOutline } from 'ionicons/icons'
import { CategoryIcon } from '@/lib/category-presets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Category, ProfileLite, Transaction } from '@/types/database'

/** 按日期分组：{ '2025-02-03': [tx...] }，按日期倒序 */
export function groupByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const list = groups.get(tx.occurred_at) ?? []
    list.push(tx)
    groups.set(tx.occurred_at, list)
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

interface TransactionListProps {
  transactions: Transaction[]
  categoryMap: Map<string, Category>
  profileMap?: Map<string, ProfileLite>
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

/**
 * 交易列表（按天分组、一天一卡片）。
 * 明细页与搜索页共用，保证两处的行样式、左滑操作、兜底「更多」菜单完全一致。
 * 编辑 / 删除只向上抛事件，弹窗由调用方负责。
 */
export default function TransactionList({
  transactions,
  categoryMap,
  profileMap,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // 「更多」操作表的目标行：给不支持左滑手势的浏览器兜底
  const [actionTarget, setActionTarget] = useState<Transaction | null>(null)
  const groups = groupByDate(transactions)

  return (
    <>
      <div className="space-y-4">
        {groups.map(([date, txs]) => {
          const dayExpense = txs
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0)
          const dayIncome = txs
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0)

          return (
            <div key={date}>
              {/* 日期小标题：卡片外 */}
              <div className="mb-1.5 flex items-center justify-between px-1">
                <p className="m-0 text-sm font-medium text-muted-foreground">
                  {format(new Date(`${date}T00:00:00`), 'M月d日 EEEE', { locale: zhCN })}
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  {dayIncome > 0 && (
                    <span className="text-red-600">收 {formatMoney(dayIncome)} </span>
                  )}
                  {dayExpense > 0 && (
                    <span className="text-green-600">支 {formatMoney(dayExpense)}</span>
                  )}
                </p>
              </div>

              {/* 一天一张卡片 */}
              <div className="overflow-hidden rounded-xl border bg-card">
                {txs.map((tx, idx) => {
                  const cat = categoryMap.get(tx.category_id)
                  const recorder = profileMap?.get(tx.user_id)
                  return (
                    <IonItemSliding key={tx.id}>
                      <IonItem
                        lines={idx === txs.length - 1 ? 'none' : 'full'}
                        detail={false}
                        onClick={() => onEdit(tx)}
                        className="[--background:var(--card)] [--border-color:var(--border)] [--padding-start:0] [--inner-padding-end:0] [--min-height:0]"
                      >
                        <div className="flex w-full items-center gap-3 px-4 py-3">
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${cat?.color ?? '#6b7280'}1f` }}
                          >
                            <CategoryIcon
                              icon={cat?.icon ?? 'ellipsis'}
                              color={cat?.color}
                              className="size-5"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-3">
                              <p className="m-0 min-w-0 flex-1 truncate text-sm font-medium">
                                {cat?.name ?? '未知分类'}
                              </p>
                              <span
                                className={cn(
                                  'shrink-0 text-sm font-semibold tabular-nums',
                                  tx.type === 'expense' ? 'text-green-600' : 'text-red-600',
                                )}
                              >
                                {tx.type === 'expense' ? '-' : '+'}
                                {formatMoney(tx.amount)}
                              </span>
                            </div>
                            <p className="m-0 mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="min-w-0 flex-1 truncate">{tx.note}</span>
                              <span className="shrink-0">
                                {tx.pay_method ?? '现金'} · {recorder?.name ?? '未知'}
                              </span>
                            </p>
                          </div>

                          {/* 「更多」：普通点击，不依赖滑动手势，所有浏览器都能触发 */}
                          <button
                            type="button"
                            aria-label="更多操作"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionTarget(tx)
                            }}
                            className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted"
                          >
                            <IonIcon icon={ellipsisVertical} className="text-lg" />
                          </button>
                        </div>
                      </IonItem>

                      {/* 左滑操作：编辑 / 删除 */}
                      <IonItemOptions side="end">
                        <IonItemOption color="primary" onClick={() => onEdit(tx)}>
                          <IonIcon slot="icon-only" icon={pencilOutline} />
                        </IonItemOption>
                        <IonItemOption color="danger" onClick={() => onDelete(tx)}>
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 行内「更多」操作表：左滑手势在部分手机浏览器（微信/QQ/UC 的 X5 内核、
          从屏幕边缘起手的 iOS 手势等）会被系统或浏览器吞掉，这里给一个纯点击的入口。 */}
      <IonActionSheet
        isOpen={!!actionTarget}
        header={
          actionTarget
            ? `${categoryMap.get(actionTarget.category_id)?.name ?? '未知分类'} · ${formatMoney(actionTarget.amount)} 元`
            : ''
        }
        buttons={[
          {
            text: '编辑',
            icon: pencilOutline,
            handler: () => {
              onEdit(actionTarget!)
              setActionTarget(null)
            },
          },
          {
            text: '删除',
            icon: trashOutline,
            role: 'destructive',
            handler: () => {
              onDelete(actionTarget!)
              setActionTarget(null)
            },
          },
          { text: '取消', role: 'cancel' },
        ]}
        onDidDismiss={() => setActionTarget(null)}
      />
    </>
  )
}
