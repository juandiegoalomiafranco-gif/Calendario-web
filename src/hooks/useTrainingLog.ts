import { useCallback, useEffect, useState } from 'react'
import type { LogEntry } from '../data/types'

const STORAGE_KEY = 'calendario-web:log:v1'

type LogMap = Record<string, LogEntry>

function readStorage(): LogMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LogMap) : {}
  } catch {
    return {}
  }
}

export function useTrainingLog() {
  const [log, setLog] = useState<LogMap>(() => readStorage())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
  }, [log])

  const getEntry = useCallback((sessionId: string): LogEntry | undefined => log[sessionId], [log])

  const setEntry = useCallback((sessionId: string, entry: LogEntry) => {
    setLog((prev) => ({ ...prev, [sessionId]: entry }))
  }, [])

  const toggleCompleted = useCallback((sessionId: string) => {
    setLog((prev) => {
      const existing = prev[sessionId]
      return { ...prev, [sessionId]: { ...existing, completed: !existing?.completed } }
    })
  }, [])

  return { log, getEntry, setEntry, toggleCompleted }
}
