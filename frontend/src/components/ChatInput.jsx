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
