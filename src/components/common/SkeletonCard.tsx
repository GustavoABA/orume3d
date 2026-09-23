type SkeletonBlockProps = {
  className: string;
};

const SkeletonBlock = ({ className }: SkeletonBlockProps) => (
  <div className={`relative overflow-hidden bg-accent/[0.035] ${className}`}>
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/15 to-transparent animate-shimmer" />
  </div>
);

const SkeletonCard = () => (
  <div className="orume-panel overflow-hidden rounded-[1.4rem] p-4">
    <SkeletonBlock className="mb-5 h-56 w-full rounded-2xl" />
    <SkeletonBlock className="mb-2 h-4 w-3/4 rounded-full" />
    <SkeletonBlock className="mb-6 h-4 w-1/3 rounded-full" />
    <SkeletonBlock className="h-10 w-full rounded-full" />
  </div>
);

export default SkeletonCard;
