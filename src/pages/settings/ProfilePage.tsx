import ProfileCard from '@/components/profile/ProfileCard'

/** 标题与返回按钮由 AppLayout 顶部栏提供 */
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <ProfileCard />
    </div>
  )
}
