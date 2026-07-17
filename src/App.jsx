// ========== Ada Fashion — App Router ==========
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

// Store pages
import Home from './pages/store/Home';
import Products from './pages/store/Products';
import ProductDetail from './pages/store/ProductDetail';
import Cart from './pages/store/Cart';
import NewsPage from './pages/store/NewsPage';
import Register from './pages/store/Register';
import CustomerLogin from './pages/store/CustomerLogin';
import ZonaBideras from './pages/store/ZonaBideras';

// Admin pages
import Login from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Stock from './pages/admin/Stock';
import Purchases from './pages/admin/Purchases';
import Sales from './pages/admin/Sales';
import Reservations from './pages/admin/Reservations';
import Finances from './pages/admin/Finances';
import Settings from './pages/admin/Settings';
import { getLoggedUser, hasAccess, isAuthenticated } from './lib/auth';
import { Navigate } from 'react-router-dom';
import GlobalToast from './components/ui/Toast';

const ProtectedRoute = ({ element, allowedRoles }) => {
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;
  const allowed = hasAccess(allowedRoles);
  if (!allowed) return <Navigate to="/admin" replace />;
  return element;
};

function App() {
  useEffect(() => {
    try {
      const legacyKeys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('modare_db_')) {
          legacyKeys.push(key);
        }
      }
      legacyKeys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear legacy localStorage data', error);
    }
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Store / Vitrine */}
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/produto/:id" element={<ProductDetail />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/novidades" element={<NewsPage />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/zona-bideras" element={<ZonaBideras />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<ProtectedRoute element={<Dashboard />} allowedRoles={['Admin', 'Gerente', 'Vendedor', 'Visualizador']} />} />
            <Route path="controle-estoque" element={<ProtectedRoute element={<Stock />} allowedRoles={['Admin', 'Gerente', 'Visualizador']} />} />
            <Route path="compras" element={<ProtectedRoute element={<Purchases />} allowedRoles={['Admin', 'Gerente', 'Visualizador']} />} />
            <Route path="vendas" element={<ProtectedRoute element={<Sales />} allowedRoles={['Admin', 'Gerente', 'Vendedor', 'Visualizador']} />} />
            <Route path="reservas" element={<ProtectedRoute element={<Reservations />} allowedRoles={['Admin', 'Gerente', 'Vendedor', 'Visualizador']} />} />
            <Route path="financas" element={<ProtectedRoute element={<Finances />} allowedRoles={['Admin', 'Gerente', 'Visualizador']} />} />
            <Route path="configuracoes" element={<ProtectedRoute element={<Settings />} allowedRoles={['Admin']} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <GlobalToast />
    </>
  );
}

export default App;
