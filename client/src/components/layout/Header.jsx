import { useLocation } from 'react-router-dom'
import { Menu, LogOut, User } from 'lucide-react'
import { useSidebar } from './Layout'
import { useAuth } from '../../contexts/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Client Pipeline',
  '/metrics': 'Granum Metrics Tracker',
  '/analytics': 'Analytics',
  '/settings': 'Settings'
}

export default function Header() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()
  const { user, logout } = useAuth()
  const title = pageTitles[location.pathname] || 'Mutual Mentor'

  function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
      logout()
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {/* Hamburger menu - mobile only */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>

        <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      {/* User info and logout */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{user?.name || user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  )
}
