interface RelationshipBadgeProps {
  closeness: number;
  size?: 'sm' | 'md';
}

export default function RelationshipBadge({ closeness, size = 'sm' }: RelationshipBadgeProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
  };

  // Color based on closeness level - using pastel colors for otome game style
  const getBadgeColor = (closeness: number): string => {
    if (closeness >= 81) return 'bg-gradient-to-br from-purple-400 to-pink-400'; // Intimate - romantic purple-pink
    if (closeness >= 61) return 'bg-gradient-to-br from-pink-400 to-rose-400'; // Close friend - warm pink-rose
    if (closeness >= 41) return 'bg-gradient-to-br from-blue-300 to-indigo-300'; // Friend - soft blue
    if (closeness >= 21) return 'bg-gradient-to-br from-green-300 to-emerald-300'; // Acquaintance - gentle green
    return 'bg-gradient-to-br from-gray-300 to-gray-400'; // Stranger - neutral gray
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${getBadgeColor(closeness)}
        rounded-full
        flex
        items-center
        justify-center
        text-white
        font-semibold
        shadow-lg
        border-2
        border-white/80
        backdrop-blur-sm
        relative
        overflow-hidden
      `}
      title={`Closeness: ${closeness}/100`}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
      <span className="relative z-10">{closeness}</span>
    </div>
  );
}
