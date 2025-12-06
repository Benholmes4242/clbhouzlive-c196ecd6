const EngagementPage = () => {
  // Generate random positions for dots
  const dots = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: 8 + Math.random() * 16,
  }));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {dots.map(dot => (
        <div
          key={dot.id}
          className="absolute rounded-full bg-red-500"
          style={{
            top: `${dot.top}%`,
            left: `${dot.left}%`,
            width: dot.size,
            height: dot.size,
          }}
        />
      ))}
    </div>
  );
};

export default EngagementPage;
