'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { getMyEnrollments, cancelEnrollment } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Calendar, 
  Users, 
  CalendarCheck, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Enrollment {
  id: number
  slot_id: number
  slot_name: string
  start_time: string
  end_time: string
  days: string
  capacity: number
  enrolled_count: number
  enrolled_at: string
  expires_at: string
  status: string
}

export default function EnrollmentPage() {
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }
    fetchEnrollments()
  }, [router])

  const fetchEnrollments = async () => {
    try {
      const data = await getMyEnrollments()
      if (data.success && data.data.enrollments && data.data.enrollments.length > 0) {
        setEnrollment(data.data.enrollments[0])
      } else {
        setEnrollment(null)
      }
    } catch {
      setEnrollment(null)
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    if (!enrollment) return
    setIsCancelling(true)
    
    try {
      const data = await cancelEnrollment(enrollment.id)
      if (data.success) {
        setEnrollment(null)
      } else {
        alert(data.message || "Failed to cancel enrollment")
      }
    } catch {
      alert("Network error. Please try again.")
    }
    
    setIsCancelling(false)
  }

  const calculateDaysLeft = () => {
    if (!enrollment) return 0
    const expiry = new Date(enrollment.expires_at)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const daysLeft = calculateDaysLeft()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading enrollment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            My Enrollment
          </h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your current gym enrollment
          </p>
        </div>

        {enrollment ? (
          <div className="space-y-6">
            {/* Status banner */}
            <div className={`flex items-center gap-3 rounded-lg border p-4 ${
              enrollment.status === 'active' 
                ? 'border-primary/50 bg-primary/10' 
                : 'border-destructive/50 bg-destructive/10'
            }`}>
              {enrollment.status === 'active' ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className={`font-medium ${
                  enrollment.status === 'active' ? 'text-primary' : 'text-destructive'
                }`}>
                  {enrollment.status === 'active' ? 'Active Enrollment' : 'Enrollment Expired'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Please renew your enrollment'}
                </p>
              </div>
            </div>

            {/* Enrollment details card */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{enrollment.slot_name}</CardTitle>
                    <CardDescription className="mt-1">
                      Gym Slot
                    </CardDescription>
                  </div>
                  <div className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                    Enrolled
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slot details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Timing</p>
                      <p className="font-medium text-foreground">
                        {formatTime(enrollment.start_time)} - {formatTime(enrollment.end_time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Days</p>
                      <p className="font-medium text-foreground">{enrollment.days}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Enrolled On</p>
                      <p className="font-medium text-foreground">
                        {new Date(enrollment.enrolled_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                    <AlertCircle className={`h-5 w-5 ${daysLeft <= 7 ? 'text-destructive' : 'text-primary'}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">Expires On</p>
                      <p className={`font-medium ${daysLeft <= 7 ? 'text-destructive' : 'text-foreground'}`}>
                        {new Date(enrollment.expires_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Capacity info */}
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">Slot Capacity</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {enrollment.enrolled_count} / {enrollment.capacity} enrolled
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                    <div 
                      className="h-full rounded-full bg-primary"
                      style={{ 
                        width: `${(enrollment.enrolled_count / enrollment.capacity) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Cancel button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Cancel Enrollment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Enrollment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your enrollment in &ldquo;{enrollment.slot_name}&rdquo;? 
                        You will need to re-enroll if you change your mind.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* No enrollment state */
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-secondary p-4">
                <CalendarCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Active Enrollment</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                You are not currently enrolled in any gym slot. Browse available slots on the dashboard to get started.
              </p>
              <Button asChild className="mt-6">
                <a href="/dashboard">Browse Available Slots</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
