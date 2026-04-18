# Movie Chatbot Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React frontend (IMDb Gold theme) that connects to the HuggingFace Space chatbot, with movie poster carousel and animated chat interface, deployed to GitHub Pages.

**Architecture:** Single-page Vite React app with two states — landing (poster carousel + center input) and chat active (poster strip + chat history + input). Frontend calls `chat-ai-movies-imdb/imdb_chatbot` via `@gradio/client` and fetches poster images from TMDB API using `imdb_id` values in `metadata.json`.

**Tech Stack:** React 18, Vite, `@gradio/client`, CSS Modules, Vitest + `@testing-library/react`, `gh-pages`

---

## File Map

```
chat-bot/
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx + Navbar.module.css
    │   │   ├── PosterCarousel.jsx + PosterCarousel.module.css
    │   │   ├── PosterStrip.jsx + PosterStrip.module.css
    │   │   ├── ChatArea.jsx + ChatArea.module.css
    │   │   ├── ChatMessage.jsx + ChatMessage.module.css
    │   │   ├── TypingIndicator.jsx + TypingIndicator.module.css
    │   │   └── ChatInput.jsx + ChatInput.module.css
    │   ├── hooks/
    │   │   ├── useChat.js
    │   │   └── useTMDB.js
    │   ├── data/
    │   │   └── movies.js
    │   ├── styles/
    │   │   └── variables.css
    │   ├── App.jsx + App.module.css
    │   └── main.jsx
    ├── scripts/
    │   └── extract-movies.js   ← run once to generate movies.js
    ├── .env                    ← VITE_TMDB_API_KEY=...
    ├── vite.config.js
    ├── vitest.config.js
    └── package.json
```

---

## Task 1: Scaffold Vite React Project

**Files:**
- Create: `frontend/` directory
- Create: `frontend/package.json`, `frontend/vite.config.js`, `frontend/vitest.config.js`

- [ ] **Step 1: Create Vite project**

```bash
cd D:/chat-bot
npm create vite@latest frontend -- --template react
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @gradio/client
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom gh-pages
```

- [ ] **Step 3: Write vite.config.js**

```js
// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/chat-bot/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    globals: true,
  },
})
```

- [ ] **Step 4: Write test setup file**

```js
// frontend/src/test-setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add deploy script to package.json**

Open `frontend/package.json` and replace the `scripts` section with:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

- [ ] **Step 6: Create .env file**

```
# frontend/.env
VITE_TMDB_API_KEY=paste_your_tmdb_key_here
```

> Get free TMDB API key at: https://www.themoviedb.org/settings/api (sign up → request API key → copy "API Read Access Token")

- [ ] **Step 7: Delete boilerplate**

```bash
rm src/App.css src/assets/react.svg
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: server at `http://localhost:5173` (or similar port), no errors

- [ ] **Step 9: Commit**

```bash
cd D:/chat-bot
git add frontend/
git commit -m "feat: scaffold vite react project"
```

---

## Task 2: CSS Design System

**Files:**
- Create: `frontend/src/styles/variables.css`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Write variables.css**

```css
/* frontend/src/styles/variables.css */
:root {
  --color-bg: #070707;
  --color-surface: #111111;
  --color-border: #2a2500;
  --color-gold: #f5c518;
  --color-gold-dim: #c9a000;
  --color-gold-subtle: #1a1500;
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-bot-bubble: #1a1500;
  --color-bot-text: #e0d080;
  --color-user-bubble: #f5c518;
  --color-user-text: #000000;

  --radius-sm: 8px;
  --radius-pill: 20px;
  --radius-circle: 50%;

  --font-base: system-ui, -apple-system, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-base);
  min-height: 100vh;
  overflow-x: hidden;
}
```

- [ ] **Step 2: Update main.jsx to import variables**

```jsx
// frontend/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/variables.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/ frontend/src/main.jsx
git commit -m "feat: add CSS design system variables"
```

---

## Task 3: Extract Movies Data

**Files:**
- Create: `frontend/scripts/extract-movies.js`
- Create: `frontend/src/data/movies.js`

- [ ] **Step 1: Write extraction script**

