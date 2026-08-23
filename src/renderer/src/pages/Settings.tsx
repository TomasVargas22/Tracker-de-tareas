/**
 * Settings.tsx — Página de configuración
 * 
 * Permite configurar:
 * - Conexión con Google (Calendar + Gmail)
 * - Tiempo de recordatorio por defecto
 * - Intervalo de sincronización
 * - Cantidad de correos a cargar
 */
import React, { useState, useEffect } from 'react'
import { LogIn, LogOut, Check, AlertCircle, Clock, RefreshCw, Mail } from 'lucide-react'

export default function Settings() {
  // Estado de autenticación con Google
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  // Configuraciones
  const [reminderDefault, setReminderDefault] = useState('15')
  const [syncInterval, setSyncInterval] = useState('5')
  const [emailsToFetch, setEmailsToFetch] = useState('50')
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  /**
   * Cargar configuración actual al montar
   */
  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const [googleAuth, reminder, sync, emails] = await Promise.all([
        window.api.isGoogleAuthenticated(),
        window.api.getSetting('reminder_default_minutes'),
        window.api.getSetting('sync_interval_minutes'),
        window.api.getSetting('emails_to_fetch')
      ])

      setIsGoogleConnected(googleAuth)
      if (reminder) setReminderDefault(reminder)
      if (sync) setSyncInterval(sync)
      if (emails) setEmailsToFetch(emails)
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    }
  }

  /**
   * Conectar con Google (inicia flujo OAuth2)
   */
  async function handleGoogleLogin() {
    setConnectingGoogle(true)
    try {
      const success = await window.api.googleLogin()
      setIsGoogleConnected(success)
      if (success) {
        showSaved('✅ ¡Conectado con Google exitosamente!')
      }
    } catch (error: any) {
      console.error('Error al conectar con Google:', error)
      showSaved('❌ Error: ' + (error.message || 'No se pudo conectar'))
    } finally {
      setConnectingGoogle(false)
    }
  }

  /**
   * Desconectar de Google
   */
  async function handleGoogleLogout() {
    try {
      await window.api.googleLogout()
      setIsGoogleConnected(false)
      showSaved('Sesión de Google cerrada')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  /**
   * Guardar una configuración en la base de datos
   */
  async function saveSetting(key: string, value: string) {
    setSaving(true)
    try {
      await window.api.setSetting(key, value)
      showSaved('Configuración guardada ✓')
    } catch (error) {
      console.error('Error al guardar:', error)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Mostrar mensaje temporal de guardado
   */
  function showSaved(message: string) {
    setSavedMessage(message)
    setTimeout(() => setSavedMessage(''), 3000)
  }

  return (
    <div className="animate-fade-in">
      {/* ─── Encabezado ──────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Configuración</h1>
          <p>Personaliza tu experiencia en el CRM</p>
        </div>
        {savedMessage && (
          <div className="page-header-right">
            <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: 'var(--font-size-sm)' }}>
              {savedMessage}
            </span>
          </div>
        )}
      </div>

      {/* ─── Integración con Google ──────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="settings-section">
          <h3 className="settings-section-title">🔗 Integración con Google</h3>

          <div className="settings-row">
            <div>
              <div className="settings-row-label flex items-center gap-2">
                {isGoogleConnected ? (
                  <>
                    <Check size={16} style={{ color: 'var(--color-success)' }} />
                    Conectado con Google
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    No conectado
                  </>
                )}
              </div>
              <div className="settings-row-desc">
                {isGoogleConnected
                  ? 'Google Calendar y Gmail están sincronizados.'
                  : 'Conecta tu cuenta para sincronizar calendario y correos.'}
              </div>
            </div>
            <div>
              {isGoogleConnected ? (
                <button className="btn btn-danger btn-sm" onClick={handleGoogleLogout}>
                  <LogOut size={14} />
                  Desconectar
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleGoogleLogin}
                  disabled={connectingGoogle}
                >
                  <LogIn size={14} />
                  {connectingGoogle ? 'Conectando...' : 'Conectar Google'}
                </button>
              )}
            </div>
          </div>

          {!isGoogleConnected && (
            <div style={{
              background: 'var(--color-bg-input)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginTop: 'var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7
            }}>
              <strong>Instrucciones para conectar Google:</strong>
              <ol style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-5)' }}>
                <li>Ve a <strong>Google Cloud Console</strong> (console.cloud.google.com)</li>
                <li>Crea un proyecto y habilita <em>Google Calendar API</em> y <em>Gmail API</em></li>
                <li>Crea credenciales OAuth2 tipo &quot;Aplicación de escritorio&quot;</li>
                <li>Descarga el archivo JSON y renómbralo a <code>google-credentials.json</code></li>
                <li>Colócalo en la carpeta de datos de la app (se muestra en la consola al iniciar)</li>
                <li>Haz clic en &quot;Conectar Google&quot; arriba</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* ─── Recordatorios ───────────────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="settings-section">
          <h3 className="settings-section-title">⏰ Recordatorios</h3>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Tiempo de recordatorio por defecto</div>
              <div className="settings-row-desc">
                Cuánto tiempo antes de una tarea/evento se muestra la notificación
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={reminderDefault}
                onChange={e => {
                  setReminderDefault(e.target.value)
                  saveSetting('reminder_default_minutes', e.target.value)
                }}
              >
                <option value="5">5 minutos</option>
                <option value="10">10 minutos</option>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sincronización ──────────────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="settings-section">
          <h3 className="settings-section-title">🔄 Sincronización</h3>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Intervalo de sincronización</div>
              <div className="settings-row-desc">
                Cada cuánto tiempo se actualizan los datos de Google
              </div>
            </div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={syncInterval}
              onChange={e => {
                setSyncInterval(e.target.value)
                saveSetting('sync_interval_minutes', e.target.value)
              }}
            >
              <option value="1">Cada 1 minuto</option>
              <option value="5">Cada 5 minutos</option>
              <option value="15">Cada 15 minutos</option>
              <option value="30">Cada 30 minutos</option>
            </select>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-row-label">Correos a cargar</div>
              <div className="settings-row-desc">
                Cantidad máxima de correos que se descargan en cada sincronización
              </div>
            </div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={emailsToFetch}
              onChange={e => {
                setEmailsToFetch(e.target.value)
                saveSetting('emails_to_fetch', e.target.value)
              }}
            >
              <option value="20">20 correos</option>
              <option value="50">50 correos</option>
              <option value="100">100 correos</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Acerca de ───────────────────────────────── */}
      <div className="card">
        <div className="settings-section">
          <h3 className="settings-section-title">ℹ️ Acerca de</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
            <p><strong>CRM Personal</strong> v1.0.0</p>
            <p>Aplicación de escritorio para organizar tu día a día.</p>
            <p>Construido con Electron + React + TypeScript + SQLite</p>
          </div>
        </div>
      </div>
    </div>
  )
}
