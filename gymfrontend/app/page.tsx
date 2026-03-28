'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginUser } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.endsWith('@nitsri.ac.in')) {
      setError('Please use your college email (@nitsri.ac.in)')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    
    try {
      const data = await loginUser(email, password)

      if (data.success) {
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        router.push("/dashboard")
      } else {
        setError(data.message || "Login failed. Please try again.")
      }
    } catch {
      setError("Network error. Please check your connection.")
    }

    setIsLoading(false)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">NIT Srinagar</h1>
          <p className="mt-1 text-muted-foreground">Gym Management System</p>
        </div>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with your college credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@nitsri.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Use your official NIT Srinagar email to access the gym management system
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          National Institute of Technology, Srinagar
        </p>
      </div>
    </main>
  )
}
