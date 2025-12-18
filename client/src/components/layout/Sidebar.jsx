import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Target,
  X,
  TrendingUp,
  Settings
} from 'lucide-react'
import clsx from 'clsx'
import { useSidebar } from './Layout'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Granum Metrics', href: '/metrics', icon: BarChart3 },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, closeSidebar } = useSidebar()

  return (
    <div
      className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-blue-800">
        <div className="flex items-center">
          <Target className="h-8 w-8 text-blue-300" />
          <div className="ml-3">
            <h1 className="text-xl font-bold">Mutual Mentor</h1>
            <p className="text-xs text-blue-300">NM Advisor CRM</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1 rounded-md hover:bg-blue-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={closeSidebar}
              className={clsx(
                'flex items-center px-4 py-3 rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="ml-3 font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-800">
        <p className="text-xs text-blue-300 text-center">
          © 2025 Mutual Mentor
        </p>
      </div>
    </div>
  )
}
