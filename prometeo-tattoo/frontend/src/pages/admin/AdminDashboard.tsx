import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { adminService, AdminStats } from '../../services/adminService'
import { formatPrice, formatPriceShort } from '../../utils/formatPrice'

const PIE_COLORS = ['#c62828', '#d4a24e', '#4a90d9', '#3d9970', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c', '#2ecc71', '#3498db']
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  SHIPPED: 'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
}

function StatCard({ label, value, growth, icon }: { label: string; value: string; growth?: number; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-accent/10 rounded-lg text-accent">{icon}</div>
        {growth !== undefined && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${growth >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {growth >= 0 ? '+' : ''}{growth}%
          </span>
        )}
      </div>
      <p className="font-mono text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Dashboard — Admin'
    adminService.getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-72 bg-white/5 rounded-lg" />
          <div className="h-72 bg-white/5 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm text-red-400">
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      {error}
    </div>
  )
  if (!stats) return null

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl tracking-widest text-white">DASHBOARD</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos totales"
          value={formatPrice(stats.totalRevenue)}
          growth={stats.revenueGrowth}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>}
        />
        <StatCard
          label="Total órdenes"
          value={stats.totalOrders.toString()}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Ticket promedio"
          value={formatPrice(stats.averageOrderValue)}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>}
        />
        <StatCard
          label="Clientes"
          value={stats.totalCustomers.toString()}
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly sales bar chart */}
        <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-5">Ventas mensuales (12 meses)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.monthlySales} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatPriceShort} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111114', border: '1px solid #ffffff10', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#ffffff80' }}
                formatter={(v: unknown) => [formatPrice(v as number), 'Ingresos']}
              />
              <Bar dataKey="revenue" fill="#c62828" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-5">Ventas por categoría</h2>
          {stats.salesByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-white/20 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.salesByCategory} dataKey="revenue" nameKey="category" cx="40%" cy="50%" outerRadius={90} innerRadius={55}>
                  {stats.salesByCategory.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value: unknown) => {
                    const label = value as string
                    const item = stats.salesByCategory.find(c => c.category === label)
                    return <span style={{ color: '#ffffff70', fontSize: 11 }}>{label} {item ? `${item.percentage}%` : ''}</span>
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111114', border: '1px solid #ffffff10', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: unknown) => [formatPrice(v as number), 'Ingresos']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily sales area chart */}
      <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white/70 mb-5">Tendencia últimos 30 días</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.dailySales} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c62828" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c62828" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#ffffff30', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.slice(5)} interval={4} />
            <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatPriceShort} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111114', border: '1px solid #ffffff10', borderRadius: 6, fontSize: 12 }}
              formatter={(v: unknown) => [formatPrice(v as number), 'Ingresos']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#c62828" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">Top 10 productos</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/30 border-b border-white/5">
                <th className="pb-2 text-left font-normal">#</th>
                <th className="pb-2 text-left font-normal">Producto</th>
                <th className="pb-2 text-right font-normal">Vendidos</th>
                <th className="pb-2 text-right font-normal">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.slice(0, 10).map((p, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-2 text-white/30 font-mono">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </td>
                  <td className="py-2">
                    <p className="text-white/80 truncate max-w-[140px]">{p.name}</p>
                    <p className="text-white/30">{p.category}</p>
                  </td>
                  <td className="py-2 text-right font-mono text-white/60">{p.totalSold}</td>
                  <td className="py-2 text-right font-mono text-accent">{formatPrice(p.revenue)}</td>
                </tr>
              ))}
              {stats.topProducts.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-white/20">Sin datos de ventas</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Low stock + Recent orders */}
        <div className="space-y-6">
          {/* Low stock */}
          <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">Stock bajo</h2>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-white/20 text-xs py-2">Sin productos con stock bajo</p>
            ) : (
              <div className="space-y-2">
                {stats.lowStockProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-white/60 truncate flex-1 mr-3">{p.name}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${p.stock === 0 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {p.stock === 0 ? 'CRÍTICO' : `${p.stock} ud.`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">Órdenes recientes</h2>
            <div className="space-y-2">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-1">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-xs text-white/60 truncate">{order.user.name}</p>
                    <p className="text-xs text-white/30">{new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded mr-2 ${STATUS_COLORS[order.status] || 'bg-white/10 text-white/40'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="text-xs font-mono text-accent">{formatPrice(order.total)}</span>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <p className="text-white/20 text-xs py-2">Sin órdenes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
