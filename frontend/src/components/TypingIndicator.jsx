import styles from './TypingIndicator.module.css'

export function TypingIndicator({ isWakingUp }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.name}>🎬 น้องฟิล์ม</span>
      {isWakingUp ? (
        <div className={styles.bubble}>
          น้องฟิล์มกำลังตื่นนอน... รอแป๊บนึงนะคะ 🎬
        </div>
      ) : (
        <div className={styles.bubble}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      )}
    </div>
  )
}
