import { useState, useEffect } from 'react'
import LoginPage from './Loginpage'
import AdminDashboard from './Admindashboard'
import EmployeeDashboard from './Employeedashboard'
import { getUser, authAPI } from './api'
import { getTheme, setTheme, THEMES } from './theme'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [theme, setThemeState]        = useState(getTheme)

  const toggleTheme = () => {
    const next = theme.name === 'dark' ? THEMES.light : THEMES.dark
    setTheme(next.name)
    setThemeState(next)
  }

  useEffect(() => {
    const savedUser = getUser()
    const token = localStorage.getItem('performos_token')
    if (savedUser && token) {
      setCurrentUser(savedUser)
      setCurrentPage(savedUser.role === 'admin' ? 'admin' : 'employee')
    }
    setLoading(false)
  }, [])

  const handleLogin = (role, user) => {
    setCurrentUser(user)
    setCurrentPage(role === 'admin' ? 'admin' : 'employee')
  }

  const handleLogout = () => {
    authAPI.logout()
    setCurrentUser(null)
    setCurrentPage('login')
  }

  if (loading) {
    const t = theme
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: t.bg }}>
        <div style={{ width:'32px', height:'32px', border:`3px solid ${t.accent}30`, borderTopColor: t.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const sharedProps = { onLogout: handleLogout, currentUser, theme, toggleTheme }

  if (currentPage === 'admin')    return <AdminDashboard    {...sharedProps} />
  if (currentPage === 'employee') return <EmployeeDashboard {...sharedProps} />
  return <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
}

export default App