import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Evita la pantalla en blanco si algo falla al renderizar: muestra un mensaje
// amable y un botón para recargar. Los datos guardados (localStorage/Supabase)
// no se pierden.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Error al renderizar la app:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="app-shell bg-ink-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl bg-card shadow-card p-6 text-center flex flex-col items-center gap-3">
          <p className="text-lg font-semibold text-ink-900">Algo no cargó bien</p>
          <p className="text-sm text-ink-500">
            Hubo un problema al mostrar la app. Recarga la página; tus datos guardados no se pierden.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 min-h-[44px] rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition-colors active:bg-brand-600"
          >
            Recargar
          </button>
        </div>
      </div>
    )
  }
}
