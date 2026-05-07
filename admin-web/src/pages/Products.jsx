import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr } from '../utils/format';
import ProductFormModal from './ProductFormModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { q, limit: 100, all: true } });
      setProducts(data.products);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Products"
        subtitle={`${products.length} products in catalog`}
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search products by name…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.unit} · {p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-600">{p.category?.name || '-'}</td>
                  <td>
                    <div className="font-semibold text-slate-900">{inr(p.price)}</div>
                    <div className="text-xs text-slate-400 line-through">{inr(p.mrp)}</div>
                  </td>
                  <td>
                    <span className={`badge ${p.stock <= 5 ? 'bg-red-100 text-red-700' : p.stock <= 20 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock} {p.stock <= 5 && '· Low'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 justify-end">
                      <button className="btn-ghost p-2" onClick={() => { setEditing(p); setShowForm(true); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-ghost p-2 text-red-600" onClick={() => onDelete(p._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-500 py-8">No products found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
