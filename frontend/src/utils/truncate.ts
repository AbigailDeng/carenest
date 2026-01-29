/**
 * Truncate a filename to a maximum length, adding ellipsis if needed
 * @param filename The filename to truncate
 * @param maxLength Maximum length before truncation (default: 25)
 * @returns Truncated filename with ellipsis if needed
 */
export function truncateFilename(filename: string, maxLength: number = 25): string {
  if (filename.length <= maxLength) {
    return filename;
  }
  
  // Try to preserve file extension
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0 && lastDotIndex < filename.length - 1) {
    const extension = filename.substring(lastDotIndex);
    const nameWithoutExt = filename.substring(0, lastDotIndex);
    const availableLength = maxLength - extension.length - 3; // 3 for "..."
    
    if (availableLength > 0) {
      return `${nameWithoutExt.substring(0, availableLength)}...${extension}`;
    }
  }
  
  // If extension is too long or no extension, just truncate
  return `${filename.substring(0, maxLength - 3)}...`;
}

