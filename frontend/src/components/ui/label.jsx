import { cn } from '../cn';

export function Label({ className, ...props }) {
  return (
    <label
      className={cn('shad-label', className)}
      {...props}
    />
  );
}
