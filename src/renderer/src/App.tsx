/**
 * App.tsx — Componente raíz de la aplicación React
 * 
 * Maneja:
 * - Layout principal (sidebar + contenido)
 * - Navegación entre páginas (sin react-router, usando estado)
 * - Carga de estadísticas para badges del sidebar
 */
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import CalendarPage from './pages/Calendar'
import Inbox from './pages/Inbox'
import Shortcuts from './pages/Shortcuts'
import Settings from './pages/Settings'
import type { PageName } from './types'
export default function App() {
  // Página actual (por defecto: dashboard)
  const [currentPage, setCurrentPage] = useState<PageName>('dashboard')

  // Estado del sidebar (colapsado o expandido)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Estadísticas para los badges del sidebar
  const [unreadEmails, setUnreadEmails] = useState(0)
  const [pendingTasks, setPendingTasks] = useState(0)

  /**
   * Cargar estadísticas para los badges del sidebar
   */
  useEffect(() => {
    loadStats()
    // Actualizar cada 60 segundos
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    try {
      const stats = await window.api.getStats()
      setUnreadEmails(stats.unreadEmails)
      setPendingTasks(stats.totalTasksToday - stats.completedTasksToday)
    } catch (error) {
      // Silenciar error si la API no está lista aún
      console.debug('Stats no disponibles aún')
    }
  }

  /**
   * Navegar a una página y actualizar estadísticas
   */
  function handleNavigate(page: PageName) {
    setCurrentPage(page)
    loadStats() // Actualizar badges al navegar
  }

  /**
   * Renderizar la página actual
   */
  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'tasks':
        return <Tasks />
      case 'calendar':
        return <CalendarPage />
      case 'inbox':
        return <Inbox />
      case 'shortcuts':
        return <Shortcuts />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="app-layout">

      {/* Sidebar de navegación */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        unreadEmails={unreadEmails}
        pendingTasks={pendingTasks}
      />

      {/* Área de contenido principal */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
