interface MapMarkerWithLabelProps {
  className?: string
  size?: number
  color?: string
  label?: string | number
  labelColor?: string
  labelSize?: 'sm' | 'md' | 'lg'
}

export default function MapMarkerWithLabel({
  className = '',
  size = 32,
  color = 'currentColor',
  label,
  labelColor = 'white',
  labelSize = 'md'
}: MapMarkerWithLabelProps) {
  const getLabelFontSize = () => {
    switch (labelSize) {
      case 'sm':
        return size * 0.3
      case 'lg':
        return size * 0.5
      case 'md':
      default:
        return size * 0.4
    }
  }

  const fontSize = getLabelFontSize()

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        fill={color}
        width={size}
        height={size}
        viewBox="-3 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute"
      >
        <path d="m8.075 23.52c-6.811-9.878-8.075-10.891-8.075-14.52 0-4.971 4.029-9 9-9s9 4.029 9 9c0 3.629-1.264 4.64-8.075 14.516-.206.294-.543.484-.925.484s-.719-.19-.922-.48l-.002-.004zm.925-10.77c2.07 0 3.749-1.679 3.749-3.75s-1.679-3.75-3.75-3.75-3.75 1.679-3.75 3.75c0 2.071 1.679 3.75 3.75 3.75z" />
      </svg>
      {label && (
        <span
          className="absolute font-bold select-none"
          style={{
            color: labelColor,
            fontSize: `${fontSize}px`,
            top: `${size * 0.15}px`,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
