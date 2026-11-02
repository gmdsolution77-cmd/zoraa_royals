/**
 * High-performance Deep Equality & Silent State Diff Utility
 * Prevents redundant React re-renders, input focus drops, and scroll jumps
 * by leveraging React's Object.is bailout on identical references.
 */

export function areEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;

  // Handle Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Handle Arrays
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle Objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !areEqual(a[k], b[k])) return false;
  }
  return true;
}

export function diffSet(setter, nextVal) {
  if (typeof nextVal === 'function') {
    setter(prev => {
      const computed = nextVal(prev);
      return areEqual(prev, computed) ? prev : computed;
    });
  } else {
    setter(prev => (areEqual(prev, nextVal) ? prev : nextVal));
  }
}

/**
 * Sanitizes game titles by stripping non-breaking spaces, extra whitespace,
 * and normalizing unicode.
 */
export function sanitizeGameTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
