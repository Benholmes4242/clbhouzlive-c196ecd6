export default function ExploreGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-[2px] px-[2px]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-[4px] bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}
