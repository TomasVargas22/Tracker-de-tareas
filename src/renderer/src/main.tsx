/**
 * main.tsx — Punto de entrada del proceso de renderizado (React)
 * 
 * Monta la aplicación React en el elemento #root del HTML.
 * Importa los estilos globales del design system.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Montar la aplicación en el DOM
const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
