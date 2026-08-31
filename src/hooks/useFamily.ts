import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Family, FamilyMember, Profile } from '@/types/database'

export const familyKeys = {
  all: ['family'] as const,
  current: () => [...familyKeys.all, 'current'] as const,
  members: (familyId: string) => [...familyKeys.all, 'members', familyId] as const,
}

/** 当前用户的家庭（V1 单家庭：取第一条成员关系） */
export function useCurrentFamily() {
  return useQuery({
    queryKey: familyKeys.current(),
    queryFn: async () => {
      const { data: membership, error: mErr } = await supabase
        .from('family_members')
        .select('family_id')
        .limit(1)
        .maybeSingle()
      if (mErr) throw mErr
      if (!membership) return null

      const { data: family, error: fErr } = await supabase
        .from('families')
        .select('*')
        .eq('id', membership.family_id)
        .single()
      if (fErr) throw fErr
      return family as Family
    },
  })
}

export interface MemberWithProfile extends FamilyMember {
  profile: Pick<Profile, 'id' | 'name' | 'avatar_url'> | null
}

/** 家庭成员列表（含资料） */
export function useFamilyMembers(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyKeys.members(familyId ?? 'none'),
    enabled: !!familyId,
    queryFn: async () => {
      const { data: members, error: mErr } = await supabase
        .from('family_members')
        .select('id, user_id, role')
        .eq('family_id', familyId!)
      if (mErr) throw mErr

      const ids = members.map((m) => m.user_id)
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', ids)
      if (pErr) throw pErr

      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      return members.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      })) as MemberWithProfile[]
    },
  })
}

/** 创建家庭（RPC：建家庭 + 房主成员关系 + 服务端 seed 默认账本/分类） */
export function useCreateFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc('create_family', { family_name: name })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: familyKeys.all }),
  })
}

/** 凭邀请码加入家庭 */
export function useJoinFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_family_by_invite', { code })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: familyKeys.all }),
  })
}
