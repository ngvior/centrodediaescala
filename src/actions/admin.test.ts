import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFormData,
  createSupabaseClientMock,
} from '@/test/supabase-test-helpers'

const actionMocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: actionMocks.requireAdmin,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: actionMocks.createAdminClient,
}))

vi.mock('next/cache', () => ({
  revalidatePath: actionMocks.revalidatePath,
}))

import {
  createProfessional,
  deleteProfessional,
  getAdminProfessionals,
  updateProfessional,
} from './admin'

function createProfessionalFormData() {
  return createFormData({
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'Terapeuta',
    bio: 'Bio',
    image_url: '/ada.jpg',
    order_index: 2,
  })
}

describe('admin actions', () => {
  beforeEach(() => {
    actionMocks.createAdminClient.mockReset()
    actionMocks.requireAdmin.mockReset()
    actionMocks.revalidatePath.mockReset()
    actionMocks.requireAdmin.mockResolvedValue({
      id: 'admin-user',
      email: 'admin@example.com',
    })
  })

  it('authenticates and uses the admin Supabase client before reading professionals', async () => {
    const { client } = createSupabaseClientMock([
      {
        table: 'professionals',
        response: { data: [], error: null },
      },
    ])
    actionMocks.createAdminClient.mockReturnValue(client)

    await expect(getAdminProfessionals()).resolves.toEqual([])

    expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1)
    expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1)
    expect(actionMocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(
      actionMocks.createAdminClient.mock.invocationCallOrder[0]
    )
    expect(client.from).toHaveBeenCalledWith('professionals')
  })

  it('does not create a Supabase admin client when admin auth fails', async () => {
    actionMocks.requireAdmin.mockRejectedValueOnce(new Error('No autorizado'))

    await expect(createProfessional(createProfessionalFormData())).rejects.toThrow(
      'No autorizado'
    )

    expect(actionMocks.createAdminClient).not.toHaveBeenCalled()
    expect(actionMocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('creates professionals through the admin client and revalidates affected paths', async () => {
    const { client, queries } = createSupabaseClientMock([
      {
        table: 'professionals',
        response: { data: null, error: null },
      },
    ])
    actionMocks.createAdminClient.mockReturnValue(client)

    await createProfessional(createProfessionalFormData())

    expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1)
    expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1)
    expect(queries[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Ada',
        last_name: 'Lovelace',
        image_url: '/ada.jpg',
      })
    )
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/dashboard')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/profesionales')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/')
  })

  it('updates professionals through the admin client and revalidates affected paths', async () => {
    const { client, queries } = createSupabaseClientMock([
      {
        table: 'professionals',
        response: { data: null, error: null },
      },
    ])
    actionMocks.createAdminClient.mockReturnValue(client)

    await updateProfessional(
      createFormData({
        id: 'professional-id',
        first_name: 'Grace',
        last_name: 'Hopper',
        role: 'Coordinadora',
        bio: null,
        image_url: null,
        order_index: 3,
      })
    )

    expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1)
    expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1)
    expect(queries[0].update).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Grace', is_active: false })
    )
    expect(queries[0].eq).toHaveBeenCalledWith('id', 'professional-id')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/dashboard')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/profesionales')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/')
  })

  it('deletes professionals through the admin client and revalidates affected paths', async () => {
    const { client, queries } = createSupabaseClientMock([
      {
        table: 'professionals',
        response: { data: null, error: null },
      },
    ])
    actionMocks.createAdminClient.mockReturnValue(client)

    await deleteProfessional(createFormData({ id: 'professional-id' }))

    expect(actionMocks.requireAdmin).toHaveBeenCalledTimes(1)
    expect(actionMocks.createAdminClient).toHaveBeenCalledTimes(1)
    expect(queries[0].delete).toHaveBeenCalledTimes(1)
    expect(queries[0].eq).toHaveBeenCalledWith('id', 'professional-id')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/dashboard')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/admin/profesionales')
    expect(actionMocks.revalidatePath).toHaveBeenCalledWith('/')
  })
})
