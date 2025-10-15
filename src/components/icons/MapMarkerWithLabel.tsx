interface MapMarkerWithLabelProps {
  className?: string;
  size?: number;
  color?: string;
  label?: string | number;
  labelColor?: string;
  labelBgColor?: string;
  labelSize?: "sm" | "md" | "lg";
}

export default function MapMarkerWithLabel({
  className = "",
  size = 32,
  color = "currentColor",
  label,
  labelColor = "#1e293b",
  labelBgColor = "white",
  labelSize = "md",
}: MapMarkerWithLabelProps) {
  const getLabelFontSize = () => {
    // Return size in viewBox units (not pixels) for proper SVG rendering
    switch (labelSize) {
      case "sm":
        return 5;
      case "lg":
        return 8;
      case "md":
      default:
        return 6.5;
    }
  };

  const fontSize = getLabelFontSize();

  return (
    <svg
      width={size}
      height={size}
      viewBox="-3 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer marker shape */}
      <path
        fill={color}
        d="m8.075 23.52c-6.811-9.878-8.075-10.891-8.075-14.52 0-4.971 4.029-9 9-9s9 4.029 9 9c0 3.629-1.264 4.64-8.075 14.516-.206.294-.543.484-.925.484s-.719-.19-.922-.48l-.002-.004z"
      />
      {/* Inner circle - made larger */}
      <circle cx="9" cy="9" r="5.5" fill={labelBgColor} />
      {/* Label text */}
      {label && (
        <text
          x="9"
          y="9"
          textAnchor="middle"
          dominantBaseline="central"
          fill={labelColor}
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
