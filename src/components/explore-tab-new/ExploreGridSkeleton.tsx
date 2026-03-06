export default function ExploreGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-[2px] px-[2px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/5] rounded-[4px] bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}
