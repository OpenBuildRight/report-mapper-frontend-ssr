/**
 * Generate letter labels for photos (A, B, C... Z, AA, AB, AC...)
 */
export function getPhotoLabel(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  if (index < 26) {
    return alphabet[index]
  }

  // For 26+, use AA, AB, AC, etc.
  const firstLetter = alphabet[Math.floor(index / 26) - 1]
  const secondLetter = alphabet[index % 26]

  return `${firstLetter}${secondLetter}`
}

/**
 * Get labels for all photos in an array
 */
export function getPhotoLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getPhotoLabel(i))
}
