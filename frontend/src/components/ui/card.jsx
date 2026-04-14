import { cn } from '../cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/70 bg-white/75 backdrop-blur-md shadow-[0_12px_28px_rgba(15,23,42,0.12)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('px-4 pt-4', className)}>{children}</div>;
}

export function CardContent({ className, children }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-base font-bold text-slate-900', className)}>{children}</h3>;
}
