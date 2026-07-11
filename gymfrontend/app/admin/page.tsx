"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, CalendarDays, UserCheck, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAdminDashboard, getAdminEnrollments } from "@/lib/api"

interface Stats {
  totalStudents: number
  totalSlots: number
  activeEnrollments: number
}

interface Enrollment {
  id: number
  student_name: string
  email: string
  slot_name: string
  start_time: string
  end_time: string
  enrolled_date: string
  expiry_date: string
  status: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token) { router.push("/"); return }

    // Admin check
    if (user) {
      const parsed = JSON.parse(user)
      if (parsed.role !== 'admin') {
        router.push("/dashboard")
        return
      }
    }

    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [dashData, enrollData] = await Promise.all([
        getAdminDashboard(),
        getAdminEnrollments()
      ])

      if (dashData.success) setStats(dashData.data)
      if (enrollData.success) setEnrollments(enrollData.data.enrollments)

    } catch {
      console.error("Failed to fetch admin data")
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  const statCards = [
    { title: "Total Students", value: stats?.totalStudents ?? 0, icon: Users },
    { title: "Total Slots", value: stats?.totalSlots ?? 0, icon: CalendarDays },
    { title: "Active Enrollments", value: stats?.activeEnrollments ?? 0, icon: UserCheck },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">G</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">NIT Srinagar Gym</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of gym enrollments and statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enrollments Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              All Enrollments ({enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No enrollments yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Student</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Slot</TableHead>
                      <TableHead className="text-muted-foreground">Timing</TableHead>
                      <TableHead className="text-muted-foreground">Enrolled</TableHead>
                      <TableHead className="text-muted-foreground">Expires</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((e) => (
                      <TableRow key={e.id} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {e.student_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.email}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {e.slot_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTime(e.start_time)} - {formatTime(e.end_time)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(e.enrolled_date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(e.expiry_date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              e.status === "confirmed"
                                ? "bg-primary/20 text-primary"
                                : e.status === "cancelled"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-secondary text-muted-foreground"
                            }
                          >
                            {e.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}