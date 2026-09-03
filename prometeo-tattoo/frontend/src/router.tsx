import { createBrowserRouter } from 'react-router-dom'
import PageWrapper from './components/layout/PageWrapper'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import CheckoutFailure from './pages/CheckoutFailure'
import CheckoutPending from './pages/CheckoutPending'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Contact from './pages/Contact'
import ComingSoon from './pages/ComingSoon'
import NotFound from './pages/NotFound'
import AdminRoute from './components/auth/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProductList from './pages/admin/AdminProductList'
import AdminProductForm from './pages/admin/AdminProductForm'
import AdminCategoryList from './pages/admin/AdminCategoryList'
import AdminOrderList from './pages/admin/AdminOrderList'
import AdminPOS from './pages/admin/AdminPOS'
import AdminExpenses from './pages/admin/AdminExpenses'
import AdminSettings from './pages/admin/AdminSettings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageWrapper />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop', element: <Shop /> },
      { path: 'product/:slug', element: <ProductDetail /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'checkout/success', element: <CheckoutSuccess /> },
      { path: 'checkout/failure', element: <CheckoutFailure /> },
      { path: 'checkout/pending', element: <CheckoutPending /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile', element: <Profile /> },
      { path: 'contact', element: <Contact /> },
      { path: 'about', element: <ComingSoon /> },
      { path: 'terms', element: <ComingSoon /> },
      { path: 'privacy', element: <ComingSoon /> },
      { path: 'faq', element: <ComingSoon /> },
      { path: 'shipping', element: <ComingSoon /> },
      { path: 'returns', element: <ComingSoon /> },
      { path: 'warranty', element: <ComingSoon /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <AdminProductList /> },
      { path: 'products/new', element: <AdminProductForm /> },
      { path: 'products/:id/edit', element: <AdminProductForm /> },
      { path: 'categories', element: <AdminCategoryList /> },
      { path: 'orders', element: <AdminOrderList /> },
      { path: 'pos', element: <AdminPOS /> },
      { path: 'expenses', element: <AdminExpenses /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
])
