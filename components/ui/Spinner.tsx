import { cn } from '@/lib/utils';

export type SpinnerSize = 'sm' | 'lg';

const sizeClass: Record<SpinnerSize, string> = {
  sm: '',
  lg: 'spinner--lg',
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = 'sm', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span className={cn('spinner', sizeClass[size], className)} role="status" aria-label={label} />
  );
}

/** Full-screen centered loader (lg spinner). */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="page-loader">
      <Spinner size="lg" label={label} />
    </div>
  );
}
