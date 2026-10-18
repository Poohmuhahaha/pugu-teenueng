// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { customFetch, resetClientRefreshState } from '@/api/client'
import {
  ApiErrorResponseSchema,
  BackrefSchema,
  CONTRACT_TYPE_CHECKS,
  ContentTypeSchema,
  EntryViewSchema,
  MeDtoSchema,
} from '@/api/schemas'
import { useContentTypesQuery } from '@/api/queries'
import { api } from '@/lib/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('api client & SOP §2.3 single-flight 401 refresh queue', () => {
  afterEach(() => {
    resetClientRefreshState()
    vi.unstubAllGlobals()
  })

  it('sends same-origin credentials, never include', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) => json({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await api.contentTypes()
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'same-origin' })
  })

  it('single-flight refreshes once on concurrent 401s and replays both requests', async () => {
    let refreshCalls = 0
    let protectedCalls = 0
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/api/auth/refresh') {
        refreshCalls++
        return new Response(null, { status: 204 })
      }
      protectedCalls++
      return refreshCalls > 0 ? json({ data: [] }) : json({ error: 'Not signed in' }, 401)
    })
    vi.stubGlobal('fetch', fetchMock)

    await Promise.all([api.contentTypes(), api.backrefsAll()])

    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(4) // two initial 401s + two replays
  })

  it('does not try to refresh a failed login', async () => {
    const fetchMock = vi.fn(async (_path: string, _init?: RequestInit) =>
      json(
        {
          error_code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
          error: 'Invalid email or password',
        },
        401,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.login('a@b.c', 'wrong')).rejects.toThrow('Invalid email or password')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/login')
  })

  it('propagates the 401 and redirects to /login?expired=true when the session is really gone', async () => {
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/api/auth/refresh') return json({ error: 'Session expired' }, 401)
      return json({ error: 'Session expired' }, 401)
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.me()).rejects.toThrow('Session expired')
    expect(fetchMock).toHaveBeenCalledTimes(2) // /me, then one refresh attempt
    expect(window.location.href).toContain('/login?expired=true')
  })

  it('customFetch directly queues concurrent 401 callers behind one refresh request', async () => {
    let refreshCount = 0
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/auth/refresh') {
        refreshCount++
        return new Response(null, { status: 204 })
      }
      return refreshCount === 0 ? json({ error: 'Unauthorized' }, 401) : json({ ok: true }, 200)
    })
    vi.stubGlobal('fetch', fetchMock)

    const [r1, r2, r3] = await Promise.all([
      customFetch('/api/v1/a'),
      customFetch('/api/v1/b'),
      customFetch('/api/v1/c'),
    ])
    expect(refreshCount).toBe(1)
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(r3.status).toBe(200)
  })
})

describe('Zod runtime boundary schemas & ts-rs AssertEqual contracts (SOP §6)', () => {
  it('verifies all compile-time AssertEqual<ZodType, TsRsType> gates are true', () => {
    expect(CONTRACT_TYPE_CHECKS.every((v) => v === true)).toBe(true)
  })

  it('parses valid ContentType, EntryView, MeDto, Backref, and ApiErrorResponse payloads and rejects malformed data', () => {
    const validCt = ContentTypeSchema.parse({
      id: 1,
      workspaceId: 2,
      slug: 'tasks',
      name: 'Tasks',
      kind: 'spreadsheet',
      schema: {
        fields: [{ name: 'title', type: 'text', required: true }],
      },
      createdAt: '2026-10-18T00:00:00Z',
      updatedAt: '2026-10-18T00:00:00Z',
    })
    expect(validCt.slug).toBe('tasks')

    const validEntry = EntryViewSchema.parse({
      id: 10,
      title: 'Ship release',
      createdAt: '2026-10-18T00:00:00Z',
      updatedAt: '2026-10-18T00:00:00Z',
    })
    expect(validEntry.title).toBe('Ship release')

    const validMe = MeDtoSchema.parse({
      actor: { id: 1, name: 'Pooh', email: 'pooh@questpage.app', workspaceId: 2 },
      memberships: [{ role: 'owner', workspace: { id: 2, name: 'HQ', slug: 'hq' } }],
    })
    expect(validMe.actor.workspaceId).toBe(2)

    const validBackref = BackrefSchema.parse({
      id: 5,
      workspaceId: 2,
      fromEntryId: 10,
      toEntryId: 11,
      targetName: null,
      offset: 12,
    })
    expect(validBackref.toEntryId).toBe(11)

    const validErr = ApiErrorResponseSchema.parse({
      error_code: 'NOT_FOUND',
      message: 'Entry not found',
      error: 'Entry not found',
    })
    expect(validErr.error_code).toBe('NOT_FOUND')

    expect(() => ContentTypeSchema.parse({ id: 'bad-id' })).toThrow()
  })
})

describe('TanStack Query hooks (SOP §10.1)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fetches and validates content types via useContentTypesQuery', async () => {
    const fetchMock = vi.fn(async () =>
      json({
        data: [
          {
            id: 1,
            workspaceId: 2,
            slug: 'areas',
            name: 'Areas',
            kind: 'document',
            schema: { fields: [] },
            createdAt: '2026-10-18T00:00:00Z',
            updatedAt: '2026-10-18T00:00:00Z',
          },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const Comp = defineComponent({
      setup() {
        const { data, isPending } = useContentTypesQuery()
        return { data, isPending }
      },
      template: '<div>{{ isPending ? "loading" : data?.[0]?.slug }}</div>',
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = mount(Comp, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })

    await flushPromises()
    expect(wrapper.text()).toBe('areas')
  })
})
