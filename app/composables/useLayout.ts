import { useState } from '#app'

export function useLayout() {
  const layout = useState<string>('layout', () => 'default')

  const setLayout = (name: string) => {
    layout.value = name
  }

  return {
    layout,
    setLayout,
  }
}
