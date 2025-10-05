interface ClusterMarkerProps {
  count: number
  size?: number
  color?: string
  textColor?: string
  className?: string
  onClick?: () => void
}

export default function ClusterMarker({
  count,
  size = 40,
  color = '#3b82f6',
  textColor = 'white',
  className = '',
  onClick
}: ClusterMarkerProps) {
  // Scale size based on count for visual hierarchy
  const getScaledSize = () => {
    if (count < 10) return size
    if (count < 100) return size * 1.2
    return size * 1.4
  }

  const actualSize = getScaledSize()
  const fontSize = actualSize * 0.4

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-bold shadow-lg border-4 border-white transition-transform hover:scale-110 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: actualSize,
        height: actualSize,
        backgroundColor: color,
        color: textColor,
        fontSize: `${fontSize}px`,
      }}
      onClick={onClick}
    >
      {count}
    </div>
  )
}
