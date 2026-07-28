export function normalizeCandidatePath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.includes('\\') ||
    value.normalize('NFC') !== value
  ) {
    return null;
  }
  const segments = value.split('/');
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === '.' ||
        segment === '..',
    )
  ) {
    return null;
  }
  return segments.join('/');
}

export function candidatePathIsCanonical(value) {
  return normalizeCandidatePath(value) === value;
}
