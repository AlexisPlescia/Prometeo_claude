import { useEffect, useState } from 'react'
import { adminService } from '../../services/adminService'

type Config = Record<string, string>

const SECTIONS = [
  {
    title: 'Datos de la tienda',
    fields: [
      { key: 'store_name', label: 'Nombre de la tienda' },
      { key: 'store_description', label: 'Descripción' },
      { key: 'store_email', label: 'Email de contacto' },
      { key: 'store_phone', label: 'Teléfono' },
      { key: 'store_address', label: 'Dirección' },
    ],
  },
  {
    title: 'Envío',
    fields: [
      { key: 'free_shipping_threshold', label: 'Umbral envío gratis (ARS)' },
      { key: 'shipping_cost', label: 'Costo de envío estándar (ARS)' },
    ],
  },
  {
    title: 'Redes sociales',
    fields: [
      { key: 'instagram_url', label: 'URL de Instagram' },
      { key: 'whatsapp_number', label: 'WhatsApp (ej: 5491112345678)' },
    ],
  },
  {
    title: 'Pagos (transferencia bancaria)',
    fields: [
      { key: 'payment_alias', label: 'Alias de transferencia (ej: prometeo.tattoo)' },
      { key: 'payment_cbu', label: 'CBU (opcional)' },
    ],
  },
  {
    title: 'Anuncios',
    fields: [
      { key: 'announcement_bar', label: 'Texto del anuncio superior (dejar vacío para ocultar)' },
    ],
  },
]

export default function AdminSettings() {
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Configuración — Admin'
    adminService.getConfig()
      .then((c) => { setConfig(c); setLoading(false) })
      .catch((err) => { setLoadError(err instanceof Error ? err.message : 'Error al cargar la configuración'); setLoading(false) })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    try {
      await adminService.updateConfig(config)
      setSuccess('Configuración guardada correctamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded" />)}</div>

  if (loadError) return (
    <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm text-red-400">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      {loadError}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl tracking-widest text-white">CONFIGURACIÓN</h1>

      {success && <div className="bg-green-900/20 border border-green-800/30 rounded px-4 py-3 text-sm text-green-400">{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-[#0d0d10] border border-white/5 rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider pb-2 border-b border-white/5">{section.title}</h2>
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-white/50 mb-1.5">{field.label}</label>
                <input
                  className="w-full bg-[#070709] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                  value={config[field.key] || ''}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        ))}

        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-accent text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  )
}
