import { MOVIES } from '../data/movies'
import styles from './ChatMessage.module.css'

const movieByTitle = Object.fromEntries(
  MOVIES.map(m => [m.title.toLowerCase(), m.imdbId])
)

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

function SourceLine({ title }) {
  const imdbId = movieByTitle[title.toLowerCase()]
  return (
    <div className={styles.source}>
      🎬 อ้างอิงจากรีวิวเรื่อง:{' '}
      {imdbId ? (
        <a
          href={`https://www.imdb.com/title/${imdbId}/`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.imdbLink}
        >
          {title} ↗
        </a>
      ) : (
        <span>{title}</span>
      )}
    </div>
  )
}

function renderContent(content) {
  const sourcePattern = /🎬\s*อ้างอิงจากรีวิวเรื่อง:\s*(.+)/g
  const lines = content.split('\n')
  const result = []
  let textBuffer = []

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^🎬\s*อ้างอิงจากรีวิวเรื่อง:\s*(.+)$/)
    if (match) {
      if (textBuffer.length) {
        result.push(<span key={`t-${i}`}>{renderMarkdown(textBuffer.join('\n'))}</span>)
        textBuffer = []
      }
      result.push(<SourceLine key={`s-${i}`} title={match[1].trim()} />)
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
