import { useSyncExternalStore } from 'react'

const query = '(min-width: 769px)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(query).matches
}

function getServerSnapshot() {
  return false
}

export function useViewport() {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { isDesktop }
}
