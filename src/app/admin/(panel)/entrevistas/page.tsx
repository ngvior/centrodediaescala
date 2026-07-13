import { getAdminInterviewRequests } from '@/actions/admin'
import {
  InterviewsAdmin,
  type InterviewCardData,
} from '@/components/admin/interviews-admin'

import { formatInterviewDateLabel, normalizeStatusFilter } from './page-helpers'

type InterviewsPageProps = {
  searchParams?: Promise<{ status?: string | string[] }>
}

export default async function EntrevistasPage({ searchParams }: InterviewsPageProps) {
  const params = searchParams ? await searchParams : {}
  const initialStatus = normalizeStatusFilter(params.status)
  // Filtering is instant client-side state, so fetch every request and let the
  // island slice them; chip counts always reflect the full data set.
  const requests = await getAdminInterviewRequests()

  const now = new Date()
  const cards: InterviewCardData[] = requests.map((request) => ({
    ...request,
    dateLabel: formatInterviewDateLabel(request.created_at, now),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-wide text-foreground">Entrevistas</h1>
        <p className="text-muted-foreground">
          Revisá solicitudes, actualizá el estado y dejá notas internas sin modificar los datos originales.
        </p>
      </div>

      <InterviewsAdmin requests={cards} initialStatus={initialStatus ?? null} />
    </div>
  )
}
