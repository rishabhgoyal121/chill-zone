import { cn } from '../cn';

const variants = {
  default:
    'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.25)]',
  secondary:
    'bg-white/80 text-slate-900 border border-slate-200 hover:bg-white',
  ghost: 'bg-transparent text-slate-700 hover:bg-white/60',
  danger: 'bg-rose-600 text-white hover:bg-rose-500'
};

export function Button({ className, variant = 'default', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
