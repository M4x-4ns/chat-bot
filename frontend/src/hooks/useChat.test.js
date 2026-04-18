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
