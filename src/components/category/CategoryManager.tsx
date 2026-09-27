import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { addOutline } from 'ionicons/icons'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateCategory, useDeleteCategory, useUpdateCategory, useCategories } from '@/hooks/useCategories'
import { useCurrentFamily } from '@/hooks/useFamily'
import { CATEGORY_ICON_GROUPS, CategoryIcon } from '@/lib/category-presets'
import { cn } from '@/lib/utils'
import type { Category, CategoryType } from '@/types/database'

function getVisibleGroups(type: CategoryType) {
  return CATEGORY_ICON_GROUPS.filter((group) => (group.types ?? ['expense']).includes(type))
}

const DEFAULT_ICON = Object.keys(getVisibleGroups('expense')[0].icons)[0]
const COLORS = ['#f97316', '#0ea5e9', '#ec4899', '#8b5cf6', '#eab308', '#14b8a6', '#ef4444', '#22c55e', '#64748b']

function CategoryChips({
  cats,
  onEdit,
  onDelete,
}: {
  cats: Category[]
  onEdit: (cat: Category) => void
  onDelete: (cat: Category) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((cat) => (
        <div key={cat.id} className="flex items-center rounded-full border py-1 pl-2 pr-1">
          <button
            type="button"
            onClick={() => onEdit(cat)}
            className="flex items-center gap-1.5 rounded-full active:bg-muted"
            title="编辑分类"
          >
            <span
              className="flex size-6 items-center justify-center rounded-full"
              style={{ backgroundColor: `${cat.color}1f` }}
            >
              <CategoryIcon icon={cat.icon} color={cat.color} className="size-3.5" />
            </span>
            <span className="text-sm">{cat.name}</span>
          </button>
          {/* 触屏没有 hover，删除按钮常显 */}
          <button
            type="button"
            onClick={() => onDelete(cat)}
            className="rounded-full p-1 text-muted-foreground active:bg-destructive/10 active:text-destructive"
            title="删除分类"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function CategoryManager() {
  const { data: family } = useCurrentFamily()
  const { data: categories, isLoading } = useCategories(family?.id)
  const createCategory = useCreateCategory(family?.id)
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [type, setType] = useState<CategoryType>('expense')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(DEFAULT_ICON)
  const [color, setColor] = useState(COLORS[0])
  const [deleting, setDeleting] = useState<Category | null>(null)

  function handleTypeChange(nextType: CategoryType) {
    setType(nextType)
    const keys = getVisibleGroups(nextType).flatMap((group) => Object.keys(group.icons))
    if (!keys.includes(icon)) setIcon(keys[0])
  }

  function openCreate() {
    setEditing(null)
    setType('expense')
    setName('')
    setIcon(DEFAULT_ICON)
    setColor(COLORS[0])
    setModalOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setType(cat.type)
    setName(cat.name)
    setIcon(cat.icon)
    setColor(cat.color)
    setModalOpen(true)
  }

  const expenseCats = categories?.filter((c) => c.type === 'expense') ?? []
  const incomeCats = categories?.filter((c) => c.type === 'income') ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, name: trimmed, type, icon, color })
        toast.success('分类已更新')
      } else {
        await createCategory.mutateAsync({ name: trimmed, type, icon, color })
        toast.success('分类已添加')
      }
      setName('')
      setModalOpen(false)
    } catch (err) {
      const fallback = editing ? '更新失败' : '添加失败'
      toast.error(err instanceof Error ? err.message : fallback)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteCategory.mutateAsync(deleting.id)
      toast.success('分类已删除')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败（可能已有账单使用该分类）')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>分类管理</CardTitle>
        <CardDescription>自定义收支分类，全家共享</CardDescription>
        <CardAction>
          <IonButton
            size="small"
            className="pill-btn"
            onClick={openCreate}
          >
            <IonIcon slot="start" icon={addOutline} />
            添加
          </IonButton>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">支出分类</p>
              <CategoryChips cats={expenseCats} onEdit={openEdit} onDelete={setDeleting} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">收入分类</p>
              <CategoryChips cats={incomeCats} onEdit={openEdit} onDelete={setDeleting} />
            </div>
          </>
        )}
      </CardContent>

      {/* 新增分类：Ionic 全屏 Modal */}
      <IonModal isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editing ? '编辑分类' : '添加分类'}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setModalOpen(false)}>关闭</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <form onSubmit={handleSubmit} className="space-y-5 p-4">
            <IonSegment
              value={type}
              onIonChange={(e) => handleTypeChange(e.detail.value as CategoryType)}
            >
              <IonSegmentButton value="expense">
                <IonLabel>支出</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="income">
                <IonLabel>收入</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            <IonInput
              className="form-field"
              label="分类名称"
              labelPlacement="stacked"
              value={name}
              onIonInput={(e) => setName(e.detail.value ?? '')}
              placeholder="例如：宠物、房租"
              maxlength={10}
              autoFocus
            />

            <div className="space-y-4">
              <p className="px-1 text-sm font-medium text-muted-foreground">图标</p>
              {getVisibleGroups(type).map((group) => (
                <div key={group.label} className="space-y-1.5">
                  <p className="px-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(group.icons).map((key) => (
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
                        <CategoryIcon icon={key} className="size-4" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="px-1 text-sm font-medium text-muted-foreground">颜色</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
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

            <IonButton
              type="submit"
              expand="block"
              disabled={(editing ? updateCategory.isPending : createCategory.isPending) || !name.trim()}
            >
              {editing
                ? updateCategory.isPending
                  ? '保存中…'
                  : '保存'
                : createCategory.isPending
                  ? '添加中…'
                  : '添加'}
            </IonButton>
          </form>
        </IonContent>
      </IonModal>

      {/* 删除确认：Ionic Alert */}
      <IonAlert
        isOpen={!!deleting}
        header={`删除分类「${deleting?.name ?? ''}」？`}
        message="已有账单使用该分类时无法删除（会提示失败）。"
        buttons={[
          { text: '取消', role: 'cancel' },
          { text: '确认删除', role: 'destructive', handler: handleDelete },
        ]}
        onDidDismiss={() => setDeleting(null)}
      />
    </Card>
  )
}
