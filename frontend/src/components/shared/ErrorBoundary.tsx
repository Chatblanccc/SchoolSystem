import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center h-64 bg-muted/10 rounded-lg border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">组件渲染错误</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
