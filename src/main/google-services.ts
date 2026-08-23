/**
 * google-services.ts — Integración con Google (Calendar + Gmail)
 * 
 * Maneja:
 * 1. Autenticación OAuth2 con Google
 * 2. Lectura de eventos de Google Calendar
 * 3. Lectura de correos de Gmail
 * 
 * REQUISITOS PREVIOS:
 * - Crear proyecto en Google Cloud Console
 * - Habilitar Google Calendar API y Gmail API
 * - Crear credenciales OAuth2 (tipo "Aplicación de escritorio")
 * - Guardar el archivo credentials.json en la carpeta de la app
 * 
 * Scopes necesarios:
 * - https://www.googleapis.com/auth/calendar.readonly
 * - https://www.googleapis.com/auth/gmail.readonly
 */
import { google } from 'googleapis'
import { app, shell, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import http from 'http'
import { URL } from 'url'

// ================================================================
// CONFIGURACIÓN
// ================================================================

// Scopes que necesitamos de Google (solo lectura para el MVP)
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly'
]

// Archivos de credenciales y tokens
const CREDENTIALS_FILENAME = 'google-credentials.json'
const TOKENS_FILENAME = 'google-tokens.json'

// Puerto local para capturar el callback de OAuth
const OAUTH_REDIRECT_PORT = 8089
const REDIRECT_URI = `http://localhost:${OAUTH_REDIRECT_PORT}/callback`

// Cliente OAuth2 (se inicializa al cargar credenciales)
let oauth2Client: any = null

// ================================================================
// HELPERS — Rutas de archivos
// ================================================================

/** Ruta al archivo de credenciales de Google */
function getCredentialsPath(): string {
  return path.join(app.getPath('userData'), CREDENTIALS_FILENAME)
}

/** Ruta al archivo donde se guardan los tokens de acceso */
function getTokensPath(): string {
  return path.join(app.getPath('userData'), TOKENS_FILENAME)
}

// ================================================================
// AUTENTICACIÓN OAuth2
// ================================================================

/**
 * Carga las credenciales de Google desde el archivo JSON.
 * Devuelve true si se cargaron correctamente.
 */
function loadCredentials(): boolean {
  const credPath = getCredentialsPath()

  if (!fs.existsSync(credPath)) {
    console.log('[Google] No se encontró archivo de credenciales en:', credPath)
    console.log('[Google] Coloca tu archivo google-credentials.json en esa ruta')
    return false
  }

  try {
    const content = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
    // El archivo puede tener la estructura { installed: { ... } } o { web: { ... } }
    const creds = content.installed || content.web || content

    oauth2Client = new google.auth.OAuth2(
      creds.client_id,
      creds.client_secret,
      REDIRECT_URI
    )

    // Intentar cargar tokens guardados previamente
    loadSavedTokens()

    console.log('[Google] Credenciales cargadas ✓')
    return true
  } catch (error) {
    console.error('[Google] Error al cargar credenciales:', error)
    return false
  }
}

/**
 * Carga tokens de acceso guardados de una sesión anterior.
 */
function loadSavedTokens(): void {
  const tokensPath = getTokensPath()

  if (fs.existsSync(tokensPath)) {
    try {
      const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'))
      oauth2Client.setCredentials(tokens)
      console.log('[Google] Tokens cargados de sesión anterior ✓')
    } catch {
      console.log('[Google] No se pudieron cargar tokens anteriores')
    }
  }
}

/**
 * Guarda los tokens de acceso para reutilizarlos en la próxima sesión.
 */
function saveTokens(tokens: any): void {
  const tokensPath = getTokensPath()
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2))
  console.log('[Google] Tokens guardados ✓')
}

/**
 * Inicia el flujo de autenticación OAuth2 con Google.
 * 
 * Proceso:
 * 1. Genera una URL de autorización
 * 2. Abre la URL en el navegador del usuario
 * 3. Inicia un servidor HTTP local para capturar el código de autorización
 * 4. Intercambia el código por tokens de acceso
 * 5. Guarda los tokens para futuro uso
 */
export async function googleLogin(): Promise<boolean> {
  // Cargar credenciales si no están cargadas
  if (!oauth2Client) {
    if (!loadCredentials()) {
      throw new Error(
        'No se encontraron credenciales de Google. ' +
        'Coloca el archivo google-credentials.json en: ' + getCredentialsPath()
      )
    }
  }

  return new Promise((resolve, reject) => {
    // Crear servidor HTTP temporal para capturar el callback
    const server = http.createServer(async (req, res) => {
      try {
        const urlObj = new URL(req.url || '', `http://localhost:${OAUTH_REDIRECT_PORT}`)

        if (urlObj.pathname === '/callback') {
          const code = urlObj.searchParams.get('code')
          const error = urlObj.searchParams.get('error')

          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end('<html><body><h2>❌ Autenticación cancelada</h2><p>Puedes cerrar esta pestaña.</p></body></html>')
            server.close()
            resolve(false)
            return
          }

          if (code) {
            // Intercambiar código por tokens
            const { tokens } = await oauth2Client.getToken(code)
            oauth2Client.setCredentials(tokens)
            saveTokens(tokens)

            // Configurar auto-refresh de tokens
            oauth2Client.on('tokens', (newTokens: any) => {
              const merged = { ...tokens, ...newTokens }
              oauth2Client.setCredentials(merged)
              saveTokens(merged)
            })

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(
              '<html><body style="font-family:Inter,sans-serif;text-align:center;padding:60px">' +
              '<h2>✅ ¡Conectado con Google!</h2>' +
              '<p>Puedes cerrar esta pestaña y volver a la aplicación.</p>' +
              '</body></html>'
            )
            server.close()
            resolve(true)
          }
        }
      } catch (err) {
        console.error('[Google] Error en callback OAuth:', err)
        res.writeHead(500)
        res.end('Error')
        server.close()
        reject(err)
      }
    })

    server.listen(OAUTH_REDIRECT_PORT, () => {
      // Generar URL de autorización
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Para obtener refresh_token
        scope: SCOPES,
        prompt: 'consent'       // Forzar pantalla de consentimiento
      })

      console.log('[Google] Abriendo navegador para autenticación...')
      shell.openExternal(authUrl)
    })

    // Timeout: cerrar servidor después de 5 minutos si no hay respuesta
    setTimeout(() => {
      server.close()
      resolve(false)
    }, 5 * 60 * 1000)
  })
}