```js
// frontend/scripts/extract-movies.js
const fs = require('fs')
const path = require('path')

const metadataPath = path.join(__dirname, '../../metadata.json')
const outputPath = path.join(__dirname, '../src/data/movies.js')

const chunks = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))

// Deduplicate by title, keep one entry per movie
const seen = new Set()
const movies = []

for (const chunk of chunks) {
  const title = chunk.filename
  if (!seen.has(title)) {
    seen.add(title)
    movies.push({
      title: chunk.filename,
      imdbId: chunk.metadata?.imdb_id || null,
      year: parseInt(chunk.metadata?.release_year) || null,
      rating: parseFloat(chunk.metadata?.imdb_rating) || null,
    })
  }
}

// Sort by rating desc, keep top 80
const sorted = movies
  .filter(m => m.imdbId && m.year)
  .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  .slice(0, 80)

const output = `// Auto-generated from metadata.json — do not edit manually
export const MOVIES = ${JSON.stringify(sorted, null, 2)}

export const YEAR_RANGES = [
  { label: 'ทั้งหมด', min: 0, max: 9999 },
  { label: '2020s', min: 2020, max: 9999 },
  { label: '2010s', min: 2010, max: 2019 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: 'ก่อน 2000', min: 0, max: 1999 },
]

export function filterByYear(movies, range) {
  if (range.min === 0 && range.max === 9999) return movies
  return movies.filter(m => m.year >= range.min && m.year <= range.max)
}
`

fs.writeFileSync(outputPath, output)
console.log(`✅ Extracted ${sorted.length} movies to src/data/movies.js`)
```

- [ ] **Step 2: Run the script**

```bash
cd frontend
node scripts/extract-movies.js
```

Expected output: `✅ Extracted XX movies to src/data/movies.js`

- [ ] **Step 3: Write tests for filterByYear**

```js
// frontend/src/data/movies.test.js
import { filterByYear, MOVIES, YEAR_RANGES } from './movies'

const sample = [
  { title: 'A', imdbId: 'tt1', year: 2022, rating: 7 },
  { title: 'B', imdbId: 'tt2', year: 2015, rating: 8 },
  { title: 'C', imdbId: 'tt3', year: 2005, rating: 6 },
  { title: 'D', imdbId: 'tt4', year: 1998, rating: 7 },
]

test('ทั้งหมด returns all movies', () => {
  expect(filterByYear(sample, YEAR_RANGES[0])).toHaveLength(4)
})

test('2020s returns only 2020+', () => {
  const result = filterByYear(sample, YEAR_RANGES[1])
  expect(result).toHaveLength(1)
  expect(result[0].title).toBe('A')
})

test('2010s returns 2010-2019', () => {
  const result = filterByYear(sample, YEAR_RANGES[2])
  expect(result).toHaveLength(1)
  expect(result[0].title).toBe('B')
})

test('MOVIES array is non-empty', () => {
  expect(MOVIES.length).toBeGreaterThan(0)
})
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/ frontend/src/data/
git commit -m "feat: extract movies data from metadata.json"
```

---

## Task 4: useTMDB Hook

**Files:**
- Create: `frontend/src/hooks/useTMDB.js`
- Create: `frontend/src/hooks/useTMDB.test.js`

- [ ] **Step 1: Write failing test**

```js
// frontend/src/hooks/useTMDB.test.js
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- useTMDB
```

Expected: FAIL — `useTMDB` not defined

- [ ] **Step 3: Implement useTMDB**

```js
// frontend/src/hooks/useTMDB.js
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
```

- [ ] **Step 4: Run tests**

```bash
npm test -- useTMDB
```

Expected: all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useTMDB.js frontend/src/hooks/useTMDB.test.js
git commit -m "feat: add useTMDB hook for poster fetching"
```

---

## Task 5: useChat Hook

**Files:**
- Create: `frontend/src/hooks/useChat.js`
- Create: `frontend/src/hooks/useChat.test.js`

- [ ] **Step 1: Write failing test**

```js
// frontend/src/hooks/useChat.test.js
import { renderHook, act } from '@testing-library/react'
import { useChat } from './useChat'

