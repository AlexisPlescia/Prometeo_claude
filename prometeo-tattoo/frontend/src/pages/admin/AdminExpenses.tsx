import { useEffect, useState } from 'react'
import { adminService, Expense } from '../../services/adminService'
import { formatPrice } from '../../utils/formatPrice'

const CATEGORY_SUGGESTIONS = ['Insumos', 'Alquiler', 'Servicios', 'Sueldos', 'Impuestos', 'Otro']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    adminService.getExpenses()
      .then(setExpenses)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar los gastos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { document.title = 'Gastos — Admin'; load() }, [])

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const amountNum = parseFloat(amount)
    if (!description.trim()) { setFormError('La descripción es requerida'); return }
    if (isNaN(amountNum) || amountNum <= 0) { setFormError('Ingresá un monto válido'); return }

    setSubmitting(true)
    try {
      const expense = await adminService.createExpense({
        description: description.trim(),
        amount: amountNum,
        category: category || undefined,
      })
      setExpenses((prev) => [expense, ...prev])
      setDescription('')
      setAmount('')
      setCategory('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el gasto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    setDeleting(id)
    try {
      await adminService.deleteExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-widest text-white">GASTOS</h1>
        <div className="text-right">
          <p className="text-xs text-white/40">Total registrado</p>
          <p className="font-mono text-lg text-accent">{formatPrice(total)}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={load} className="ml-auto text-xs text-red-400/70 hover:text-red-400 underline transition-colors">Reintentar</button>
        </div>
      )}

      {/* Alta de gasto */}
      <form onSubmit={handleSubmit} className="bg-[#0d0d10] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70">Nuevo gasto</h2>
        {formError && <div className="bg-red-900/20 border border-red-800/30 rounded px-4 py-2 text-sm text-red-400">{formError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Descripción *">
            <input className="input-admin" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Alquiler local" />
          </Field>
          <Field label="Monto ARS *">
            <input className="input-admin" type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Categoría">
            <input className="input-admin" list="expense-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Opcional" />
            <datalist id="expense-categories">
              {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
        </div>
        <button type="submit" disabled={submitting} className="px-6 py-2 bg-accent text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50">
          {submitting ? 'Guardando...' : 'Registrar gasto'}
        </button>
      </form>

      {/* Listado */}
      <div className="bg-[#0d0d10] border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr className="text-white/30 text-xs">
              <th className="px-4 py-3 text-left font-normal">Fecha</th>
              <th className="px-4 py-3 text-left font-normal">Descripción</th>
              <th className="px-4 py-3 text-left font-normal">Categoría</th>
              <th className="px-4 py-3 text-left font-normal">Cargado por</th>
              <th className="px-4 py-3 text-right font-normal">Monto</th>
              <th className="px-4 py-3 text-right font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded" /></td>)}
                </tr>
              ))
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-white/20">No hay gastos registrados</td></tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white/50 text-xs">{new Date(expense.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-white/80">{expense.description}</td>
                  <td className="px-4 py-3">
                    {expense.category && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/50">{expense.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{expense.createdBy.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent">{formatPrice(expense.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleting === expense.id}
                      className="text-xs px-2 py-1 bg-white/5 text-white/40 hover:bg-red-900/20 hover:text-red-400 rounded transition-colors disabled:opacity-50"
                    >
                      {deleting === expense.id ? '...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .input-admin {
          width: 100%;
          background: #070709;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 8px 12px;
          color: #e8e8e8;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-admin:focus { border-color: #c62828; }
      `}</style>
    </div>
  )
}
