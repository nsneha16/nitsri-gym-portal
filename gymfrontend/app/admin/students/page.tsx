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
import { getAdminStudents } from "@/lib/api"

interface Student {
  id: number
  name: string
  email: string
  department: string
  year: number
  is_active: boolean
  created_at: string
  enrollment_status: string | null
  slot_name: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
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
    fetchStudents()
  }, [page, search])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const data = await getAdminStudents(page, search)
      if (data.success) {
        setStudents(data.data.students)
        setPagination(data.data.pagination)
      }
    } catch {
      console.error("Failed to fetch students")
    }
    setLoading(false)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
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
              <h1 className="text-lg font-semibold text-foreground">All Students</h1>
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
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Students {pagination ? `(${pagination.total})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : students.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No students found</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Name</TableHead>
                        <TableHead className="text-muted-foreground">Email</TableHead>
                        <TableHead className="text-muted-foreground">Department</TableHead>
                        <TableHead className="text-muted-foreground">Year</TableHead>
                        <TableHead className="text-muted-foreground">Current Slot</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow
                          key={s.id}
                          className="border-border cursor-pointer hover:bg-secondary/50"
                          onClick={() => router.push(`/admin/students/${s.id}`)}
                        >
                          <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground">{s.email}</TableCell>
                          <TableCell className="text-muted-foreground">{s.department || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{s.year || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{s.slot_name || 'Not enrolled'}</TableCell>
                          <TableCell>
                            <Badge className={s.enrollment_status === 'confirmed' ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}>
                              {s.enrollment_status || 'No active enrollment'}
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