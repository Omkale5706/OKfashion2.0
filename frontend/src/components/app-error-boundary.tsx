import React from "react"

type AppErrorBoundaryState = {
  hasError: boolean
  errorMessage: string
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, errorMessage: "" }
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || "Unknown runtime error" }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App render error:", error)
    console.error("Component stack:", errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-gray-900 p-8">
          <h1 className="text-2xl font-bold mb-4">UI runtime error</h1>
          <p className="mb-2">The app encountered an error while rendering.</p>
          <p className="font-mono text-sm bg-gray-100 border border-gray-200 rounded p-3">{this.state.errorMessage}</p>
        </div>
      )
    }

    return this.props.children
  }
}
