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
