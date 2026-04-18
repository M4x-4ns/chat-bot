import { renderHook, waitFor } from '@testing-library/react'
import { useTMDB } from './useTMDB'

const mockPosterPath = '/abc123.jpg'

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      movie_results: [{ poster_path: mockPosterPath }]
    })
  })
})

afterEach(() => vi.restoreAllMocks())

test('returns poster URL for valid imdbId', async () => {
  const { result } = renderHook(() => useTMDB('tt0443435'))

  await waitFor(() => expect(result.current.posterUrl).not.toBeNull())

  expect(result.current.posterUrl).toBe(
    `https://image.tmdb.org/t/p/w300${mockPosterPath}`
  )
  expect(result.current.loading).toBe(false)
})

test('returns null when no movie found', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ movie_results: [] })
  })

  const { result } = renderHook(() => useTMDB('tt9999999'))

  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.posterUrl).toBeNull()
})

test('returns null when imdbId is null', async () => {
  const { result } = renderHook(() => useTMDB(null))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.posterUrl).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})
