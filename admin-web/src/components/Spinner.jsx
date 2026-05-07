export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
