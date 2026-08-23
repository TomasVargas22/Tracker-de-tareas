# CRM Personal — Aplicación de Escritorio

> Centraliza tu día a día: calendario, correos, tareas y herramientas en un solo lugar.

Aplicación de escritorio construida con **Electron + React + TypeScript + SQLite**, diseñada con un estilo visual inspirado en Blomstra CRM.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** v18 o superior ([descargar](https://nodejs.org/))
- **npm** (incluido con Node.js)
- **Git** (opcional, para clonar el proyecto)

### Instalación

```bash
# 1. Navegar al directorio del proyecto
cd "Proyecto 1"

# 2. Instalar dependencias
npm install

# 3. Iniciar en modo desarrollo
npm run dev
```

La aplicación se abrirá automáticamente. En modo desarrollo, los cambios en el código se reflejan al instante (HMR).

---

## 📁 Estructura del Proyecto

```
src/
├── main/                    # Proceso principal de Electron (Node.js)
│   ├── index.ts             # Entry point — crea ventana, inicia servicios
│   ├── database.ts          # Conexión SQLite + migraciones
│   ├── repositories.ts      # Operaciones CRUD (tareas, eventos, correos...)
│   ├── ipc-handlers.ts      # Puente de comunicación con React
│   ├── notifications.ts     # Notificaciones nativas + recordatorios
│   └── google-services.ts   # OAuth2 + Google Calendar + Gmail
├── preload/
│   └── index.ts             # Puente seguro entre main y renderer
└── renderer/                # Interfaz de usuario (React)
    ├── index.html
    └── src/
        ├── main.tsx          # Entry point React
        ├── App.tsx           # Componente raíz con navegación
        ├── types.ts          # Interfaces TypeScript
        ├── styles/
        │   └── index.css     # Design system completo
        ├── components/
        │   ├── Sidebar.tsx   # Barra lateral de navegación
        │   ├── KPICard.tsx   # Tarjeta de métrica
        │   ├── TaskItem.tsx  # Elemento de tarea
        │   └── TaskForm.tsx  # Formulario crear/editar tarea
        └── pages/
            ├── Dashboard.tsx # Panel principal con resumen del día
            ├── Tasks.tsx     # Gestión completa de tareas
            ├── Calendar.tsx  # Vista de calendario mensual
            ├── Inbox.tsx     # Bandeja de correo (Gmail)
            ├── Shortcuts.tsx # Accesos directos personalizables
            └── Settings.tsx  # Configuración y conexión Google
```

---

## 🔗 Configurar Google Calendar y Gmail

Para sincronizar tu calendario y correos necesitas crear credenciales OAuth2:

### Paso 1: Crear proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en **"Seleccionar un proyecto"** → **"Nuevo Proyecto"**
3. Nombre: `CRM Personal` (o el que prefieras)
4. Haz clic en **"Crear"**

### Paso 2: Habilitar APIs

1. En el menú lateral: **APIs y servicios** → **Biblioteca**
2. Busca y habilita:
   - **Google Calendar API**
   - **Gmail API**

### Paso 3: Configurar pantalla de consentimiento

1. **APIs y servicios** → **Pantalla de consentimiento OAuth**
2. Tipo de usuario: **Externo**
3. Nombre de la app: `CRM Personal`
4. Correo de soporte: tu email
5. En **Scopes**, agrega:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/gmail.readonly`
6. En **Usuarios de prueba**, agrega tu email de Google

### Paso 4: Crear credenciales

1. **APIs y servicios** → **Credenciales**
2. **Crear credenciales** → **ID de cliente OAuth**
3. Tipo de aplicación: **Aplicación de escritorio**
4. Nombre: `CRM Personal Desktop`
5. **Descargar JSON**
6. Renombrar el archivo descargado a `google-credentials.json`
7. Colocarlo en la carpeta de datos de la app:
   - La ruta se muestra en la consola al iniciar la app
   - Típicamente: `C:\Users\TU_USUARIO\AppData\Roaming\crm-personal\`

### Paso 5: Conectar desde la app

1. Abre la app → ve a **Configuración**
2. Haz clic en **"Conectar Google"**
3. Se abrirá tu navegador para autorizar la app
4. ¡Listo! Tus eventos y correos se sincronizarán automáticamente

---

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia la app en modo desarrollo (con HMR) |
| `npm run build` | Compila la app para producción |
| `npm run preview` | Previsualiza la build de producción |

---

## 🗄️ Base de Datos

La app usa **SQLite** para almacenar datos localmente. La base de datos se crea automáticamente en:

```
Windows: C:\Users\TU_USUARIO\AppData\Roaming\crm-personal\database.db
macOS:   ~/Library/Application Support/crm-personal/database.db
Linux:   ~/.config/crm-personal/database.db
```

### Tablas principales:

| Tabla | Contenido |
|-------|-----------|
| `tasks` | Tareas con título, fecha, hora, prioridad, estado |
| `events` | Cache de eventos de Google Calendar |
| `emails` | Cache de correos de Gmail |
| `shortcuts` | Accesos directos del usuario |
| `reminders` | Recordatorios programados |
| `settings` | Configuración de la app |

---

## 🛠️ Stack Técnico

- **Electron** v33 — Runtime de escritorio
- **React** v18 — Interfaz de usuario
- **TypeScript** v5 — Tipado estático
- **better-sqlite3** — Base de datos local
- **googleapis** — SDK oficial de Google
- **electron-vite** — Build tool
- **Lucide React** — Iconos
- **date-fns** — Manejo de fechas
- **Recharts** — Gráficos (dashboard)

---

## 📝 Notas para Desarrolladores

### Cómo funciona la comunicación Main ↔ Renderer

```
React (renderer)
    ↓ window.api.createTask(data)
Preload (puente)
    ↓ ipcRenderer.invoke('tasks:create', data)
Main Process
    ↓ ipcMain.handle('tasks:create', handler)
Repositorio
    ↓ INSERT INTO tasks ...
SQLite
```

### Agregar una nueva función

1. **Definir la interfaz** en `types.ts`
2. **Crear el handler** en `ipc-handlers.ts`
3. **Exponer en el preload** en `preload/index.ts`
4. **Crear el componente** React en `components/` o `pages/`

---

*Construido con ❤️ como proyecto de aprendizaje*
