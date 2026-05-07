import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/auth';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import DeliveryPartners from './pages/DeliveryPartners';
import LiveMap from './pages/LiveMap';
import Customers from './pages/Customers';
import Coupons from './pages/Coupons';
import Transactions from './pages/Transactions';

function Protected({ children }) {
  const user = useAuth((s) => s.user);
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="categories" element={<Categories />} />
        <Route path="delivery" element={<DeliveryPartners />} />
        <Route path="live-map" element={<LiveMap />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
