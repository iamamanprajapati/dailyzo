import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { getSocket } from '../api/socket';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr, dateTime, statusColor } from '../utils/format';
import OrderDrawer from './OrderDrawer';

const STATUS_FILTERS = [
  'all', 'pending', 'confirmed', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled',
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      if (q) params.q = q;
      const { data } = await api.get('/orders/admin', { params });
      setOrders(data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [status]);

  useEffect(() => {
    const socket = getSocket();
    const onNew = () => { toast.success('New order placed!'); load(); };
    const onStatus = () => load();
    socket.on('order:new', onNew);
    socket.on('order:status', onStatus);
    socket.on('order:paid', onStatus);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:status', onStatus);
      socket.off('order:paid', onStatus);
    };
    // eslint-disable-next-line
  }, []);

  const counts = useMemo(() => {
    const map = { all: orders.length };
    orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    return map;
  }, [orders]);

  return (
    <div className="p-8">
      <PageHeader
        title="Orders"
        subtitle="Manage every order from placement to delivery"
        actions={
          <button className="btn-secondary" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === s
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.replace(/_/g, ' ')} {counts[s] !== undefined && `(${counts[s]})`}
          </button>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search by order number…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(o._id)}>
                  <td className="font-mono text-xs font-semibold text-slate-900">{o.orderNumber}</td>
                  <td>
                    <div className="text-slate-900">{o.user?.name}</div>
                    <div className="text-xs text-slate-500">{o.user?.phone || o.user?.email}</div>
                  </td>
                  <td className="text-slate-600">{o.items.length} item(s)</td>
                  <td className="font-semibold">{inr(o.total)}</td>
                  <td>
                    <span className={`badge ${statusColor(o.paymentStatus)}`}>{o.paymentStatus}</span>
                    <div className="text-xs text-slate-500 mt-0.5">{o.paymentMethod.toUpperCase()}</div>
                  </td>
                  <td><span className={`badge ${statusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span></td>
                  <td className="text-xs text-slate-500">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 py-8">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selected && <OrderDrawer orderId={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </div>
  );
}
