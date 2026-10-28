import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import { useAuth } from '../../hooks/useAuth'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Tatuajes', to: '/tatuajes' },
  { label: 'Contacto', to: '/contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const { logout } = useAuth()
  const { itemCount, toggleCart } = useCartStore((s) => ({
    itemCount: s.cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    toggleCart: s.toggleCart,
  }))

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    closeMenu()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="font-display text-2xl tracking-widest hover:text-accent transition-colors"
          >
            <span className="text-accent">PROMETEO</span>
            <span className="text-[#e8e8e8] ml-2">TATTOO</span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-body transition-colors ${
                  location.pathname === link.to
                    ? 'text-accent'
                    : 'text-[#e8e8e8]/60 hover:text-[#e8e8e8]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`text-sm font-body transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'text-accent'
                    : 'text-[#e8e8e8]/60 hover:text-[#e8e8e8]'
                }`}
              >
                Panel Admin
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-[#e8e8e8]/60 hover:text-[#e8e8e8] transition-colors"
              aria-label="Carrito"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Auth — desktop */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="text-sm font-body text-[#e8e8e8]/70 hover:text-[#e8e8e8] transition-colors"
                >
                  {user?.name.split(' ')[0]}
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-muted hover:text-[#e8e8e8] transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center px-4 py-2 bg-accent text-white text-sm font-body font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Iniciar sesión
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-[#e8e8e8]/60 hover:text-[#e8e8e8] transition-colors"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden bg-surface border-t border-white/5 px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={`block py-3 text-sm font-body border-b border-white/5 transition-colors ${
                location.pathname === link.to
                  ? 'text-accent'
                  : 'text-[#e8e8e8]/70 hover:text-[#e8e8e8]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={closeMenu}
              className={`block py-3 text-sm font-body border-b border-white/5 transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'text-accent'
                  : 'text-[#e8e8e8]/70 hover:text-[#e8e8e8]'
              }`}
            >
              Panel Admin
            </Link>
          )}

          <div className="pt-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between py-2">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="text-sm font-body text-[#e8e8e8]/70 hover:text-[#e8e8e8] transition-colors"
                >
                  {user?.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs text-muted hover:text-[#e8e8e8] transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full text-center px-4 py-2 bg-accent text-white text-sm font-body font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="w-full text-center px-4 py-2 border border-border text-[#e8e8e8]/70 text-sm font-body rounded-md hover:text-[#e8e8e8] hover:border-[#e8e8e8]/40 transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
