import { cn } from '../cn';

const variants = {
  default: 'bg-slate-900 text-white',
  soft: 'bg-slate-100 text-slate-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800'
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tracking-wide',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
