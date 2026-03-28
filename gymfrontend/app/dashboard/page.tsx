'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { SlotCard } from '@/components/slot-card'
import { getSlots, enrollInSlot } from '@/lib/api'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Slot {
  id: number
  name: string
  start_time: string
  end_time: string
  days: string
  capacity: number
  enrolled_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'full'>('all')
  const [enrollingSlot, setEnrollingSlot] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }
    fetchSlots()
  }, [router])

  // const fetchSlots = async () => {
  //   try {
  //     const data = await getSlots()
  //     if (data.success) {
  //       setSlots(data.data.slots || [])
  //     }
  //   } catch {
  //     console.error("Failed to fetch slots")
  //   }
  //   setLoading(false)
  // }
  const fetchSlots = async () => {
  try {
    const data = await getSlots()
    console.log("API Response:", data)  // 👈 yeh add karo
    setSlots(data.slots || [])
    
  } catch {
    console.error("Failed to fetch slots")
  }
  setLoading(false)
}

  const handleEnroll = async (slotId: string) => {
    setEnrollingSlot(slotId)
    
    try {
      const data = await enrollInSlot(Number(slotId))

      if (data.success) {
        alert('Enrollment successful!')
        fetchSlots()
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
