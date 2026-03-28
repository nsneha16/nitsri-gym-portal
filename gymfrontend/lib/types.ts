// export interface GymSlot {
//   id: string
//   name: string
//   time: string
//   days: string[]
//   availableSeats: number
//   totalCapacity: number
//   instructor?: string
// }

export interface Enrollment {
  id: string
  slot: GymSlot
  enrolledAt: string
  expiresAt: string
  status: 'active' | 'expired' | 'cancelled'
}

export interface User {
  id: string
  email: string
  name: string
}
export interface GymSlot {
  id: string
  name: string
  start_time: string      // "06:00:00"
  end_time: string        // "07:40:00"
  days: string            // "Mon,Tue,Wed"
  capacity: number
  enrolled_count: number
  is_active: boolean
}