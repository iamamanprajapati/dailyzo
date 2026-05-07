import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, MapPin, Phone, User as UserIcon, Truck, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Spinner from '../components/Spinner';
import { inr, dateTime, statusColor } from '../utils/format';

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'assigned',
  assigned: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export default function OrderDrawer({ orderId, onClose, onChanged }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: orderData }, { data: partnerData }] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/delivery/available').catch(() => ({ data: { partners: [] } })),
      ]);
      setOrder(orderData.order);
      setPartners(partnerData.partners);
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [orderId]);

  const updateStatus = async (status) => {
    setBusy(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Marked as ${status.replace(/_/g, ' ')}`);
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const assign = async (partnerUserId) => {
    setBusy(true);
    try {
      await api.post(`/orders/${orderId}/assign`, { partnerUserId });
      toast.success('Delivery partner assigned');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assign failed');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    setBusy(true);
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: 'Cancelled by admin' });
      toast.success('Order cancelled');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs text-slate-500">Order</div>
            <div className="font-mono font-semibold">{order?.orderNumber || '…'}</div>
          </div>
          <button className="btn-ghost p-2" onClick={onClose}><X size={18} /></button>
        </div>

        {loading || !order ? <Spinner /> : (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${statusColor(order.status)} text-sm`}>{order.status.replace(/_/g, ' ')}</span>
              <span className={`badge ${statusColor(order.paymentStatus)} text-sm`}>Payment: {order.paymentStatus}</span>
              <span className="badge bg-slate-100 text-slate-700 text-sm">{order.paymentMethod.toUpperCase()}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {NEXT_STATUS[order.status] && (
                <button className="btn-primary" disabled={busy} onClick={() => updateStatus(NEXT_STATUS[order.status])}>
                  <CheckCircle2 size={14} /> Mark as {NEXT_STATUS[order.status].replace(/_/g, ' ')}
                </button>
              )}
              {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                <button className="btn-danger" disabled={busy} onClick={cancel}>Cancel order</button>
              )}
            </div>

            <section className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><UserIcon size={16} /> Customer</h3>
              <div className="text-sm">
                <div className="font-medium">{order.user?.name}</div>
                <div className="text-slate-500">{order.user?.email} · {order.user?.phone}</div>
              </div>
            </section>

            <section className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><MapPin size={16} /> Delivery Address</h3>
              <div className="text-sm text-slate-700">
                <div>{order.address?.line1}{order.address?.line2 ? `, ${order.address.line2}` : ''}</div>
                <div>{order.address?.city}{order.address?.state ? `, ${order.address.state}` : ''} - {order.address?.pincode}</div>
                {order.address?.landmark && <div className="text-slate-500">Landmark: {order.address.landmark}</div>}
              </div>
            </section>

            <section className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Truck size={16} /> Delivery Partner</h3>
              {order.deliveryPartner ? (
                <div className="text-sm">
                  <div className="font-medium">{order.deliveryPartner.name}</div>
                  <div className="text-slate-500 flex items-center gap-1"><Phone size={12} /> {order.deliveryPartner.phone}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">No partner assigned yet.</p>
                  {partners.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {partners.map((p) => (
                        <button key={p._id} className="btn-secondary text-xs" disabled={busy} onClick={() => assign(p.user._id)}>
                          Assign {p.user.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No available partners online right now.</p>
                  )}
                </div>
              )}
            </section>

            <section className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-900">Items</div>
              <table className="table-base">
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-3">
                          {it.image && <img src={it.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                          <div>
                            <div className="font-medium text-sm">{it.name}</div>
                            <div className="text-xs text-slate-500">{it.unit} · {inr(it.price)} × {it.quantity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-medium">{inr(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 space-y-1 text-sm border-t border-slate-100">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{inr(order.subtotal)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-green-700"><span>Item discount</span><span>− {inr(order.discount)}</span></div>}
                {order.couponDiscount > 0 && <div className="flex justify-between text-green-700"><span>Coupon ({order.couponCode})</span><span>− {inr(order.couponDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Delivery fee</span><span>{order.deliveryFee === 0 ? 'FREE' : inr(order.deliveryFee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Taxes</span><span>{inr(order.taxes)}</span></div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-slate-100"><span>Total</span><span>{inr(order.total)}</span></div>
              </div>
            </section>

            <section className="card p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Timeline</h3>
              <ol className="space-y-3">
                {order.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{t.status.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-slate-500">{dateTime(t.at)}</span>
                      </div>
                      {t.note && <div className="text-xs text-slate-500">{t.note}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
