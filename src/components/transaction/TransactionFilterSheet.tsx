import type { ReactNode } from 'react'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonLabel,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { CategoryIcon } from '@/lib/category-presets'
import { cn } from '@/lib/utils'
import type { MemberWithProfile } from '@/hooks/useFamily'
import type { TransactionSearchType } from '@/hooks/useTransactions'
import type { Category } from '@/types/database'

interface TransactionFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  type: TransactionSearchType
  onTypeChange: (type: TransactionSearchType) => void
  /** 已按当前类型过滤好的可选分类 */
  categories: Category[]
  categoryIds: string[]
  onToggleCategory: (id: string) => void
  onClearCategories: () => void
  members: MemberWithProfile[]
  memberIds: string[]
  onToggleMember: (id: string) => void
  onClearMembers: () => void
  onReset: () => void
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground active:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

/** 明细页常驻筛选栏对应的底部筛选面板：类型 / 分类 / 成员 + 高级搜索入口 */
export default function TransactionFilterSheet({
  isOpen,
  onClose,
  type,
  onTypeChange,
  categories,
  categoryIds,
  onToggleCategory,
  onClearCategories,
  members,
  memberIds,
  onToggleMember,
  onClearMembers,
  onReset,
}: TransactionFilterSheetProps) {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75]}
      className="filter-sheet"
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onReset}>重置</IonButton>
          </IonButtons>
          <IonTitle>筛选</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>完成</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="space-y-6 px-4 pb-8 pt-2">
          {/* 类型 */}
          <section>
            <p className="mb-2 text-sm font-medium">类型</p>
            <IonSegment
              value={type}
              onIonChange={(e) => onTypeChange(e.detail.value as TransactionSearchType)}
            >
              <IonSegmentButton value="all">
                <IonLabel>全部</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="expense">
                <IonLabel>支出</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="income">
                <IonLabel>收入</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </section>

          {/* 分类 */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">分类</p>
              {categoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCategories}
                  className="text-xs text-muted-foreground"
                >
                  清空
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={categoryIds.length === 0} onClick={onClearCategories}>
                全部分类
              </ToggleChip>
              {categories.map((cat) => {
                const active = categoryIds.includes(cat.id)
                return (
                  <ToggleChip
                    key={cat.id}
                    active={active}
                    onClick={() => onToggleCategory(cat.id)}
                  >
                    <CategoryIcon
                      icon={cat.icon}
                      color={active ? undefined : cat.color}
                      className="size-3.5"
                    />
                    {cat.name}
                  </ToggleChip>
                )
              })}
            </div>
          </section>

          {/* 成员 */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">成员</p>
              {memberIds.length > 0 && (
                <button
                  type="button"
                  onClick={onClearMembers}
                  className="text-xs text-muted-foreground"
                >
                  清空
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={memberIds.length === 0} onClick={onClearMembers}>
                全部成员
              </ToggleChip>
              {members.map((m) => {
                const name = m.profile?.name ?? '未设置昵称'
                const active = memberIds.includes(m.user_id)
                return (
                  <ToggleChip
                    key={m.user_id}
                    active={active}
                    onClick={() => onToggleMember(m.user_id)}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-medium',
                        active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {name.trim().slice(0, 1).toUpperCase() || '?'}
                    </span>
                    {name}
                  </ToggleChip>
                )
              })}
            </div>
          </section>
        </div>
      </IonContent>
    </IonModal>
  )
}
