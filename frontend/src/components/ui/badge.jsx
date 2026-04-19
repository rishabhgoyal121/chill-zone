import { cn } from '../cn';

const variants = {
  default: 'bg-red-700 text-red-50',
  soft: 'bg-yellow-100 text-amber-900',
  success: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-200 text-amber-900'
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
