import { useState, useEffect } from 'react'
import { useTMDB } from '../hooks/useTMDB'
import styles from './PosterCarousel.module.css'

function Poster({ movie, isCenter }) {
  const { posterUrl } = useTMDB(movie.imdbId)

  return (
    <div className={`${styles.poster} ${isCenter ? styles.center : styles.side}`}>
      {posterUrl ? (
        <img src={posterUrl} alt={movie.title} />
      ) : (
        <div className={styles.placeholder}>
          <span>{movie.title}</span>
        </div>
      )}
    </div>
  )
}

export function PosterCarousel({ movies }) {
  const [centerIndex, setCenterIndex] = useState(
    Math.min(2, Math.floor(movies.length / 2))
  )

  useEffect(() => {
    if (!movies.length) return
    const timer = setInterval(() => {
      setCenterIndex(i => (i + 1) % movies.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [movies.length])

  if (!movies.length) return null

  const visible = [-2, -1, 0, 1, 2]
    .map(offset => {
      const idx = (centerIndex + offset + movies.length) % movies.length
      return { movie: movies[idx], offset }
    })

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.arrow}
        onClick={() => setCenterIndex(i => (i - 1 + movies.length) % movies.length)}
        aria-label="ก่อนหน้า"
      >
        ←
      </button>

      <div className={styles.track}>
        {visible.map(({ movie, offset }) => (
          <Poster key={`${movie.imdbId}-${offset}`} movie={movie} isCenter={offset === 0} />
        ))}
      </div>

      <button
        className={styles.arrow}
        onClick={() => setCenterIndex(i => (i + 1) % movies.length)}
        aria-label="ถัดไป"
      >
        →
      </button>
    </div>
  )
}
