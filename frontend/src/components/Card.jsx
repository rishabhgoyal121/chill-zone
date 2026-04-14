import { cn } from './cn';

export function Card({ className, children }) {
  return <article className={cn('card', className)}>{children}</article>;
}
