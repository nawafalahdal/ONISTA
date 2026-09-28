import SchedulingSettingsForm from '@/components/admin/scheduling-settings-form'
import { getSchedulingSettings, listBlackoutDates } from '@/server/queries/admin'

export default async function SettingsPage() {
  const [settings, blackouts] = await Promise.all([getSchedulingSettings(), listBlackoutDates()])
  return <SchedulingSettingsForm settings={settings} blackouts={blackouts} />
}
