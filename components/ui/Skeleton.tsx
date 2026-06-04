import { cn } from '@/lib/utils';

export type SkeletonShape = 'block' | 'line' | 'circle';

const shapeClass: Record<SkeletonShape, string> = {
  block: '',
  line: 'skeleton--line',
  circle: 'skeleton--circle',
};

export interface SkeletonProps {
  shape?: SkeletonShape;
  /** Taller line height (line shape only). */
  lg?: boolean;
  /** Layout sizing via Tailwind utilities (resolve to spacing tokens). */
  className?: string;
}

export function Skeleton({ shape = 'block', lg = false, className }: SkeletonProps) {
  return (
    <span
      className={cn(
        'skeleton',
        shapeClass[shape],
        shape === 'line' && lg && 'skeleton--line-lg',
        className,
      )}
      aria-hidden="true"
    />
  );
}
