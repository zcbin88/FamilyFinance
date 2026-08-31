import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Category, CategoryType } from '@/types/database'

export const categoryKeys = {
  all: ['categories'] as const,
  list: (familyId: string) => [...categoryKeys.all, 'list', familyId] as const,
}

/** 家庭分类列表 */
export function useCategories(familyId?: string | null) {
  return useQuery({
    queryKey: categoryKeys.list(familyId ?? 'none'),
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('family_id', familyId!)
        .order('sort_order')
      if (error) throw error
      return data as Category[]
    },
  })
}

export type CategoryInput = {
  name: string
  type: CategoryType
  icon: string
  color: string
}

/** 新增分类 */
export function useCreateCategory(familyId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const maxOrder = await supabase
        .from('categories')
        .select('sort_order')
        .eq('family_id', familyId!)
        .eq('type', input.type)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      const nextOrder = (maxOrder.data?.sort_order ?? 0) + 10

      const { data, error } = await supabase
        .from('categories')
        .insert({ family_id: familyId!, ...input, sort_order: nextOrder })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}

/** 删除分类（有交易引用时会被外键 restrict 拒绝） */
export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}
