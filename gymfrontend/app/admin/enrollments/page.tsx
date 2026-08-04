"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAdminEnrollments } from "@/lib/api"

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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminEnrollmentsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    if (!token) { router.push("/"); return }
    if (user) {
      const parsed = JSON.parse(user)
      if (parsed.role !== 'admin') { router.push("/dashboard"); return }
    }
  }, [router])

  useEffect(() => {
    fetchEnrollments()
  }, [page, search])

  const fetchEnrollments = async () => {
    setLoading(true)
    try {
      const data = await getAdminEnrollments(page, search)
      if (data.success) {
        setEnrollments(data.data.enrollments)
        setPagination(data.data.pagination)
      }
    } catch {
      console.error("Failed to fetch enrollments")
    }
    setLoading(false)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">All Enrollments</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student or slot name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Enrollments {pagination ? `(${pagination.total})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : enrollments.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No enrollments found</p>
            ) : (
              <>
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
                          <TableCell className="font-medium text-foreground">{e.student_name}</TableCell>
                          <TableCell className="text-muted-foreground">{e.email}</TableCell>
                          <TableCell className="text-foreground">{e.slot_name}</TableCell>
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
                            <Badge className={
                              e.status === "confirmed" ? "bg-primary/20 text-primary" :
                              e.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                              "bg-secondary text-muted-foreground"
                            }>
                              {e.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}