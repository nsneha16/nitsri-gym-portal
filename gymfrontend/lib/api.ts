const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Token helper
const getToken = () => localStorage.getItem("token")

// Auth APIs
export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  return res.json()
}

export const signupUser = async (name: string, email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  })
  return res.json()
}

// Slots APIs
export const getSlots = async () => {
  const res = await fetch(`${BASE_URL}/api/slots`, {
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  })
  return res.json()
}

// Enrollment APIs
export const enrollInSlot = async (slot_id: number) => {
  const res = await fetch(`${BASE_URL}/api/enrollments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
    },
    body: JSON.stringify({ slot_id })
  })
  return res.json()
}

export const getMyEnrollments = async () => {
  const res = await fetch(`${BASE_URL}/api/enrollments/my`, {
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  })
  return res.json()
}

export const cancelEnrollment = async (id: number) => {
  const res = await fetch(`${BASE_URL}/api/enrollments/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  })
  return res.json()
}

export const getProfile = async () => {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return res.json()
}

export const updateProfile = async (data: {
  name: string
  department: string
  year: number
  batch: string
}) => {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  })
  return res.json()
}

export const getAdminDashboard = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return res.json()
}

export const getAdminEnrollments = async () => {
  const res = await fetch(`${BASE_URL}/api/admin/enrollments`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return res.json()
}
