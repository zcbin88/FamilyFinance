import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProfileCard from '@/components/profile/ProfileCard'

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">账号信息</h1>
          <p className="text-sm text-muted-foreground">修改昵称、管理账号</p>
        </div>
      </div>

      <ProfileCard />
    </div>
  )
}
