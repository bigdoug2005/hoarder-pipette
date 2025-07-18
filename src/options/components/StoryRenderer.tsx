import type { ReactNode } from 'react'
import { createContext, use } from 'react'

export const StoryContext = createContext<(() => ReactNode) | null>(null)

export function StoryRenderer() {
  const Story = use(StoryContext)
  if (!Story) throw new Error('No story provided')
  return <Story />
}
