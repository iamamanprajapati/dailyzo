import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Ticket } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr, dateShort } from '../utils/format';

const empty = { code: '', description: '', type: 'percent', value: 10, minOrderValue: 0, maxDiscount: 0, usageLimit: 0, validTill: '', isActive: true };

export default function Coupons() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/coupons').then(({ data }) => setList(data.coupons)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/coupons/${editing._id}`, form);
      else await api.post('/coupons', form);
      toast.success('Saved');
      setShow(false);
      setEditing(null);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await api.delete(`/coupons/${c._id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Coupons"
        subtitle="Drive sales with discount codes"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setForm(empty); setShow(true); }}>
            <Plus size={16} /> New Coupon
          </button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <div key={c._id} className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-bl-lg">
                {c.type === 'percent' ? `${c.value}% OFF` : `${inr(c.value)} OFF`}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Ticket size={18} className="text-brand-600" />
                <div className="font-mono text-lg font-bold">{c.code}</div>
              </div>
              <p className="text-xs text-slate-500 mb-3">{c.description}</p>
              <div className="text-xs text-slate-600 space-y-1 mb-3">
                {c.minOrderValue > 0 && <div>Min order: {inr(c.minOrderValue)}</div>}
                {c.maxDiscount > 0 && <div>Max discount: {inr(c.maxDiscount)}</div>}
                <div>Used: {c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}</div>
                {c.validTill && <div>Expires: {dateShort(c.validTill)}</div>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <span className={`badge ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
                <button className="btn-ghost p-2 ml-auto" onClick={() => { setEditing(c); setForm({ ...empty, ...c, validTill: c.validTill?.slice(0, 10) || '' }); setShow(true); }}>
                  <Pencil size={14} />
                </button>
                <button className="btn-ghost p-2 text-red-600" onClick={() => remove(c)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShow(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button type="button" className="btn-ghost p-1" onClick={() => setShow(false)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Code *</label><input className="input uppercase" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div className="col-span-2"><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="label">Value *</label><input type="number" className="input" required value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
              <div><label className="label">Min Order (₹)</label><input type="number" className="input" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: Number(e.target.value) })} /></div>
              <div><label className="label">Max Discount (₹)</label><input type="number" className="input" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} /></div>
              <div><label className="label">Usage Limit (0 = ∞)</label><input type="number" className="input" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} /></div>
              <div className="col-span-2"><label className="label">Valid Till</label><input type="date" className="input" value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} /></div>
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            </div>
            <button type="submit" className="btn-primary w-full">Save Coupon</button>
          </form>
        </div>
      )}
    </div>
  );
}
