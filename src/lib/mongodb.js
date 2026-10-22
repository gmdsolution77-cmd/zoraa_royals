import { ObjectId } from 'mongodb';
import { getDb, initDb } from './db';

/**
 * Safely converts an id to an ObjectId if it's a valid 24-character hex string.
 * If the id is not a 24-char hex string (e.g. custom string from fallback store, or already ObjectId),
 * it returns the id as-is without throwing BSONError: "input must be a 24 character hex string...".
 */
export function toObjectId(id) {
  if (!id) return id;
  if (typeof id === 'object' && (id._bsontype === 'ObjectID' || id.constructor?.name === 'ObjectId')) {
    return id;
  }
  const str = String(id).trim();
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    try {
      return new ObjectId(str);
    } catch {
      return str;
    }
  }
  return str;
}

/**
 * Safely constructs a MongoDB query for an _id field.
 * In production MongoDB with ObjectId documents, it checks both ObjectId and string.
 * In fallback JSON storage, it matches strings or ObjectIds cleanly without throwing.
 */
export function toIdQuery(id) {
  if (!id) return { _id: null };
  if (typeof id === 'object' && (id._bsontype === 'ObjectID' || id.constructor?.name === 'ObjectId')) {
    return { _id: id };
  }
  const str = String(id).trim();
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    try {
      return { $or: [{ _id: new ObjectId(str) }, { _id: str }] };
    } catch {
      return { _id: str };
    }
  }
  return { _id: str };
}

/**
 * Helper to check if a string is a valid 24-character hex ObjectId.
 */
export function isValidHexId(id) {
  if (!id) return false;
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());
}

export { getDb, initDb, ObjectId };
export default getDb;
