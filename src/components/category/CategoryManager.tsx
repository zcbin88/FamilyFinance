import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateCategory, useDeleteCategory, useCategories } from '@/hooks/useCategories'
import { useCurrentFamily } from '@/hooks/useFamily'
import { CATEGORY_ICONS, CategoryIcon } from '@/lib/category-presets'
import { cn } from '@/lib/utils'
import type { Category, CategoryType } from '@/types/database'

const ICON_KEYS = Object.keys(CATEGORY_ICONS)
const COLORS = ['#f97316', '#0ea5e9', '#ec4899', '#8b5cf6', '#eab308', '#14b8a6', '#ef4444', '#22c55e', '#64748b']

function CategoryChips({
  cats,
  onDelete,
}: {
  cats: Category[]
  onDelete: (cat: Category) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((cat) => (
        <div key={cat.id} className="group flex items-center gap-1.5 rounded-full border py-1 pl-2 pr-1">
          <span
            className="flex size-6 items-center justify-center rounded-full"
            style={{ backgroundColor: `${cat.color}1f` }}
          >
            <CategoryIcon icon={cat.icon} color={cat.color} className="size-3.5" />
          </span>
          <span className="text-sm">{cat.name}</span>
          <button
            onClick={() => onDelete(cat)}
            className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
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
  const deleteCategory = useDeleteCategory()

  const [createOpen, setCreateOpen] = useState(false)
  const [type, setType] = useState<CategoryType>('expense')
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICON_KEYS[0])
  const [color, setColor] = useState(COLORS[0])
  const [deleting, setDeleting] = useState<Category | null>(null)

  const expenseCats = categories?.filter((c) => c.type === 'expense') ?? []
  const incomeCats = categories?.filter((c) => c.type === 'income') ?? []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createCategory.mutateAsync({ name: trimmed, type, icon, color })
      toast.success('分类已添加')
      setName('')
      setCreateOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败')
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
          <Button
            className="h-8 rounded-full border-primary/20 bg-primary/10 px-3.5 text-primary shadow-none transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            添加
          </Button>
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
              <CategoryChips cats={expenseCats} onDelete={setDeleting} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">收入分类</p>
              <CategoryChips cats={incomeCats} onDelete={setDeleting} />
            </div>
          </>
        )}
      </CardContent>

      {/* 新增分类对话框 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>添加分类</DialogTitle>
            <DialogDescription>新分类立即对全家所有账本生效</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-lg py-2 text-sm font-medium',
                    type === t ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  {t === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-name">分类名称</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：宠物、房租"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label>图标</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_KEYS.map((key) => (
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
                    <CategoryIcon icon={key} className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>颜色</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
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
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createCategory.isPending || !name.trim()}>
                {createCategory.isPending && <Loader2 className="size-4 animate-spin" />}
                添加
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除分类「{deleting?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              已有账单使用该分类时无法删除（会提示失败）。
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
    </Card>
  )
}
