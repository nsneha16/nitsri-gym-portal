"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, LogOut, Clock, Calendar, CalendarCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStudentHistory } from "@/lib/api"

interface Student {
  id: number
  name: string
  email: string
  department: string
  year: number
  batch: string
}

interface EnrollmentHistoryItem {
  id: number
  status: string
  enrolled_date: string
  expiry_date: string
  slot_name: string
  start_time: string
  end_time: string
  days: string
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    if (!token) { router.push("/"); return }
    if (user) {
      const parsed = JSON.parse(user)
      if (parsed.role !== 'admin') { router.push("/dashboard"); return }
    }
    fetchHistory()
  }, [router, studentId])

  const fetchHistory = async () => {
    try {
      const data = await getStudentHistory(parseInt(studentId))
      if (data.success) {
        setStudent(data.data.student)
        setEnrollments(data.data.enrollments)
      }
    } catch {
      console.error("Failed to fetch student history")
    }
    setLoading(false)
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading student details...</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Student not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/students")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{student.name}</h1>
              <p className="text-xs text-muted-foreground">Student Details</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Student info card */}
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{student.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">{student.department || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium text-foreground">{student.year || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch</p>
                <p className="font-medium text-foreground">{student.batch || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <h2 className="mb-4 text-xl font-bold text-foreground">Enrollment History</h2>

        {enrollments.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              No enrollment history
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e) => (
              <Card key={e.id} className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{e.slot_name}</h3>
                    <Badge className={
                      e.status === "confirmed" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                    }>
                      {e.status}
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTime(e.start_time)} - {formatTime(e.end_time)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {e.days}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarCheck className="h-4 w-4" />
                      Enrolled: {new Date(e.enrolled_date).toLocaleDateString('en-IN')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarCheck className="h-4 w-4" />
                      Expires: {new Date(e.expiry_date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}