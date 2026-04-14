import { cn } from './cn';

export function Button({ className, variant = 'primary', ...props }) {
  return (
    <button
      className={cn('btn', variant === 'ghost' ? 'btn-ghost' : 'btn-primary', className)}
      {...props}
    />
  );
}
