'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, Mail, Lock, ArrowRight, User, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginUser, signupUser } from "@/lib/api"

type ModalType = 'login' | 'signup' | 'admin' | null

export default function HomePage() {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Signup state
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupError, setSignupError] = useState("")
  const [signupSuccess, setSignupSuccess] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)

  // Admin state
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminError, setAdminError] = useState("")
  const [adminLoading, setAdminLoading] = useState(false)

  const closeModal = () => {
    setActiveModal(null)
    setLoginError("")
    setSignupError("")
    setSignupSuccess("")
    setAdminError("")
  }

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)

    try {
      const data = await loginUser(loginEmail, loginPassword)
      if (data.success) {
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        router.push("/dashboard")
      } else {
        setLoginError(data.message || "Login failed")
      }
    } catch {
      setLoginError("Network error. Check your connection.")
    }
    setLoginLoading(false)
  }

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError("")
    setSignupSuccess("")

    if (!signupEmail.endsWith('@nitsri.ac.in')) {
      setSignupError('Use your college email (@nitsri.ac.in)')
      return
    }

    setSignupLoading(true)
    try {
      const data = await signupUser(signupName, signupEmail, signupPassword)
      if (data.success) {
        setSignupSuccess("Account created! You can now login.")
        setSignupName("")
        setSignupEmail("")
        setSignupPassword("")
      } else {
        setSignupError(data.message || "Signup failed")
      }
    } catch {
      setSignupError("Network error. Check your connection.")
    }
    setSignupLoading(false)
  }

  // Admin login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setAdminError("")
  setAdminLoading(true)

  try {
    const data = await loginUser(adminEmail, adminPassword)
    console.log("Admin login response:", data)  // 👈 add karo debug ke liye

    if (data.success) {
      if (data.data.user.role === 'admin') {
        localStorage.setItem("token", data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        router.push("/admin")  // 👈 yeh chal raha hai?
      } else {
        setAdminError("You are not an admin.")
      }
    } else {
      setAdminError(data.message || "Login failed")
    }
  } catch {
    setAdminError("Network error.")
  }
  setAdminLoading(false)
}
  // const handleAdminLogin = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setAdminError("")
  //   setAdminLoading(true)

  //   try {
  //     const data = await loginUser(adminEmail, adminPassword)
  //     if (data.success && data.data.user.role === 'admin') {
  //       localStorage.setItem("token", data.data.token)
  //       localStorage.setItem("user", JSON.stringify(data.data.user))
  //       router.push("/admin")
  //     } 
  //     // else if (data.success && data.data.user.role !== 'admin') {
  //       // setAdminError("You are not an admin.")
  //     // } 
  //     else {
  //       setAdminError(data.message || "Login failed")
  //     }
  //   } catch {
  //     setAdminError("Network error. Check your connection.")
  //   }
  //   setAdminLoading(false)
  // }

  return (
    <div className="min-h-screen bg-background">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">NITSRI Gym</p>
              <p className="text-xs text-muted-foreground">Portal</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Home
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveModal('signup')}
            >
              Sign Up
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveModal('login')}
            >
              Login
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveModal('admin')}
              className="gap-1 text-muted-foreground"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Dumbbell className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-6xl">
            Train Hard.
            <span className="block text-primary">Train Smart.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            NIT Srinagar's official gym management portal. Register online, book your slot, and show up ready.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2 px-8" onClick={() => setActiveModal('signup')}>
              Register Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setActiveModal('login')}>
              Already a member? Login
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="border-t border-border bg-card/30 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-bold uppercase tracking-wide text-foreground">
            Why NITSRI Gym Portal?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "⚡", title: "Instant Registration", desc: "Sign up online with your college email. No queues, no paperwork." },
              { icon: "📅", title: "9 Flexible Slots", desc: "Morning 7-9 AM and Evening 3-7 PM. 40 min sessions, 6 days a week." },
              { icon: "📊", title: "Real-time Availability", desc: "See live seat counts before you enroll. No surprise full slots." },
              { icon: "🔒", title: "College ID Access", desc: "Only @nitsri.ac.in emails allowed. Secure, verified access." },
              { icon: "🏋️", title: "Easy Enrollment", desc: "Pick your slot, confirm enrollment, show up and train." },
              { icon: "💳", title: "Online Payment", desc: "Fee payment coming soon. No more bank visits." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SLOTS SECTION */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold uppercase tracking-wide text-foreground">
            Available Time Slots
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Morning */}
            <div>
              <h3 className="mb-4 text-center font-bold text-primary">🌅 Morning Grind (7AM - 9AM)</h3>
              <div className="space-y-3">
                {[
                  { code: "MS1", time: "7:00 - 7:40 AM" },
                  { code: "MS2", time: "7:40 - 8:20 AM" },
                  { code: "MS3", time: "8:20 - 9:00 AM" },
                ].map((slot) => (
                  <div key={slot.code} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{slot.code}</span>
                      <span className="text-sm text-foreground">{slot.time}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">30 seats</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Evening */}
            <div>
              <h3 className="mb-4 text-center font-bold text-primary">🌆 Evening Grind (3PM - 7PM)</h3>
              <div className="space-y-3">
                {[
                  { code: "ES1", time: "3:00 - 3:40 PM" },
                  { code: "ES2", time: "3:40 - 4:20 PM" },
                  { code: "ES3", time: "4:20 - 5:00 PM" },
                  { code: "ES4", time: "5:00 - 5:40 PM" },
                  { code: "ES5", time: "5:40 - 6:20 PM" },
                  { code: "ES6", time: "6:20 - 7:00 PM" },
                ].map((slot) => (
                  <div key={slot.code} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{slot.code}</span>
                      <span className="text-sm text-foreground">{slot.time}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">30 seats</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">NITSRI Gym Portal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              National Institute of Technology, Srinagar<br />
              Hazratbal, Srinagar, J&K - 190006
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 NITSRI Gym Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <Card className="border-border bg-card shadow-2xl">

              {/* LOGIN MODAL */}
              {activeModal === 'login' && (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Welcome Back</CardTitle>
                        <CardDescription>Sign in with your college credentials</CardDescription>
                      </div>
                      <button onClick={closeModal} className="rounded-md p-1 hover:bg-secondary">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label>College Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="yourname@nitsri.ac.in" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Enter your password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                      <Button type="submit" className="w-full gap-2" disabled={loginLoading}>
                        {loginLoading ? "Signing in..." : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        New here?{" "}
                        <button type="button" onClick={() => setActiveModal('signup')} className="text-primary underline">
                          Create account
                        </button>
                      </p>
                    </form>
                  </CardContent>
                </>
              )}

              {/* SIGNUP MODAL */}
              {activeModal === 'signup' && (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Create Account</CardTitle>
                        <CardDescription>Register with your college email</CardDescription>
                      </div>
                      <button onClick={closeModal} className="rounded-md p-1 hover:bg-secondary">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Your full name" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>College Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="yourname@nitsri.ac.in" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Create a password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      {signupError && <p className="text-sm text-destructive">{signupError}</p>}
                      {signupSuccess && <p className="text-sm text-green-500">{signupSuccess}</p>}
                      <Button type="submit" className="w-full gap-2" disabled={signupLoading}>
                        {signupLoading ? "Creating account..." : "Create Account"}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button type="button" onClick={() => setActiveModal('login')} className="text-primary underline">
                          Sign in
                        </button>
                      </p>
                    </form>
                  </CardContent>
                </>
              )}

              {/* ADMIN MODAL */}
              {activeModal === 'admin' && (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Admin Login
                        </CardTitle>
                        <CardDescription>Restricted access only</CardDescription>
                      </div>
                      <button onClick={closeModal} className="rounded-md p-1 hover:bg-secondary">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Admin Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="gymadmin@nitsri.ac.in" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Admin password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      {/* {adminError && <p className="text-sm text-destructive">{adminError}</p>} */}
                      {adminError && (<p className={`text-sm ${adminError === 'Login successful' 
                          || adminError.includes('successful') ? 'text-green-500' : 'text-destructive'}`}>{adminError}</p>)}
                      <Button type="submit" className="w-full gap-2" disabled={adminLoading}>
                        {adminLoading ? "Verifying..." : <><Shield className="h-4 w-4" /><span>Admin Sign In</span></>}
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}

            </Card>
          </div>
        </div>
      )}

    </div>
  )
}