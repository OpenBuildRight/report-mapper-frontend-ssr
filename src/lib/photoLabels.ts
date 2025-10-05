/**
 * Generate letter labels for photos (A, B, C... Z, AA, AB, AC...)
 * Uses base-26 math with no upper limit
 */
export function getPhotoLabel(index: number): string {
  let result = ''
  let num = index

  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26) - 1
  }

  return result
}

/**
 * Get labels for all photos in an array
 */
export function getPhotoLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getPhotoLabel(i))
}
