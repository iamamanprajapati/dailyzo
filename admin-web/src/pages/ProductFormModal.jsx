import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '../api/client';

const empty = {
  name: '', brand: '', description: '', images: [''],
  category: '', price: '', mrp: '', stock: '', unit: '1 pc',
  isVeg: true, isOrganic: false, isBestseller: false, isFeatured: false, isActive: true,
};

export default function ProductFormModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        category: product.category?._id || product.category,
        images: product.images?.length ? product.images : [''],
      });
    } else {
      setForm(empty);
    }
  }, [product]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        stock: Number(form.stock),
        images: form.images.filter(Boolean),
      };
      if (product) {
        await api.put(`/products/${product._id}`, body);
        toast.success('Product updated');
      } else {
        await api.post('/products', body);
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="font-semibold text-lg">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" required value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Select…</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit / Pack</label>
              <input className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input type="number" className="input" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>
            <div>
              <label className="label">Price (₹) *</label>
              <input type="number" className="input" required value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div>
              <label className="label">MRP (₹) *</label>
              <input type="number" className="input" required value={form.mrp} onChange={(e) => set('mrp', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Image URL</label>
              <input className="input" placeholder="https://…" value={form.images[0]} onChange={(e) => set('images', [e.target.value])} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['isVeg', 'isOrganic', 'isBestseller', 'isFeatured', 'isActive'].map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} />
                  {k.replace('is', '')}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
