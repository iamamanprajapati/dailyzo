import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Save } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr } from '../utils/format';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [edits, setEdits] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { q, limit: 200 } });
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const saveStock = async (id) => {
    const value = edits[id];
    if (value === undefined) return;
    try {
      await api.patch(`/products/${id}/stock`, { set: Number(value) });
      toast.success('Stock updated');
      setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const adjust = async (id, delta) => {
    try {
      await api.patch(`/products/${id}/stock`, { delta });
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="p-8">
      <PageHeader title="Inventory" subtitle="Track and adjust stock across all products" />

      <div className="card p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th>Set / Adjust</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs font-mono text-slate-500">{p.sku}</td>
                  <td>{inr(p.price)}</td>
                  <td>
                    <span className={`badge ${p.stock <= 5 ? 'bg-red-100 text-red-700' : p.stock <= 20 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost px-2 py-1 border border-slate-200" onClick={() => adjust(p._id, -1)}>−1</button>
                      <input
                        type="number"
                        className="input w-20 py-1"
                        value={edits[p._id] ?? p.stock}
                        onChange={(e) => setEdits((s) => ({ ...s, [p._id]: e.target.value }))}
                      />
                      <button className="btn-ghost px-2 py-1 border border-slate-200" onClick={() => adjust(p._id, +1)}>+1</button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-secondary text-xs"
                      disabled={edits[p._id] === undefined || Number(edits[p._id]) === p.stock}
                      onClick={() => saveStock(p._id)}
                    >
                      <Save size={12} /> Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
