"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, LogIn, Loader2, AlertCircle, Shield } from "lucide-react"
import Link from "next/link"
import { useAdminAuth } from "@/lib/admin-auth"

export default function AdminLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading, checkAuth } = useAdminAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("Client: AdminLoginPage mounted, checking auth...")
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log("Client: Authenticated, redirecting to /manage-questions")
      router.push("/manage-questions")
    } else {
      console.log("Client: Not authenticated or still loading.")
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Client: Form submitted. Attempting login...")
    setIsSubmitting(true)
    setError(null) // Clear previous errors

    try {
      const success = await login(username, password)
      console.log("Client: Login function returned:", success)

      if (success) {
        // Redirection handled by useEffect when isAuthenticated becomes true
        console.log("Client: Login successful, useEffect will handle redirect.")
      } else {
        console.log("Client: Login failed, setting error message.")
        setError("Invalid username or password. Please check your credentials and try again.")
      }
    } catch (err) {
      console.error("Client: Error during login attempt:", err)
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
      console.log("Client: Login attempt finished.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Redirecting to admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center border border-turquoise/20">
            <Shield className="w-8 h-8 text-turquoise" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Admin Login</CardTitle>
          <p className="text-muted-foreground">Enter your credentials to access the question management panel</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-coal border-border/50 text-foreground placeholder:text-muted-foreground focus:border-turquoise"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full btn-turquoise font-semibold">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <Link href="/">
              <Button
                variant="outline"
                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
