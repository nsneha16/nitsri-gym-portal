'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { getMyHistory } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, CalendarCheck } from 'lucide-react'

interface HistoryEnrollment {
  id: number
  status: string
  enrolled_date: string
  expiry_date: string
  slot_name: string
  start_time: string
  end_time: string
  days: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/"); return }
    fetchHistory()
  }, [router])

  const fetchHistory = async () => {
    try {
      const data = await getMyHistory()
      if (data.success) {
        setHistory(data.data.enrollments)
      }
    } catch {
      console.error("Failed to fetch history")
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-primary/20 text-primary'
      case 'cancelled': return 'bg-destructive/20 text-destructive'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      default: return 'bg-secondary text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Enrollment History
          </h1>
          <p className="mt-2 text-muted-foreground">
            All your past and current gym enrollments
          </p>
        </div>

        {history.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">No enrollment history</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You have not enrolled in any slot yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((enrollment) => (
              <Card key={enrollment.id} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{enrollment.slot_name}</CardTitle>
                    <Badge className={getStatusColor(enrollment.status)}>
                      {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{formatTime(enrollment.start_time)} - {formatTime(enrollment.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{enrollment.days}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span>Enrolled: {new Date(enrollment.enrolled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span>Expires: {new Date(enrollment.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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