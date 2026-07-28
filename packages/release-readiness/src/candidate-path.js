const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/u;
export const CANDIDATE_MAX_PATH_BYTES = 4096;

export function normalizeCandidatePath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.startsWith('/') ||
    value.endsWith('/') ||
    value.includes('\\') ||
    CONTROL_CHARACTER.test(value) ||
    value.normalize('NFC') !== value ||
    Buffer.byteLength(value, 'utf8') > CANDIDATE_MAX_PATH_BYTES
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
