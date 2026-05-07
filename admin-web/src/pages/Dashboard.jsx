import { useEffect, useState } from 'react';
import {
  ShoppingBag, IndianRupee, Users, Bike, Package, AlertTriangle, TrendingUp, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr } from '../utils/format';

const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#3b82f6', packed: '#6366f1', assigned: '#a855f7',
  out_for_delivery: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444', refunded: '#64748b',
};

function StatCard({ icon: Icon, label, value, trend, color = 'brand' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
          {trend && <div className="text-xs text-brand-600 mt-2 flex items-center gap-1"><TrendingUp size={12} />{trend}</div>}
        </div>
        <div className={`w-11 h-11 rounded-xl bg-${color}-100 flex items-center justify-center text-${color}-600`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!data) return <div className="p-8 text-slate-500">Failed to load dashboard.</div>;

  const { kpis, revenueSeries, statusBreakdown, topProducts, lowStock } = data;

  return (
    <div className="p-8">
      <PageHeader title="Dashboard" subtitle="A live view of your grocery store performance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IndianRupee} label="Today's Revenue" value={inr(kpis.todayRevenue)} trend={`${kpis.todayOrders} orders today`} color="brand" />
        <StatCard icon={ShoppingBag} label="Active Orders" value={kpis.activeOrders} trend={`${kpis.pendingOrders} pending`} color="amber" />
        <StatCard icon={Users} label="Customers" value={kpis.customers} color="blue" />
        <StatCard icon={Bike} label="Delivery Partners" value={kpis.deliveryPartners} color="purple" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IndianRupee} label="Last 30 days" value={inr(kpis.monthRevenue)} color="brand" />
        <StatCard icon={ShoppingBag} label="Orders This Week" value={kpis.weekOrders} color="indigo" />
        <StatCard icon={Package} label="Total Orders" value={kpis.totalOrders} color="slate" />
        <StatCard icon={IndianRupee} label="Lifetime Revenue" value={inr(kpis.totalRevenue)} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Revenue & Orders (last 30 days)</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries.map((r) => ({ date: r._id.slice(5), orders: r.orders, revenue: r.revenue }))}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(v, k) => (k === 'revenue' ? inr(v) : v)} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Order Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown.map((s) => ({ name: s._id, value: s.count }))} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {statusBreakdown.map((s) => (
                    <Cell key={s._id} fill={STATUS_COLORS[s._id] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 6).map((p) => (
              <div key={p._id} className="flex items-center gap-3">
                {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.unitsSold} sold · {inr(p.revenue)}</div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-slate-500">No sales yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {lowStock.map((p) => (
              <div key={p._id} className="flex items-center gap-3">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.unit}</div>
                </div>
                <span className="badge bg-red-100 text-red-700">{p.stock} left</span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-slate-500 flex items-center gap-2"><Clock size={14} /> All products healthy.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
