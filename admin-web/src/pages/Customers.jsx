import { useEffect, useState } from 'react';
import { Search, Phone, Mail } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { dateShort } from '../utils/format';

export default function Customers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/admin/customers').then(({ data }) => setList(data.customers)).finally(() => setLoading(false));
  }, []);

  const filtered = list.filter((c) =>
    !q ||
    c.name?.toLowerCase().includes(q.toLowerCase()) ||
    c.email?.toLowerCase().includes(q.toLowerCase()) ||
    c.phone?.includes(q),
  );

  return (
    <div className="p-8">
      <PageHeader title="Customers" subtitle={`${list.length} registered customers`} />

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Addresses</th>
                <th>Wallet</th>
                <th>Joined</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
                        {c.name?.[0]}
                      </div>
                      <div className="font-medium">{c.name}</div>
                    </div>
                  </td>
                  <td>
                    {c.phone && <div className="text-xs flex items-center gap-1 text-slate-700"><Phone size={12} /> {c.phone}</div>}
                    {c.email && <div className="text-xs flex items-center gap-1 text-slate-500"><Mail size={12} /> {c.email}</div>}
                  </td>
                  <td className="text-sm text-slate-600">{c.addresses?.length || 0}</td>
                  <td>₹{c.walletBalance || 0}</td>
                  <td className="text-xs text-slate-500">{dateShort(c.createdAt)}</td>
                  <td className="text-xs text-slate-500">{dateShort(c.lastLoginAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-500 py-8">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
