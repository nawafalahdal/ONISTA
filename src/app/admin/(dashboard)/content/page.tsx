import ContentForm from '@/components/admin/content-form'
import { getSiteContent } from '@/server/queries/catalog'

export default async function ContentPage() {
  const content = await getSiteContent()
  return <ContentForm content={content} />
}
