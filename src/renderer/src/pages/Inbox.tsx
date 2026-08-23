/**
 * Inbox.tsx — Página de correos electrónicos
 * 
 * Muestra la bandeja de entrada con:
 * - Correos sincronizados desde Gmail
 * - Indicador de leído/no leído
 * - Avatar con inicial del remitente
 * - Previsualización del contenido
 * - Botón para sincronizar manualmente
 */
import React, { useState, useEffect, useRef } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { RefreshCw, Mail, MailOpen, ExternalLink } from 'lucide-react'
import type { Email } from '../types'

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  /**
   * Cargar correos del cache local al montar
   */
  useEffect(() => {
    loadEmails()
  }, [])

  async function loadEmails() {
    setLoading(true)
    try {
      const data = await window.api.getEmails(50)
      setEmails(data)
    } catch (error) {
      console.error('Error al cargar correos:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sincronizar correos desde Gmail
   */
  async function handleSync() {
    setSyncing(true)
    try {
      const data = await window.api.syncGmail()
      setEmails(data)
    } catch (error) {
      console.error('Error al sincronizar Gmail:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Filtrar correos según selección
  const filteredEmails = filter === 'unread'
    ? emails.filter(e => !e.isRead)
    : emails

  const unreadCount = emails.filter(e => !e.isRead).length

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeIndex = ['all', 'unread'].indexOf(filter)
      const activeTab = tabsRef.current[activeIndex]
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth
        })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [filter, emails.length, unreadCount])

  /**
   * Genera un color de avatar basado en el nombre del remitente.
   * Siempre produce el mismo color para el mismo nombre.
   */
  function getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #4F46E5, #7C3AED)',
      'linear-gradient(135deg, #059669, #10B981)',
      'linear-gradient(135deg, #D97706, #F59E0B)',
      'linear-gradient(135deg, #DC2626, #EF4444)',
      'linear-gradient(135deg, #2563EB, #3B82F6)',
      'linear-gradient(135deg, #7C3AED, #A78BFA)',
      'linear-gradient(135deg, #0891B2, #06B6D4)',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Formatear fecha relativa del correo
   */
  function formatEmailDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return format(date, 'HH:mm')
      } else if (diffDays === 1) {
        return 'Ayer'
      } else if (diffDays < 7) {
        return format(date, 'EEEE', { locale: es })
      } else {
        return format(date, 'dd/MM/yyyy')
      }
    } catch {
      return ''
    }
  }

  return (
    <div className="animate-fade-in">
      {/* ─── Encabezado ──────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Correos</h1>
          <p>Bandeja de entrada — {unreadCount} no leídos</p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-secondary"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw size={14} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Gmail'}
          </button>
        </div>
      </div>

      {/* ─── Tabs de filtro ──────────────────────────── */}
      <div className="tabs">
        <button
          ref={el => tabsRef.current[0] = el}
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({emails.length})
        </button>
        <button
          ref={el => tabsRef.current[1] = el}
          className={`tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          No leídos ({unreadCount})
        </button>
        <div
          className="tab-indicator"
          style={{
            position: 'absolute',
            bottom: '-2px',
            height: '2px',
            backgroundColor: 'var(--color-primary)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            left: indicatorStyle.left,
            width: indicatorStyle.width
          }}
        />
      </div>

      {/* ─── Lista de correos ────────────────────────── */}
      <div className="card">
        {filteredEmails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📬</div>
            <div className="empty-state-title">
              {filter === 'unread' ? 'No hay correos sin leer' : 'Bandeja vacía'}
            </div>
            <div className="empty-state-text">
              {emails.length === 0
                ? 'Conecta tu cuenta de Google y sincroniza para ver tus correos aquí.'
                : 'Todos los correos han sido leídos. ¡Bien hecho!'}
            </div>
            {emails.length === 0 && (
              <button className="btn btn-primary" onClick={handleSync}>
                <RefreshCw size={14} />
                Sincronizar
              </button>
            )}
          </div>
        ) : (
          <div className="email-list">
            {filteredEmails.map(email => (
              <div
                key={email.id}
                className={`email-item ${!email.isRead ? 'unread' : ''}`}
                onClick={() => setSelectedEmail(
                  selectedEmail?.id === email.id ? null : email
                )}
              >
                {/* Punto de no leído */}
                {!email.isRead && <div className="email-unread-dot" />}

                {/* Avatar */}
                <div
                  className="email-avatar"
                  style={{ background: getAvatarColor(email.senderName) }}
                >
                  {email.senderName.charAt(0).toUpperCase()}
                </div>

                {/* Contenido */}
                <div className="email-content">
                  <div className="email-header">
                    <span className="email-sender">{email.senderName}</span>
                    <span className="email-time">{formatEmailDate(email.receivedAt)}</span>
                  </div>
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-snippet">
                    {selectedEmail?.id === email.id
                      ? email.bodyPreview || email.snippet
                      : email.snippet}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
