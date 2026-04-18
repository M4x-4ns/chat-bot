import { useTMDB } from '../hooks/useTMDB'
import styles from './PosterStrip.module.css'

function StripPoster({ movie }) {
  const { posterUrl } = useTMDB(movie.imdbId)
  return (
    <div className={styles.poster}>
      {posterUrl
        ? <img src={posterUrl} alt={movie.title} />
        : <div className={styles.placeholder} />
      }
    </div>
  )
}

export function PosterStrip({ movies }) {
  const visible = movies.slice(0, 10)
  return (
    <div className={styles.strip}>
      {visible.map(movie => (
        <StripPoster key={movie.imdbId} movie={movie} />
      ))}
    </div>
  )
}
