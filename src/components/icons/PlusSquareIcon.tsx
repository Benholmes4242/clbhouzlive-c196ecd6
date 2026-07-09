import React from "react";

export default function PlusSquareIcon(
  props: React.SVGProps<SVGSVGElement> & {
    strokeLinecap?: string;
    strokeLinejoin?: string;
    vectorEffect?: string;
    strokeWidth?: number;
    plusColor?: string;
  }
) {
  const { plusColor = "currentColor", ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...rest}
    >
      {/* Square frame — inherits the tab's ink/dim via currentColor */}
      <path
        fill="currentColor"
        d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208Z"
      />
      {/* Plus glyph — theme-aware amber via plusColor prop */}
      <path
        fill={plusColor}
        d="M176,128a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"
      />
    </svg>
  );
}
