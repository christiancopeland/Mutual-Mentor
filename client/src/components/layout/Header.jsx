import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useSidebar } from './Layout'

const pageTitles = {
  '/': 'Dashboard',
  '/clients': 'Client Pipeline',
  '/metrics': 'Granum Metrics Tracker'
}

export default function Header() {
  const location = useLocation()
  const { toggleSidebar } = useSidebar()
  const title = pageTitles[location.pathname] || 'Mutual Mentor'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6">
      {/* Hamburger menu - mobile only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>

      <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
    </header>
  )
}
