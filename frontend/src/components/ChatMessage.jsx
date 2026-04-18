import { MOVIES } from '../data/movies'
import styles from './ChatMessage.module.css'

const movieByTitle = Object.fromEntries(
  MOVIES.map(m => [m.title.toLowerCase(), m.imdbId])
)

function lookupImdbId(title) {
  const key = title.toLowerCase().trim()
  if (movieByTitle[key]) return movieByTitle[key]
  // Partial match: "Pee Mak" matches "Pee Mak Phra Khanong" and vice versa
  const match = MOVIES.find(m => {
    const t = m.title.toLowerCase()
    return t.includes(key) || key.includes(t)
  })
  return match?.imdbId
}

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


function renderContent(content) {
  // Match both plain and bold-wrapped citation: **🎬 อ้างอิงจากรีวิวเรื่อง:** or 🎬 อ้างอิงจากรีวิวเรื่อง:
  const CITATION_RE = /^\*{0,2}🎬\s*อ้างอิงจากรีวิวเรื่อง:\*{0,2}\s*(.+)$/
  const lines = content.split('\n')
  const result = []
  let textBuffer = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(CITATION_RE)
    if (match) {
      if (textBuffer.length) {
        result.push(<span key={`t-${i}`}>{renderMarkdown(textBuffer.join('\n'))}</span>)
        textBuffer = []
      }
      // Handle multiple comma-separated titles
      const titles = match[1].split(',').map(t => t.trim()).filter(Boolean)
      result.push(
        <div key={`s-${i}`} className={styles.source}>
          🎬 อ้างอิงจากรีวิวเรื่อง:{' '}
          {titles.map((title, j) => {
            const imdbId = lookupImdbId(title)
            return (
              <span key={title}>
                {j > 0 && ', '}
                {imdbId ? (
                  <a href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noopener noreferrer" className={styles.imdbLink}>
                    {title} ↗
                  </a>
                ) : (
                  <span>{title}</span>
                )}
              </span>
            )
          })}
        </div>
      )
    } else {
      textBuffer.push(lines[i])
    }
  }
  if (textBuffer.length) {
    result.push(<span key="t-end">{renderMarkdown(textBuffer.join('\n'))}</span>)
  }
  return result
}

export function ChatMessage({ role, content }) {
  const isBot = role === 'bot'

  return (
    <div className={`${styles.wrapper} ${isBot ? styles.bot : styles.user}`}>
      {isBot && <span className={styles.name}>🎬 น้องฟิล์ม</span>}
      <div className={`${styles.bubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {isBot ? renderContent(content) : renderMarkdown(content)}
      </div>
    </div>
  )
}