/**
 * Cierra sesión de Google eliminando los tokens guardados.
 */
export async function googleLogout(): Promise<void> {
  const tokensPath = getTokensPath()
  if (fs.existsSync(tokensPath)) {
    fs.unlinkSync(tokensPath)
  }
  if (oauth2Client) {
    oauth2Client.revokeCredentials().catch(() => {})
    oauth2Client = null
  }
  console.log('[Google] Sesión cerrada ✓')
}

/**
 * Verifica si hay una sesión activa con Google.
 */
export async function isGoogleAuthenticated(): Promise<boolean> {
  if (!oauth2Client) {
    loadCredentials()
  }
  if (!oauth2Client) return false

  const creds = oauth2Client.credentials
  return !!(creds && (creds.access_token || creds.refresh_token))
}

// ================================================================
// GOOGLE CALENDAR — Lectura de eventos
// ================================================================

/**
 * Obtiene eventos de Google Calendar.
 * Por defecto obtiene los eventos del mes actual.
 * 
 * @param startDate - Fecha inicio en formato ISO
 * @param endDate - Fecha fin en formato ISO
 * @returns Array de eventos formateados para nuestra app
 */
export async function fetchGoogleCalendarEvents(
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  if (!oauth2Client || !oauth2Client.credentials?.access_token) {
    console.log('[Google Calendar] No autenticado')
    return []
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Fechas por defecto: desde hoy hasta 30 días adelante
    const timeMin = startDate || new Date().toISOString()
    const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: 100,
      singleEvents: true,     // Expandir eventos recurrentes
      orderBy: 'startTime'
    })

    const events = response.data.items || []

    // Mapear al formato de nuestra app
    return events.map(event => ({
      id: `google-${event.id}`,
      title: event.summary || 'Sin título',
      description: event.description || '',
      startDatetime: event.start?.dateTime || event.start?.date || '',
      endDatetime: event.end?.dateTime || event.end?.date || '',
      location: event.location || '',
      source: 'google' as const,
      sourceId: event.id || '',
      calendarId: 'primary',
      color: '#4F46E5' // Color por defecto; Google Calendar usa colorId
    }))
  } catch (error) {
    console.error('[Google Calendar] Error al obtener eventos:', error)
    return []
  }
}

// ================================================================
// GMAIL — Lectura de correos
// ================================================================

/**
 * Obtiene los correos más recientes de Gmail.
 * Solo lectura: bandeja de entrada, últimos N correos.
 * 
 * @param maxResults - Cantidad máxima de correos a obtener
 * @returns Array de correos formateados para nuestra app
 */
export async function fetchGmailMessages(maxResults = 30): Promise<any[]> {
  if (!oauth2Client || !oauth2Client.credentials?.access_token) {
    console.log('[Gmail] No autenticado')
    return []
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Paso 1: Obtener lista de IDs de mensajes
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX']
    })

    const messageIds = listResponse.data.messages || []

    // Paso 2: Obtener detalles de cada mensaje (en paralelo, max 10 a la vez)
    const emails: any[] = []
    const batchSize = 10

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize)
      const details = await Promise.all(
        batch.map(msg =>
          gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date']
          })
        )
      )

      for (const detail of details) {
        const headers = detail.data.payload?.headers || []
        const getHeader = (name: string) =>
          headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

        const fromRaw = getHeader('From')
        // Parsear "Nombre <email@example.com>" → nombre y email por separado
        const fromMatch = fromRaw.match(/^(.+?)\s*<(.+)>$/)

        emails.push({
          id: `gmail-${detail.data.id}`,
          subject: getHeader('Subject') || '(Sin asunto)',
          senderName: fromMatch ? fromMatch[1].replace(/"/g, '').trim() : fromRaw,
          senderEmail: fromMatch ? fromMatch[2] : fromRaw,
          snippet: detail.data.snippet || '',
          bodyPreview: detail.data.snippet || '',
          isRead: !detail.data.labelIds?.includes('UNREAD'),
          receivedAt: new Date(parseInt(detail.data.internalDate || '0')).toISOString(),
          source: 'gmail' as const,
          sourceId: detail.data.id || ''
        })
      }
    }

    return emails
  } catch (error) {
    console.error('[Gmail] Error al obtener correos:', error)
    return []
  }
}
