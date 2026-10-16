// P02.5: placeholder loading. aria-hidden; status ditangani pemanggil.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-line ${className}`} />;
}