vi.mock('@gradio/client', () => ({
  Client: {
    connect: vi.fn().mockResolvedValue({
      predict: vi.fn().mockResolvedValue({ data: ['น้องฟิล์ม ตอบว่า: สวัสดี'] })
    })
  }
}))

test('sendMessage adds user message immediately', async () => {
  const { result } = renderHook(() => useChat())

  await act(async () => {
    await result.current.sendMessage('สวัสดี')
  })

  expect(result.current.messages[0]).toEqual({ role: 'user', content: 'สวัสดี' })
})

test('sendMessage adds bot response after API call', async () => {
  const { result } = renderHook(() => useChat())

  await act(async () => {
    await result.current.sendMessage('สวัสดี')
  })

  expect(result.current.messages[1]).toEqual({
    role: 'bot',
    content: 'น้องฟิล์ม ตอบว่า: สวัสดี'
  })
})

test('isLoading is false after response', async () => {
  const { result } = renderHook(() => useChat())

  await act(async () => {
    await result.current.sendMessage('สวัสดี')
  })

  expect(result.current.isLoading).toBe(false)
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- useChat
```

Expected: FAIL — `useChat` not defined

- [ ] **Step 3: Implement useChat**

```js
// frontend/src/hooks/useChat.js
import { useState, useRef } from 'react'
import { Client } from '@gradio/client'

const HF_SPACE = 'chat-ai-movies-imdb/imdb_chatbot'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isWakingUp, setIsWakingUp] = useState(false)
  const clientRef = useRef(null)
  const connectingRef = useRef(false)

  // Pre-connect on first render so Space wakes up before user sends
  if (!clientRef.current && !connectingRef.current) {
    connectingRef.current = true
    Client.connect(HF_SPACE)
      .then(c => { clientRef.current = c })
      .catch(() => { connectingRef.current = false })
  }

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setIsLoading(true)

    try {
      if (!clientRef.current) {
        setIsWakingUp(true)
        clientRef.current = await Client.connect(HF_SPACE)
        setIsWakingUp(false)
      }

      const result = await clientRef.current.predict('/generate_rag_response', {
        message: text,
      })

      setMessages(prev => [...prev, { role: 'bot', content: result.data[0] }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '❌ ขออภัยค่ะ ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะคะ'
      }])
    } finally {
      setIsLoading(false)
      setIsWakingUp(false)
    }
  }

  return { messages, sendMessage, isLoading, isWakingUp }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- useChat
```

Expected: all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useChat.js frontend/src/hooks/useChat.test.js
git commit -m "feat: add useChat hook connecting to HF Spaces"
```

---

## Task 6: ChatInput Component

**Files:**
- Create: `frontend/src/components/ChatInput.jsx`
- Create: `frontend/src/components/ChatInput.module.css`

- [ ] **Step 1: Write ChatInput.jsx**

```jsx
// frontend/src/components/ChatInput.jsx
import { useState } from 'react'
import styles from './ChatInput.module.css'

export function ChatInput({ onSend, disabled, placeholder = 'พิมพ์ถามน้องฟิล์มได้เลย...' }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        className={styles.btn}
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="ส่ง"
      >
        ▶
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Write ChatInput.module.css**

```css
/* frontend/src/components/ChatInput.module.css */
.form {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
}

.input {
  flex: 1;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 10px 16px;
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--font-base);
  outline: none;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: var(--color-gold);
}

.input::placeholder {
  color: var(--color-text-muted);
}

.btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: var(--color-gold);
  color: #000;
  border: none;
  border-radius: var(--radius-circle);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn:hover:not(:disabled) {
  background: var(--color-gold-dim);
}

