import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export const profileKeys = {
  current: () => ['profile', 'current'] as const,
}

/** 当前用户资料 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: profileKeys.current(),
    enabled,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data as Profile
    },
  })
}

/** 更新当前用户资料（仅本人可改，RLS 保证） */
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: { name?: string; avatar_url?: string | null }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.current() }),
  })
}
