import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';

const empty = { name: '', image: '', icon: '', description: '', order: 0, isActive: true };

export default function Categories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/categories', { params: { all: true } })
      .then(({ data }) => setList(data.categories))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/categories/${editing._id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      setShowForm(false);
      setEditing(null);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.delete(`/categories/${c._id}`);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Categories"
        subtitle="Group products into shopping categories"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}>
            <Plus size={16} /> Add Category
          </button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((c) => (
            <div key={c._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="aspect-square rounded-xl bg-slate-100 mb-3 overflow-hidden">
                {c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="font-semibold text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-500 mb-3">{c.slug}</div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost p-2" onClick={() => { setEditing(c); setForm(c); setShowForm(true); }}>
                  <Pencil size={14} />
                </button>
                <button className="btn-ghost p-2 text-red-600" onClick={() => remove(c)}>
                  <Trash2 size={14} />
                </button>
                <span className={`badge ml-auto ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
            <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Image URL</label><input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
            <div><label className="label">Order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
