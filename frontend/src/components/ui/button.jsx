import { cn } from '../cn';

const variants = {
  default: 'shad-btn--default',
  secondary: 'shad-btn--secondary',
  ghost: 'shad-btn--ghost',
  outline: 'shad-btn--outline',
  destructive: 'shad-btn--destructive',
  danger: 'shad-btn--destructive'
};

const sizes = {
  default: 'shad-btn--default-size',
  sm: 'shad-btn--sm',
  lg: 'shad-btn--lg',
  icon: 'shad-btn--icon'
};

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'shad-btn',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
}
