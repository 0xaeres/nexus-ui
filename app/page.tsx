import { redirect } from 'next/navigation'
import { getSetupStatus } from '@/lib/api'
import { ProjectsDashboard } from '@/components/screens/ProjectsDashboard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Block everything until the org-wide skills_repo is set up.
  try {
    const status = await getSetupStatus()
    if (!status.configured) redirect('/setup')
  } catch {
    redirect('/setup')
  }

  return <ProjectsDashboard />
}
