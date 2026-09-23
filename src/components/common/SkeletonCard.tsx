type SkeletonBlockProps = {
  className: string;
};

const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <div className={`relative overflow-hidden bg-white/5 ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
  </div>
);

const SkeletonCard = () => (
  <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface/50 p-6 shadow-lg shadow-black/20">
    <SkeletonBlock className="mb-5 h-48 w-full rounded-2xl" />
    <SkeletonBlock className="mb-2 h-4 w-3/4 rounded-full" />
    <SkeletonBlock className="mb-6 h-4 w-1/3 rounded-full" />
    <SkeletonBlock className="h-10 w-full rounded-full" />
  </div>
);

export default SkeletonCard;
