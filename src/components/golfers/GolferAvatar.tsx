import React from 'react';

interface GolferAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const [first, second] = parts;
  if (!first) return '?';
  if (!second) return first[0].toUpperCase();
  return (first[0] + second[0]).toUpperCase();
};

export function GolferAvatar({ name, photoUrl, size = 56 }: GolferAvatarProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="flex-shrink-0 object-cover"
        style={{
          width: size,
          height: size,
          borderRadius: '22%',
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center bg-muted flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: '22%',
      }}
    >
      <span className="text-base font-semibold text-muted-foreground">
        {getInitials(name)}
      </span>
    </div>
  );
}
