'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home,
  BarChart3,
  Users,
  Bell,
  Shield,
  FileText
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationComponents'
import MobileNavigation from './MobileNavigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: any // Simple user object
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: true
    },
    {
      name: 'Legislative Feed',
      href: '/legislative',
      icon: FileText,
      current: false
    },
    {
      name: 'Representatives',
      href: '/representatives',
      icon: Users,
      current: false
    },
    {
      name: 'Polls',
      href: '/polls',
      icon: BarChart3,
      current: false
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      current: false
    },
  ]

  // Add politician-specific navigation
  if (user.role === 'politician') {
    navigation.splice(2, 0, {
      name: 'Create Poll',
      href: '/polls/create',
      icon: BarChart3,
      current: false
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`relative z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <div className="flex h-16 items-center justify-between px-4">
              <Link href="/" className="text-xl font-bold citizenly-text-gradient">
                Citizenly
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow">
          <div className="flex h-16 items-center px-4">
            <Link href="/" className="text-xl font-bold citizenly-text-gradient">
              Citizenly
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role}
                  {user.verificationStatus === 'verified' && (
                    <Shield className="inline h-3 w-3 text-green-500 ml-1" />
                  )}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="group flex items-center px-2 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="group flex w-full items-center px-2 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-900 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1" />
            
            {/* Notifications and user menu */}
            <div className="flex items-center space-x-4">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}
