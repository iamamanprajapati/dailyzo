import { useEffect, useState } from 'react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr, dateTime, statusColor } from '../utils/format';

export default function Transactions() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    api.get('/admin/transactions').then(({ data }) => setList(data.transactions)).finally(() => setLoading(false));
  }, []);

  const filtered = list.filter((t) =>
    (method === 'all' || t.method === method) &&
    (status === 'all' || t.status === status),
  );

  const totalPaid = filtered.filter((t) => t.status === 'success').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-8">
      <PageHeader title="Transactions" subtitle={`${filtered.length} entries · ${inr(totalPaid)} settled`} />

      <div className="card p-4 mb-4 flex gap-3 flex-wrap">
        <div>
          <label className="text-xs text-slate-500 mr-2">Method:</label>
          <select className="input inline-block w-auto py-1" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">All</option>
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="razorpay">Razorpay</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 mr-2">Status:</label>
          <select className="input inline-block w-auto py-1" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="table-base">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Gateway Ref</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50">
                  <td className="text-xs text-slate-500">{dateTime(t.createdAt)}</td>
                  <td>
                    <div className="text-sm">{t.user?.name || '—'}</div>
                    <div className="text-xs text-slate-500">{t.user?.email}</div>
                  </td>
                  <td className="font-mono text-xs">{t.order?.orderNumber || '—'}</td>
                  <td className="uppercase text-xs">{t.method}</td>
                  <td className="font-semibold">{inr(t.amount)}</td>
                  <td><span className={`badge ${statusColor(t.status === 'success' ? 'paid' : t.status)}`}>{t.status}</span></td>
                  <td className="text-xs font-mono text-slate-400">{t.gatewayPaymentId || t.gatewayOrderId || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-500 py-8">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