.btn:active:not(:disabled) {
  transform: scale(0.95);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ChatInput.jsx frontend/src/components/ChatInput.module.css
git commit -m "feat: add ChatInput component"
```

---

## Task 7: TypingIndicator Component

**Files:**
- Create: `frontend/src/components/TypingIndicator.jsx`
- Create: `frontend/src/components/TypingIndicator.module.css`

- [ ] **Step 1: Write TypingIndicator.jsx**

```jsx
// frontend/src/components/TypingIndicator.jsx
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
```

- [ ] **Step 2: Write TypingIndicator.module.css**

```css
/* frontend/src/components/TypingIndicator.module.css */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.name {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: bold;
}

.bubble {
  background: var(--color-bot-bubble);
  color: var(--color-bot-text);
  border-radius: 0 12px 12px 12px;
  padding: 10px 14px;
  font-size: 14px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 7px;
  height: 7px;
  background: var(--color-gold);
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40% { transform: translateY(-6px); opacity: 1; }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/TypingIndicator.jsx frontend/src/components/TypingIndicator.module.css
git commit -m "feat: add TypingIndicator component"
```

---

## Task 8: ChatMessage Component

**Files:**
- Create: `frontend/src/components/ChatMessage.jsx`
- Create: `frontend/src/components/ChatMessage.module.css`
- Create: `frontend/src/components/ChatMessage.test.jsx`

- [ ] **Step 1: Write failing test**

```jsx
// frontend/src/components/ChatMessage.test.jsx
import { render, screen } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'

test('renders bot message with name and bubble', () => {
  render(<ChatMessage role="bot" content="สวัสดีค่ะ!" />)
  expect(screen.getByText('🎬 น้องฟิล์ม')).toBeInTheDocument()
  expect(screen.getByText(/สวัสดีค่ะ!/)).toBeInTheDocument()
})

test('renders user message without bot name', () => {
  render(<ChatMessage role="user" content="อยากดูหนังผี" />)
  expect(screen.queryByText('🎬 น้องฟิล์ม')).not.toBeInTheDocument()
  expect(screen.getByText('อยากดูหนังผี')).toBeInTheDocument()
})

test('renders bold markdown in bot message', () => {
  render(<ChatMessage role="bot" content="ดู **Shutter** นะคะ" />)
  const bold = document.querySelector('strong')
  expect(bold).toBeInTheDocument()
  expect(bold.textContent).toBe('Shutter')
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- ChatMessage
```

Expected: FAIL

- [ ] **Step 3: Write ChatMessage.jsx**

```jsx
// frontend/src/components/ChatMessage.jsx
import styles from './ChatMessage.module.css'

function renderMarkdown(text) {
  // Bold: **text** → <strong>text</strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    // Line breaks
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
```

- [ ] **Step 4: Write ChatMessage.module.css**

```css
/* frontend/src/components/ChatMessage.module.css */
.wrapper {
  display: flex;
  flex-direction: column;
  max-width: 75%;
}

.bot { align-items: flex-start; align-self: flex-start; }
.user { align-items: flex-end; align-self: flex-end; }

.name {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
}

.bubble {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.6;
  border-radius: 12px;
}

.botBubble {
  background: var(--color-bot-bubble);
  color: var(--color-bot-text);
  border-radius: 0 12px 12px 12px;
}

.userBubble {
  background: var(--color-user-bubble);
  color: var(--color-user-text);
  border-radius: 12px 12px 0 12px;
  font-weight: 500;
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- ChatMessage
```

Expected: all 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ChatMessage.jsx frontend/src/components/ChatMessage.module.css frontend/src/components/ChatMessage.test.jsx
git commit -m "feat: add ChatMessage component with markdown rendering"
```

---

## Task 9: ChatArea Component

**Files:**
- Create: `frontend/src/components/ChatArea.jsx`
- Create: `frontend/src/components/ChatArea.module.css`

- [ ] **Step 1: Write ChatArea.jsx**

```jsx
// frontend/src/components/ChatArea.jsx
import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatArea.module.css'

export function ChatArea({ messages, isLoading, isWakingUp }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className={styles.area}>
      {messages.map((msg, i) => (
        <ChatMessage key={i} role={msg.role} content={msg.content} />
      ))}
      {isLoading && <TypingIndicator isWakingUp={isWakingUp} />}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 2: Write ChatArea.module.css**

```css
/* frontend/src/components/ChatArea.module.css */
.area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.area::-webkit-scrollbar { width: 4px; }
.area::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ChatArea.jsx frontend/src/components/ChatArea.module.css
git commit -m "feat: add ChatArea component with auto-scroll"
```

---

## Task 10: Navbar Component

**Files:**
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/components/Navbar.module.css`

- [ ] **Step 1: Write Navbar.jsx**

```jsx
// frontend/src/components/Navbar.jsx
import { YEAR_RANGES } from '../data/movies'
import styles from './Navbar.module.css'

export function Navbar({ activeRange, onRangeChange }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>🎬 น้องฟิล์ม</div>
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
```

- [ ] **Step 2: Write Navbar.module.css**

```css
/* frontend/src/components/Navbar.module.css */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(7, 7, 7, 0.95);
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  color: var(--color-gold);
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 1px;
}

.tabs {
  display: flex;
  gap: 6px;
}

.tab {
  background: var(--color-gold-subtle);
  color: var(--color-text-muted);
  border: none;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: var(--font-base);
}

.tab:hover { color: var(--color-text); }

.tab.active {
  background: var(--color-gold);
  color: #000;
  font-weight: bold;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Navbar.jsx frontend/src/components/Navbar.module.css
git commit -m "feat: add Navbar component with year tabs"
```

---

## Task 11: PosterCard (shared) + PosterCarousel Component

**Files:**
- Create: `frontend/src/components/PosterCarousel.jsx`
- Create: `frontend/src/components/PosterCarousel.module.css`

- [ ] **Step 1: Write PosterCarousel.jsx**

```jsx
// frontend/src/components/PosterCarousel.jsx
import { useState } from 'react'
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
          <Poster key={movie.imdbId} movie={movie} isCenter={offset === 0} />
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
```

- [ ] **Step 2: Write PosterCarousel.module.css**

```css
/* frontend/src/components/PosterCarousel.module.css */
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  padding: 24px;
  position: relative;
}

.track {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.poster {
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.3s, opacity 0.3s;
}

.poster img,
.placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.placeholder {
  background: linear-gradient(135deg, var(--color-gold-subtle), #3d3200);
  display: flex;
  align-items: flex-end;
  padding: 8px;
}

.placeholder span {
  color: var(--color-gold);
  font-size: 10px;
  line-height: 1.3;
}

.side {
  width: 90px;
  height: 135px;
  opacity: 0.6;
}

.center {
  width: 120px;
  height: 180px;
  opacity: 1;
  border: 2px solid var(--color-gold);
  box-shadow: 0 0 30px rgba(245, 197, 24, 0.3);
}

.arrow {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-circle);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  flex-shrink: 0;
}

.arrow:hover {
  color: var(--color-gold);
  border-color: var(--color-gold);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PosterCarousel.jsx frontend/src/components/PosterCarousel.module.css
git commit -m "feat: add PosterCarousel component with TMDB posters"
```

---

## Task 12: PosterStrip Component

**Files:**
- Create: `frontend/src/components/PosterStrip.jsx`
- Create: `frontend/src/components/PosterStrip.module.css`

- [ ] **Step 1: Write PosterStrip.jsx**

```jsx
// frontend/src/components/PosterStrip.jsx
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
```

- [ ] **Step 2: Write PosterStrip.module.css**

```css
/* frontend/src/components/PosterStrip.module.css */
.strip {
  display: flex;
  height: 80px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.strip::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: linear-gradient(transparent, var(--color-bg));
  pointer-events: none;
}

.poster {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.55;
}

.placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-gold-subtle), #2d2000);
  opacity: 0.5;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PosterStrip.jsx frontend/src/components/PosterStrip.module.css
git commit -m "feat: add PosterStrip component for chat mode"
```

---

## Task 13: App.jsx — Wire Everything Together

**Files:**
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/App.module.css`

- [ ] **Step 1: Write App.jsx**

```jsx
// frontend/src/App.jsx
import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { PosterCarousel } from './components/PosterCarousel'
import { PosterStrip } from './components/PosterStrip'
import { ChatArea } from './components/ChatArea'
import { ChatInput } from './components/ChatInput'
import { useChat } from './hooks/useChat'
import { MOVIES, YEAR_RANGES, filterByYear } from './data/movies'
import styles from './App.module.css'

export default function App() {
  const [activeRange, setActiveRange] = useState(YEAR_RANGES[0])
  const [chatActive, setChatActive] = useState(false)
  const { messages, sendMessage, isLoading, isWakingUp } = useChat()

  const filteredMovies = filterByYear(MOVIES, activeRange)

  const handleSend = (text) => {
    if (!chatActive) setChatActive(true)
    sendMessage(text)
  }

  return (
    <div className={styles.app}>
      <Navbar activeRange={activeRange} onRangeChange={setActiveRange} />

      {chatActive ? (
        <>
          <PosterStrip movies={filteredMovies} />
          <ChatArea messages={messages} isLoading={isLoading} isWakingUp={isWakingUp} />
        </>
      ) : (
        <div className={styles.landing}>
          <PosterCarousel movies={filteredMovies} />
          <p className={styles.tagline}>What's your taste?</p>
        </div>
      )}

      <div className={styles.inputWrapper}>
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write App.module.css**

```css
/* frontend/src/App.module.css */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  overflow: hidden;
}

.landing {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tagline {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-bottom: 8px;
}

.inputWrapper {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}
```

- [ ] **Step 3: Run dev server and test manually**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- ✅ Navbar shows logo + year tabs
- ✅ Poster carousel shows 5 posters (may show placeholders while TMDB loads)
- ✅ Typing a message and pressing Enter triggers chat mode
- ✅ Poster strip appears at top
- ✅ น้องฟิล์ม responds (may take 30-60s if Space was sleeping)
- ✅ Typing indicator shows 3 dots while waiting

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/App.module.css
git commit -m "feat: wire up App with landing/chat states"
```

---

## Task 14: Deploy to GitHub Pages

**Files:**
- Modify: `frontend/vite.config.js` (verify base path)

- [ ] **Step 1: Create GitHub repository**

Go to github.com → New repository → name: `chat-bot` → Public → Create

- [ ] **Step 2: Initialize git and push (from project root)**

```bash
cd D:/chat-bot
git remote add origin https://github.com/YOUR_USERNAME/chat-bot.git
git push -u origin main
```

- [ ] **Step 3: Add TMDB key as GitHub secret**

GitHub repo → Settings → Secrets and variables → Actions → New repository secret  
Name: `VITE_TMDB_API_KEY`  
Value: your TMDB key

- [ ] **Step 4: Create GitHub Actions workflow**

```yaml
# D:/chat-bot/.github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install & Build
        working-directory: frontend
        run: |
          npm install
          npm run build
        env:
          VITE_TMDB_API_KEY: ${{ secrets.VITE_TMDB_API_KEY }}

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: frontend/dist
```

- [ ] **Step 5: Push workflow and verify**

```bash
git add .github/
git commit -m "ci: add GitHub Actions deploy workflow"
git push
```

Go to: GitHub repo → Actions tab → verify deploy succeeds

- [ ] **Step 6: Enable GitHub Pages**

GitHub repo → Settings → Pages → Source: `gh-pages` branch → Save

- [ ] **Step 7: Verify live site**

Open: `https://YOUR_USERNAME.github.io/chat-bot/`  
Expected: site loads with poster carousel and gold theme

---

## Self-Review

**Spec coverage:**
- ✅ Layout B (landing + chat) — Task 13
- ✅ IMDb Gold theme — Task 2
- ✅ TMDB poster fetching — Task 4, 11
- ✅ Year tabs — Task 10
- ✅ Poster strip on chat active — Task 12
- ✅ useChat + Gradio API — Task 5
- ✅ TypingIndicator + waking up message — Task 7
- ✅ Markdown rendering (bold, bullets) — Task 8
- ✅ Auto-scroll — Task 9
- ✅ GitHub Pages deploy — Task 14
- ✅ movies.js extracted from metadata.json — Task 3

**Type consistency check:**
- `useTMDB(imdbId)` → `{ posterUrl, loading }` — used in PosterCarousel and PosterStrip ✅
- `useChat()` → `{ messages, sendMessage, isLoading, isWakingUp }` — used in App ✅
- `filterByYear(movies, range)` — used in App, tested in Task 3 ✅
- `YEAR_RANGES` — used in Navbar and App ✅
- Message shape: `{ role: 'user'|'bot', content: string }` — consistent across ChatArea and ChatMessage ✅
