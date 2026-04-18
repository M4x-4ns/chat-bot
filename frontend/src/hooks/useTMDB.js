import { useState, useEffect } from 'react'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300'
const TMDB_API_BASE = 'https://api.themoviedb.org/3'

export function useTMDB(imdbId) {
  const [posterUrl, setPosterUrl] = useState(null)
  const [loading, setLoading] = useState(!!imdbId)

  useEffect(() => {
    if (!imdbId) {
      setLoading(false)
      return
    }

    const key = import.meta.env.VITE_TMDB_API_KEY
    setLoading(true)

    fetch(`${TMDB_API_BASE}/find/${imdbId}?external_source=imdb_id`, {
      headers: { Authorization: `Bearer ${key}` }
    })
      .then(r => r.json())
      .then(data => {
        const path = data.movie_results?.[0]?.poster_path
        setPosterUrl(path ? `${TMDB_IMAGE_BASE}${path}` : null)
      })
      .catch(() => setPosterUrl(null))
      .finally(() => setLoading(false))
  }, [imdbId])

  return { posterUrl, loading }
}
