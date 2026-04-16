import { cn } from '../cn';

export function Switch({ className, checked = false, onCheckedChange, disabled = false, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? 'checked' : 'unchecked'}
      className={cn('shad-switch', className)}
      onClick={() => {
        if (!disabled) onCheckedChange?.(!checked);
      }}
      {...props}
    >
      <span className="shad-switch-thumb" />
    </button>
  );
}
