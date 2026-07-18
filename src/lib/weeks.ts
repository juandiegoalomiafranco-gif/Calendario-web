export function chunkIntoWeeks<T extends { date: string }>(days: T[]): T[][] {
  const weeks: T[][] = []
  let current: T[] = []
  for (const day of days) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay()
    if (weekday === 1 && current.length) {
      weeks.push(current)
      current = []
    }
    current.push(day)
  }
  if (current.length) weeks.push(current)
  return weeks
}
