"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAdminSlots, toggleSlotStatus } from "@/lib/api"

interface Slot {
  id: number
  name: string
  start_time: string
  end_time: string
  days: string
  capacity: number
  enrolled_count: number
  is_active: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminSlotsPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)

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
    fetchSlots()
  }, [page])

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const data = await getAdminSlots(page)
      if (data.success) {
        setSlots(data.data.slots)
        setPagination(data.data.pagination)
      }
    } catch {
      console.error("Failed to fetch slots")
    }
    setLoading(false)
  }

  const handleToggle = async (slotId: number) => {
    setTogglingId(slotId)
    try {
      await toggleSlotStatus(slotId)
      fetchSlots()
    } catch {
      console.error("Failed to toggle slot")
    }
    setTogglingId(null)
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
              <h1 className="text-lg font-semibold text-foreground">All Slots</h1>
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
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              Slots {pagination ? `(${pagination.total})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : slots.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No slots found</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Name</TableHead>
                        <TableHead className="text-muted-foreground">Timing</TableHead>
                        <TableHead className="text-muted-foreground">Days</TableHead>
                        <TableHead className="text-muted-foreground">Capacity</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slots.map((s) => (
                        <TableRow key={s.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatTime(s.start_time)} - {formatTime(s.end_time)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.days}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.enrolled_count} / {s.capacity}
                          </TableCell>
                          <TableCell>
                            <Badge className={s.is_active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={togglingId === s.id}
                              onClick={() => handleToggle(s.id)}
                            >
                              {togglingId === s.id ? "..." : s.is_active ? "Deactivate" : "Activate"}
                            </Button>
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