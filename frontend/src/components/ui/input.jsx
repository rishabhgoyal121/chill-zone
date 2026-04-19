import { cn } from '../cn';

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn('shad-input', className)}
      {...props}
    />
  );
}
