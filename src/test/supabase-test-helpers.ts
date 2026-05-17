import { vi, type Mock } from 'vitest'

export type SupabaseTestError = {
  message: string
}

export type SupabaseTestResponse<T = unknown> = {
  data?: T | null
  error?: SupabaseTestError | null
  count?: number | null
}

type QueryMethod<T> = Mock<(...args: unknown[]) => QueryMock<T>>

export type QueryMock<T = unknown> = PromiseLike<SupabaseTestResponse<T>> & {
  table: string
  select: QueryMethod<T>
  eq: QueryMethod<T>
  order: QueryMethod<T>
  limit: QueryMethod<T>
  insert: QueryMethod<T>
  update: QueryMethod<T>
  delete: QueryMethod<T>
}

export type QueryDefinition<T = unknown> = {
  table: string
  response: SupabaseTestResponse<T>
}

export function createSupabaseQueryMock<T = unknown>(
  table: string,
  response: SupabaseTestResponse<T>
): QueryMock<T> {
  const query = {
    table,
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    then<TResult1 = SupabaseTestResponse<T>, TResult2 = never>(
      onfulfilled?:
        | ((value: SupabaseTestResponse<T>) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(response).then(onfulfilled, onrejected)
    },
  } as QueryMock<T>

  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  query.insert.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.delete.mockReturnValue(query)

  return query
}

export function createSupabaseClientMock(definitions: QueryDefinition[]) {
  const queries = definitions.map(({ table, response }) =>
    createSupabaseQueryMock(table, response)
  )
  let nextQueryIndex = 0

  const client = {
    from: vi.fn((table: string) => {
      const query = queries[nextQueryIndex]

      if (!query) {
        throw new Error(`Unexpected Supabase table read: ${table}`)
      }

      if (query.table !== table) {
        throw new Error(
          `Expected Supabase table ${query.table}, received ${table}`
        )
      }

      nextQueryIndex += 1
      return query
    }),
  }

  return { client, queries }
}

export function createFormData(values: Record<string, string | number | null>) {
  const formData = new FormData()

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null) {
      formData.set(key, String(value))
    }
  })

  return formData
}

export function createRequiredSiteSettingsRows() {
  return [
    'contact_phone',
    'contact_address',
    'contact_schedule',
    'social_facebook',
    'home_hero_title',
    'home_hero_subtitle',
    'home_hero_text',
    'about_title',
    'about_facilities_title',
    'about_facilities_text',
    'about_requirements_title',
    'about_requirements_text',
    'contact_title',
    'contact_text',
  ].map((settingKey) => ({
    setting_key: settingKey,
    setting_value: `db-${settingKey}`,
  }))
}
