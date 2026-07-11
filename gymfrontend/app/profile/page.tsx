'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { getProfile, updateProfile } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, BookOpen, Calendar, Users, CheckCircle2 } from 'lucide-react'

interface UserProfile {
  id: number
  name: string
  email: string
  department: string
  year: number
  batch: string
  role: string
  profile_complete: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Form fields
  const [name, setName] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [batch, setBatch] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/"); return }
    fetchProfile()
  }, [router])

  const fetchProfile = async () => {
    try {
      const data = await getProfile()
      if (data.success) {
        const user = data.data.user
        setProfile(user)
        // Form mein existing data fill karo
        setName(user.name || "")
        setDepartment(user.department || "")
        setYear(user.year ? String(user.year) : "")
        setBatch(user.batch || "")
      }
    } catch {
      setError("Failed to load profile")
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!name || !department || !year || !batch) {
      setError("All fields are required")
      return
    }

    setSaving(true)
    try {
      const data = await updateProfile({
        name,
        department,
        year: Number(year),
        batch
      })

      if (data.success) {
        setSuccess("Profile updated successfully!")
        fetchProfile()
      } else {
        setError(data.message || "Update failed")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete your profile to access gym slots
          </p>
        </div>

        {/* Profile complete banner */}
        {profile?.profile_complete ? (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-primary">
              Profile complete — you can now enroll in slots!
            </p>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
            <User className="h-5 w-5 text-yellow-500" />
            <p className="text-sm font-medium text-yellow-500">
              Please complete your profile before selecting a slot
            </p>
          </div>
        )}

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Fill in your college information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">

              {/* Name */}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email — readonly */}
              <div className="space-y-2">
                <Label>College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={profile?.email || ""}
                    className="pl-10 opacity-60"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label>Department</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g. CSE, ECE, ME, CE"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Year + Batch — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="1, 2, 3 or 4"
                      type="number"
                      min="1"
                      max="4"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Batch</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="e.g. 2023"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Error / Success */}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-500">{success}</p>}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
                {profile?.profile_complete && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Slots
                  </Button>
                )}
              </div>

            </form>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}