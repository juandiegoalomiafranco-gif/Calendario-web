import { useEffect, useState } from 'react'

/** Suscripción a una media query, para decidir en JS lo que CSS no puede resolver. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** `lg` de Tailwind: a partir de aquí se muestra la barra lateral y la rejilla horaria. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
