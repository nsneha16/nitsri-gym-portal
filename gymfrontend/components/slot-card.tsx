'use client'

import { GymSlot } from '@/lib/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, Calendar } from 'lucide-react'

interface SlotCardProps {
  slot: GymSlot
  onEnroll: (slotId: string) => void
}

export function SlotCard({ slot, onEnroll }: SlotCardProps) {
  // 👈 Backend fields se calculate karo
  const availableSeats = slot.capacity - slot.enrolled_count
  const isFull = availableSeats === 0
  const isLowAvailability = availableSeats <= 5 && availableSeats > 0
  const availabilityPercentage = (availableSeats / slot.capacity) * 100

  // 👈 Time format karo — "06:00:00" → "6:00 AM"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-primary transition-all group-hover:h-1.5"
        style={{
          width: `${100 - availabilityPercentage}%`,
          opacity: isFull ? 1 : 0.7
        }}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{slot.name}</h3>
          </div>
          <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${isFull
            ? 'bg-destructive/20 text-destructive'
            : isLowAvailability
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-primary/20 text-primary'
            }`}>
            {isFull ? 'Full' : isLowAvailability ? 'Low' : 'Available'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 👈 start_time aur end_time use karo */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
        </div>

        {/* 👈 days string directly use karo */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{slot.days}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className={`font-medium ${isFull
            ? 'text-destructive'
            : isLowAvailability
              ? 'text-yellow-400'
              : 'text-foreground'
            }`}>
            {availableSeats}
          </span>
          <span className="text-muted-foreground">/ {slot.capacity} seats</span>
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${isFull
              ? 'bg-destructive'
              : isLowAvailability
                ? 'bg-yellow-500'
                : 'bg-primary'
              }`}
            style={{ width: `${100 - availabilityPercentage}%` }}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={isFull}
          onClick={() => onEnroll(String(slot.id))}
        >
          {isFull ? 'No Seats Available' : 'Enroll Now'}
        </Button>
      </CardFooter>
    </Card>
  )
}