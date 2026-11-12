"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Quiz Error Boundary caught an error:", error, errorInfo)

    // Log specific DOM manipulation errors
    if (error.message.includes("removeChild") || error.message.includes("Node")) {
      console.warn("This error is likely caused by a browser extension interfering with the DOM")
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold text-destructive">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                This error might be caused by a browser extension interfering with the quiz.
              </p>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-left">
                <p className="text-sm font-medium text-warning mb-2">Try these solutions:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Open the quiz in an incognito/private window</li>
                  <li>• Disable browser extensions temporarily</li>
                  <li>• Try a different browser</li>
                  <li>• Refresh the page</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1 border-turquoise/30 text-turquoise hover:bg-turquoise/10 bg-transparent"
                >
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1 btn-turquoise font-semibold">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs bg-coal-lighter/50 p-2 rounded mt-2 overflow-auto text-foreground">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
