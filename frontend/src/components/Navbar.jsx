import { YEAR_RANGES } from '../data/movies'
import styles from './Navbar.module.css'

export function Navbar({ activeRange, onRangeChange, onBack }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logoArea}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack} aria-label="กลับหน้าหลัก">
            ←
          </button>
        )}
        <div className={styles.logo}>🎬 น้องฟิล์ม</div>
      </div>
      <div className={styles.tabs}>
        {YEAR_RANGES.map(range => (
          <button
            key={range.label}
            className={`${styles.tab} ${activeRange.label === range.label ? styles.active : ''}`}
            onClick={() => onRangeChange(range)}
          >
            {range.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
