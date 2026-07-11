'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { SlotCard } from '@/components/slot-card'
import { getSlots, enrollInSlot, getMyEnrollments, cancelEnrollment, getProfile } from '@/lib/api'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Slot {
  id: number
  name: string
  start_time: string
  end_time: string
  days: string
  capacity: number
  enrolled_count: number
  is_active?: boolean 
}

interface ActiveEnrollment {
  id: number
  slot_name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'full'>('all')
  const [enrollingSlot, setEnrollingSlot] = useState<string | null>(null)

  // Active enrollment state
  const [activeEnrollment, setActiveEnrollment] = useState<ActiveEnrollment | null>(null)

  // Warning dialog state
  const [showWarning, setShowWarning] = useState(false)
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)

  useEffect(() => {
  const token = localStorage.getItem("token")
  if (!token) { router.push("/"); return }

  const init = async () => {
    try {
      // Profile check
      const profileData = await getProfile()
      
      if (!profileData.success) {
        router.push("/")
        return
      }

      if (!profileData.data.user.profile_complete) {
        router.push("/profile")
        return
      }

      // Profile complete hai — slots aur enrollment fetch karo
      fetchSlots()
      fetchActiveEnrollment()

    } catch {
      router.push("/")
    }
  }

  init()
}, [router])

  const fetchSlots = async () => {
    try {
      const data = await getSlots()
      setSlots(data.slots || [])
    } catch {
      console.error("Failed to fetch slots")
    }
    setLoading(false)
  }

  // Active enrollment fetch karo
  const fetchActiveEnrollment = async () => {
    try {
      const data = await getMyEnrollments()
      if (data.success && data.data.enrollments?.length > 0) {
        setActiveEnrollment(data.data.enrollments[0])
      }
    } catch {
      console.error("Failed to fetch enrollment")
    }
  }

  // Enroll button click
  const handleEnroll = async (slotId: string) => {
    // Active enrollment hai? Warning dikhao
    if (activeEnrollment) {
      setPendingSlotId(slotId)
      setShowWarning(true)
      return
    }
    // Nahi hai — seedha enroll karo
    await doEnroll(slotId)
  }

  // Warning pe "Yes" click — cancel old, enroll new
  const handleConfirmSwitch = async () => {
    if (!activeEnrollment || !pendingSlotId) return
    setShowWarning(false)

    try {
      // Pehle cancel karo
      await cancelEnrollment(activeEnrollment.id)
      // Phir naya enroll karo
      await doEnroll(pendingSlotId)
    } catch {
      alert("Something went wrong. Please try again.")
    }

    setPendingSlotId(null)
  }

  // Actual enroll function
  const doEnroll = async (slotId: string) => {
    setEnrollingSlot(slotId)
    try {
      const data = await enrollInSlot(Number(slotId))
      if (data.success) {
        alert('Enrollment successful!')
        fetchSlots()
        fetchActiveEnrollment()
      } else {
        alert(data.message || "Enrollment failed")
      }
    } catch {
      alert("Network error. Please try again.")
    }
    setEnrollingSlot(null)
  }

  const filteredSlots = slots.filter((slot) => {
    const matchesSearch = slot.name.toLowerCase().includes(searchQuery.toLowerCase())
    const available = slot.capacity - slot.enrolled_count
    if (filterAvailability === 'available') return matchesSearch && available > 0
    if (filterAvailability === 'full') return matchesSearch && available === 0
    return matchesSearch
  })

  const availableCount = slots.filter((s) => s.capacity - s.enrolled_count > 0).length
  const totalSeatsAvailable = slots.reduce((acc, s) => acc + (s.capacity - s.enrolled_count), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading slots...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already Enrolled!</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently enrolled in <strong>{activeEnrollment?.slot_name}</strong>.
              Do you want to cancel that and enroll in this new slot?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSlotId(null)}>
              Keep Current Slot
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
              Yes, Switch Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Active enrollment banner */}
        {activeEnrollment && (
          <div className="mb-6 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3">
            <p className="text-sm text-primary font-medium">
              ✅ Active slot: <strong>{activeEnrollment.slot_name}</strong> — 
              <a href="/enrollment" className="underline ml-1">View details</a>
            </p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Available Gym Slots
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse and enroll in available gym sessions
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Slots</p>
            <p className="text-2xl font-bold text-foreground">{slots.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Available Slots</p>
            <p className="text-2xl font-bold text-primary">{availableCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Open Seats</p>
            <p className="text-2xl font-bold text-foreground">{totalSeatsAvailable}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search slots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterAvailability === 'all' ? 'All Slots' :
                  filterAvailability === 'available' ? 'Available' : 'Full'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterAvailability('all')}>All Slots</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAvailability('available')}>Available Only</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterAvailability('full')}>Full Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {filteredSlots.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                onEnroll={handleEnroll}
                isEnrolling={enrollingSlot === String(slot.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No slots found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </main>
    </div>
  )
}