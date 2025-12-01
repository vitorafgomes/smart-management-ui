/**
 * JSON Patch operations as defined in RFC 6902
 * https://datatracker.ietf.org/doc/html/rfc6902
 */

/**
 * Supported JSON Patch operation types
 */
export type JsonPatchOperationType = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';

/**
 * A single JSON Patch operation
 */
export interface JsonPatchOperation {
  /**
   * The operation to perform
   */
  op: JsonPatchOperationType;

  /**
   * A JSON Pointer to the location to apply the operation
   * Example: "/firstName" or "/address/city"
   */
  path: string;

  /**
   * The value to use in the operation (required for add, replace, test)
   */
  value?: unknown;

  /**
   * Source path for move/copy operations
   */
  from?: string;
}

/**
 * A JSON Patch Document is an array of operations
 */
export type JsonPatchDocument = JsonPatchOperation[];

/**
 * Options for building a patch document
 */
export interface JsonPatchBuilderOptions {
  /**
   * Fields to ignore when comparing objects
   */
  ignoreFields?: string[];

  /**
   * Whether to include null values in the patch
   * @default true
   */
  includeNulls?: boolean;

  /**
   * Whether to use nested paths (e.g., "/address/city")
   * @default false - uses flat paths only
   */
  useNestedPaths?: boolean;
}

/**
 * Result of a patch operation
 */
export interface JsonPatchResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
