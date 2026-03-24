type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 ${className}`} />;
}
