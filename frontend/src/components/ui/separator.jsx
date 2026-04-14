import { cn } from '../cn';

export function Separator({ className }) {
  return <div className={cn('h-px w-full bg-slate-200', className)} />;
}
