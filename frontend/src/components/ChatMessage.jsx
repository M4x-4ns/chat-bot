import styles from './ChatMessage.module.css'

function renderMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ))
  })
}

export function ChatMessage({ role, content }) {
  const isBot = role === 'bot'

  return (
    <div className={`${styles.wrapper} ${isBot ? styles.bot : styles.user}`}>
      {isBot && <span className={styles.name}>🎬 น้องฟิล์ม</span>}
      <div className={`${styles.bubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {renderMarkdown(content)}
      </div>
    </div>
  )
}
