import { GymSlot, Enrollment } from './types'

export const gymSlots: GymSlot[] = [
  {
    id: '1',
    name: 'Morning Fitness',
    time: '6:00 AM - 7:30 AM',
    days: ['Mon', 'Wed', 'Fri'],
    availableSeats: 12,
    totalCapacity: 25,
    instructor: 'Coach Sharma'
  },
  {
    id: '2',
    name: 'Strength Training',
    time: '7:30 AM - 9:00 AM',
    days: ['Mon', 'Tue', 'Thu', 'Fri'],
    availableSeats: 5,
    totalCapacity: 20,
    instructor: 'Coach Kumar'
  },
  {
    id: '3',
    name: 'Evening Cardio',
    time: '5:00 PM - 6:30 PM',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSeats: 18,
    totalCapacity: 30,
    instructor: 'Coach Verma'
  },
  {
    id: '4',
    name: 'Weekend Warriors',
    time: '8:00 AM - 10:00 AM',
    days: ['Sat', 'Sun'],
    availableSeats: 0,
    totalCapacity: 15,
    instructor: 'Coach Singh'
  },
  {
    id: '5',
    name: 'Night Owls',
    time: '8:00 PM - 9:30 PM',
    days: ['Mon', 'Wed', 'Fri'],
    availableSeats: 22,
    totalCapacity: 25,
    instructor: 'Coach Patel'
  },
  {
    id: '6',
    name: 'Power Hour',
    time: '4:00 PM - 5:00 PM',
    days: ['Tue', 'Thu'],
    availableSeats: 8,
    totalCapacity: 20,
    instructor: 'Coach Reddy'
  }
]

export const currentEnrollment: Enrollment | null = {
  id: 'enr-001',
  slot: gymSlots[2],
  enrolledAt: '2026-03-15',
  expiresAt: '2026-04-15',
  status: 'active'
}
