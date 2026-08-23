/**
 * KPICard.tsx — Tarjeta de indicador clave (KPI)
 * 
 * Muestra una métrica importante en el dashboard:
 * - Icono con fondo de color
 * - Etiqueta descriptiva
 * - Valor numérico grande
 * - Cambio respecto al periodo anterior (opcional)
 */
import React from 'react'

interface KPICardProps {
  /** Etiqueta descriptiva (ej: "Tareas Pendientes") */
  label: string
  /** Valor principal a mostrar (ej: "12" o "85%") */
  value: string | number
  /** Icono React (componente de Lucide) */
  icon: React.ReactNode
  /** Variante de color del icono */
  iconVariant?: 'primary' | 'success' | 'warning' | 'info'
  /** Texto de cambio (ej: "+8.7% from last period") */
  changeText?: string
  /** Si el cambio es positivo o negativo */
  changePositive?: boolean
}

export default function KPICard({
  label,
  value,
  icon,
  iconVariant = 'primary',
  changeText,
  changePositive = true
}: KPICardProps) {
  return (
    <div className="kpi-card">
      {/* Cabecera: Etiqueta y Icono */}
      <div className="kpi-card-header">
        <div className="kpi-card-label">{label}</div>
        <div className={`kpi-card-icon ${iconVariant}`}>
          {icon}
        </div>
      </div>

      {/* Valor principal (masivo) */}
      <div className="kpi-card-value">{value}</div>

      {/* Indicador de cambio */}
      {changeText && (
        <div className={`kpi-card-change ${changePositive ? 'positive' : 'negative'}`}>
          <span>{changePositive ? '↑' : '↓'}</span>
          <span>{changeText}</span>
        </div>
      )}
    </div>
  )
}
