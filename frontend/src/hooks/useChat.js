import { useState, useRef } from 'react'
import { Client } from '@gradio/client'

const HF_SPACE = 'chat-ai-movies-imdb/imdb_chatbot'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isWakingUp, setIsWakingUp] = useState(false)
  const clientRef = useRef(null)
  const connectingRef = useRef(false)

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
        content: '\u274c \u0e02\u0e2d\u0e2d\u0e20\u0e31\u0e22\u0e04\u0e48\u0e30 \u0e23\u0e30\u0e1a\u0e1a\u0e02\u0e31\u0e14\u0e02\u0e49\u0e2d\u0e07\u0e0a\u0e31\u0e48\u0e27\u0e04\u0e23\u0e32\u0e27 \u0e25\u0e2d\u0e07\u0e43\u0e2b\u0e21\u0e48\u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07\u0e19\u0e30\u0e04\u0e30'
      }])
    } finally {
      setIsLoading(false)
      setIsWakingUp(false)
    }
  }

  return { messages, sendMessage, isLoading, isWakingUp }
}
