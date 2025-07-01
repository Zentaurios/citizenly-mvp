'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, BarChart3, Bell, User, Building } from 'lucide-react'

export default function MobileNavigation() {
  const pathname = usePathname()
  
  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Feed', href: '/feed', icon: Users },
    { name: 'Polls', href: '/legislative', icon: BarChart3 },
    { name: 'Reps', href: '/representatives', icon: Building },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith('/notifications') && item.href === '/notifications')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center text-xs ${
                isActive 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}