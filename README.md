<div align="center">

# 🏋️ NITSRI Gym Portal

### NIT Srinagar's Official Gym Management System

**Digitizing gym registration, slot booking, and enrollment for NIT Srinagar students**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen?style=for-the-badge)](https://nsneha16-nitsri-gym-portal-hdoguwkts-nsneha16s-projects.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-purple?style=for-the-badge)](https://nitsri-gym-backend.onrender.com)
[![Database](https://img.shields.io/badge/Database-Aiven%20MySQL-blue?style=for-the-badge)](https://aiven.io)

---

![NITSRI Gym Portal](https://img.shields.io/badge/Status-Live%20%F0%9F%9F%A2-success?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=flat-square&logo=mysql)

</div>

---

## 📌 The Problem

At NIT Srinagar, gym management was **completely manual**:

- 📋 Paper registers for student registration
- 🏦 Bank visits required for fee payment
- ❓ No way to check slot availability without physically visiting
- 📁 Zero digital records for administration

**NITSRI Gym Portal** solves all of this with a full-stack digital solution.

---

## ✨ Features

### 👨‍🎓 Student
| Feature | Description |
|---|---|
| 🔐 Secure Login | College email (`@nitsri.ac.in`) only |
| 👤 Profile Setup | Department, year, batch required before enrollment |
| 📅 Slot Browsing | Real-time seat availability across 9 slots |
| ✅ Instant Enrollment | One-click with live seat blocking |
| 🔄 Slot Switching | Switch with confirmation dialog |
| 📊 Enrollment Tracking | Active slot with expiry date |

### 🛡️ Admin
| Feature | Description |
|---|---|
| 🔒 Role-based Access | Separate admin login, JWT role check |
| 📈 Dashboard | Total students, slots, active enrollments — clickable stat cards |
| 👥 Student Management | Paginated, searchable list of all students with enrollment status |
| 📋 Enrollment Management | Paginated, searchable across student/slot names |
| 🕐 Slot Management | Create new slots, toggle active/inactive, view capacity |
| 🕓 Student History | Full enrollment history per student, click-through from list |

---

## 🛠️ Tech Stack

```
Frontend         →  Next.js 16 + Tailwind CSS + Shadcn UI
Backend          →  Node.js + Express.js
Database         →  MySQL 8.4 (Aiven Cloud)
Authentication   →  JWT (JSON Web Tokens)
Hosting          →  Vercel (frontend) + Render (backend)
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                       │
│   Student App (Next.js)  +  Admin Dashboard (Next.js)    │
└──────────────────────────────────────────────────────────┘
                              │ HTTPS + JWT Token
┌──────────────────────────────────────────────────────────┐
│             API LAYER — Express.js (Render)              │
│       JWT Middleware · Error Handling · Role Check       │
└──────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────┐
│          /api/auth   /api/profile   /api/slots           │
│              /api/admin   /api/enrollments                │
└──────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────┐
│                        DATA LAYER                        │
│        MySQL (Aiven Cloud) — Connection Pool ×10         │
└──────────────────────────────────────────────────────────┘
```

---

## ⚙️ Key Engineering Decisions

### 1. Concurrent Booking Prevention (Race Condition Fix)

> **Problem:** Two students clicking "Enroll" simultaneously on the last available seat — both see capacity available, both insert — overbooking happens.

> **Solution:** `SELECT ... FOR UPDATE` inside a database transaction ensures row-level locking. Only one request gets the lock; the other waits or fails gracefully.

```javascript
await conn.beginTransaction();

// Row-level lock — only one transaction proceeds at a time
const [slots] = await conn.query(
  "SELECT * FROM slots WHERE id = ? AND is_active = 1 FOR UPDATE",
  [slot_id]
);

if (slot.enrolled_count >= slot.capacity) {
  throw new AppError("Slot is full", 409);
}

await conn.query("INSERT INTO enrollments ...");
await conn.query("UPDATE slots SET enrolled_count = enrolled_count + 1 ...");

await conn.commit();
```

This is the same pattern used by **BookMyShow, Zomato, and production ticketing systems**.

### 2. Connection Pooling

Instead of creating a new DB connection per request (expensive), a pool of 10 connections is maintained and reused:

```javascript
const db = mysql.createPool({
  connectionLimit: 10,
  waitForConnections: true,
  // ...
});
```

### 3. Role-Based Access Control

JWT payload includes `role` — admin routes protected by middleware:

```javascript
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
```

### 4. Centralized Error Handling

Custom `AppError` class + Express error middleware ensures consistent JSON responses across all routes:

```json
// Success
{ "success": true, "message": "Enrollment successful", "data": { ... } }

// Error
{ "success": false, "message": "Slot is full" }
```

---

## 📡 API Reference

### Auth
```
POST  /api/auth/signup          Register with college email
POST  /api/auth/login           Login → returns JWT token
```

### Profile
```
GET   /api/profile              Get my profile
PATCH /api/profile              Update name, dept, year, batch
```

### Slots
```
GET   /api/slots                Get all active slots (student)
POST  /api/slots                Create new slot (admin)
PATCH /api/slots/:id            Update slot (admin)
```

### Enrollments
```
POST   /api/enrollments         Enroll in a slot
GET    /api/enrollments/my      My active enrollment
DELETE /api/enrollments/:id     Cancel enrollment
GET /api/enrollments/history My full enrollment history
```

### Admin
```
GET /api/admin/dashboard Stats — students, slots, enrollments
GET /api/admin/students Paginated + searchable student list
GET /api/admin/students/:id/history Individual student's enrollment history
GET /api/admin/enrollments Paginated + searchable enrollment list
GET /api/admin/slots Paginated slot list (active + inactive)
PATCH /api/admin/slots/:id/toggle Toggle slot active/inactive
```

### 5. Pagination & Search on Admin Queries

Admin list endpoints (students, slots, enrollments) support server-side pagination and search rather than fetching entire tables — keeping response times consistent as data grows:

```javascript
const searchClause = search ? `AND (u.name LIKE ? OR s.name LIKE ?)` : ""
const [enrollments] = await db.query(
  `SELECT ... WHERE 1=1 ${searchClause}
   ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
  [...searchParams, limit, offset]
)
```

### 6. Password Security

Passwords are hashed using bcrypt (10 salt rounds) before storage — plaintext passwords are never persisted. Login compares the submitted password against the stored hash using `bcrypt.compare()`.
---

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password        VARCHAR(100) NOT NULL,
  role            ENUM('student', 'admin') DEFAULT 'student',
  college_id      VARCHAR(15) UNIQUE,
  department      VARCHAR(50),
  year            INT,
  batch           VARCHAR(20),
  profile_complete BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slots table
CREATE TABLE slots (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(50) NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  days           VARCHAR(50) NOT NULL,
  capacity       INT DEFAULT 30,
  enrolled_count INT DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE enrollments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  slot_id       INT NOT NULL,
  status        ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  enrolled_date DATE NOT NULL,
  expiry_date   DATE GENERATED ALWAYS AS (DATE_ADD(enrolled_date, INTERVAL 1 MONTH)) STORED,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (slot_id) REFERENCES slots(id)
);
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- MySQL 8.x
- pnpm

### Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Fill in your DB credentials and JWT secret

node server.js
# Server running at http://localhost:8000
```

### Frontend
```bash
cd gymfrontend
pnpm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

pnpm run dev
# App running at http://localhost:3000
```

### Environment Variables

**Backend `.env`**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gym_system
JWT_SECRET=your_long_random_secret
NODE_ENV=development
TZ=Asia/Kolkata
```

**Frontend `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Project Structure

```
nitsri-gym-portal/
│
├── backend/
│ ├── src/
│ │ ├── config/
│ │ │ └── db.js # MySQL connection pool
│ │ ├── controllers/
│ │ │ ├── authController.js
│ │ │ ├── slotController.js
│ │ │ ├── enrollmentController.js
│ │ │ ├── profileController.js
│ │ │ └── adminController.js
│ │ ├── middleware/
│ │ │ ├── authMiddleware.js # JWT verification
│ │ │ └── errorMiddleware.js # Central error handler
│ │ ├── routes/
│ │ │ ├── authRoutes.js
│ │ │ ├── slotRoutes.js
│ │ │ ├── enrollmentRoutes.js
│ │ │ ├── profileRoutes.js
│ │ │ └── adminRoutes.js
│ │ └── utils/
│ │ ├── apiResponse.js # sendSuccess / sendError
│ │ ├── AppError.js # Custom error class
│ │ └── generateToken.js # JWT generation
│ ├── app.js
│ └── server.js
│
└── gymfrontend/
├── app/
│ ├── page.tsx # Landing + Login + Signup
│ ├── dashboard/page.tsx # Slot browsing
│ ├── enrollment/page.tsx # My enrollment
│ ├── history/page.tsx # My enrollment history
│ ├── profile/page.tsx # Student profile
│ └── admin/
│ ├── page.tsx # Admin dashboard
│ ├── students/page.tsx # All students (paginated, searchable)
│ ├── students/[id]/page.tsx # Student detail + history
│ ├── slots/page.tsx # All slots (create, toggle)
│ └── enrollments/page.tsx # All enrollments (paginated, searchable)
├── components/
│ ├── header.tsx
│ └── slot-card.tsx
└── lib/
├── api.ts # All API calls
└── types.ts # TypeScript interfaces
```

---

## 🔮 Upcoming Features

- [ ] **Razorpay Integration** — Online fee payment, no bank visits
- [ ] **Claude AI** — Personalized workout & diet plans based on body metrics
- [ ] **Email Notifications** — Enrollment confirmation via email
- [ ] **Student History** — Past enrollment records
- [ ] **Admin CSV Export** — Download student data
- [ ] **Password Hashing** — bcrypt before production
- [ ] **Refresh Tokens** — Seamless session management

---

## 👩‍💻 Author

**Sneha Namdeo**
B.Tech CSE · NIT Srinagar

> *Built as a real solution for NIT Srinagar's gym management problem — not just a portfolio project.*

---

<div align="center">

**⭐ Star this repo if you found it useful!**

Made with ❤️ at NIT Srinagar

</div>
