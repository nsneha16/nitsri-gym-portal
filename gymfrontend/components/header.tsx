'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, LogOut, LayoutDashboard, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/enrollment', label: 'My Enrollment', icon: CalendarCheck }
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">NIT Srinagar</h1>
            <p className="text-xs text-muted-foreground">Gym Management</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`gap-2 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="ml-2 gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
