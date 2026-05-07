import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Bike, Trash2, X, Star } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { inr } from '../utils/format';

const empty = { name: '', email: '', phone: '', password: '', vehicleType: 'bike', vehicleNumber: '', licenseNumber: '' };

export default function DeliveryPartners() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    setLoading(true);
    api.get('/delivery').then(({ data }) => setList(data.partners)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/delivery', form);
      toast.success('Partner added');
      setShowForm(false);
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add partner');
    }
  };

  const remove = async (p) => {
    if (!confirm(`Deactivate ${p.user.name}?`)) return;
    try {
      await api.delete(`/delivery/${p._id}`);
      toast.success('Deactivated');
      load();
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Delivery Partners"
        subtitle={`${list.length} partners on the platform`}
        actions={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Partner
          </button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <div key={p._id} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                  {p.user?.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.user?.name}</div>
                  <div className="text-xs text-slate-500 truncate">{p.user?.phone}</div>
                </div>
                <span className={`badge ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                  {p.isAvailable ? 'Available' : 'Busy'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                <div><span className="text-slate-400">Vehicle:</span> {p.vehicleType}</div>
                <div className="font-mono">{p.vehicleNumber || '—'}</div>
                <div className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {p.rating?.toFixed(1)}</div>
                <div>{p.completedOrders} orders</div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">Earnings</div>
                <div className="font-semibold">{inr(p.earnings)}</div>
              </div>

              <button className="btn-ghost text-red-600 text-xs mt-3 w-full justify-center" onClick={() => remove(p)}>
                <Trash2 size={12} /> Deactivate
              </button>
            </div>
          ))}
          {list.length === 0 && (
            <div className="card p-10 text-center col-span-full text-slate-500">
              <Bike size={36} className="mx-auto mb-2 text-slate-300" />
              No delivery partners yet.
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={create} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">New Delivery Partner</h2>
              <button type="button" className="btn-ghost p-1" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Phone *</label><input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Password *</label><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div>
                <label className="label">Vehicle</label>
                <select className="input" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="ev">EV</option>
                  <option value="cycle">Cycle</option>
                </select>
              </div>
              <div><label className="label">Vehicle No.</label><input className="input" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /></div>
            </div>
            <button type="submit" className="btn-primary w-full">Create Partner</button>
          </form>
        </div>
      )}
    </div>
  );
}
