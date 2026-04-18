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
