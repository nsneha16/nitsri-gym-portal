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
  id: number
  name: string
  start_time: string      // "06:00:00"
  end_time: string        // "07:40:00"
  days: string            // "Mon,Tue,Wed"
  capacity: number
  enrolled_count: number
  is_active?: boolean
}
// History — student's own enrollment history
export interface EnrollmentHistoryItem {
  id: number
  status: 'confirmed' | 'cancelled'
  enrolled_date: string
  expiry_date: string
  slot_name: string
  start_time: string
  end_time: string
  days: string
}

// Admin — student list
export interface StudentListItem {
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

// Admin — single student detail (for history page)
export interface StudentDetail {
  id: number
  name: string
  email: string
  department: string
  year: number
  batch: string
}
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}