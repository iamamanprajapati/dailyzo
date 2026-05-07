import PageHeader from '../components/PageHeader';
import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title, subtitle, items = [] }) {
  return (
    <div className="p-8">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Construction size={26} />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">Coming in Phase 2</h3>
        <p className="text-sm text-slate-500 mb-4">This page will include:</p>
        <ul className="text-sm text-slate-700 inline-block text-left space-y-1">
          {items.map((it) => <li key={it}>• {it}</li>)}
        </ul>
      </div>
    </div>
  );
}
