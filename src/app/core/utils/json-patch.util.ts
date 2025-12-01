import {
  JsonPatchDocument,
  JsonPatchOperation,
  JsonPatchBuilderOptions
} from '@core/models/common/json-patch';

/**
 * Utility class for building JSON Patch documents
 *
 * @example
 * // Compare two objects and get differences
 * const original = { firstName: 'John', lastName: 'Doe' };
 * const updated = { firstName: 'Jane', lastName: 'Doe' };
 * const patch = JsonPatchBuilder.compare(original, updated);
 * // Result: [{ op: 'replace', path: '/firstName', value: 'Jane' }]
 *
 * @example
 * // Build patch manually
 * const patch = JsonPatchBuilder.create()
 *   .replace('/firstName', 'Jane')
 *   .add('/middleName', 'Marie')
 *   .remove('/nickname')
 *   .build();
 */
export class JsonPatchBuilder {
  private operations: JsonPatchDocument = [];

  private constructor() {}

  /**
   * Creates a new JsonPatchBuilder instance
   */
  static create(): JsonPatchBuilder {
    return new JsonPatchBuilder();
  }

  /**
   * Compares two objects and generates a patch document with the differences
   *
   * @param original The original object
   * @param updated The updated object
   * @param options Configuration options
   * @returns Array of patch operations
   */
  static compare<T extends Record<string, unknown>>(
    original: T,
    updated: Partial<T>,
    options: JsonPatchBuilderOptions = {}
  ): JsonPatchDocument {
    const {
      ignoreFields = [],
      includeNulls = true,
      useNestedPaths = false
    } = options;

    const operations: JsonPatchDocument = [];

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(original),
      ...Object.keys(updated)
    ]);

    for (const key of allKeys) {
      // Skip ignored fields
      if (ignoreFields.includes(key)) {
        continue;
      }

      const originalValue = original[key];
      const updatedValue = updated[key];

      // Skip if values are equal
      if (JsonPatchBuilder.isEqual(originalValue, updatedValue)) {
        continue;
      }

      // Handle null/undefined
      if (updatedValue === null || updatedValue === undefined) {
        if (includeNulls && originalValue !== null && originalValue !== undefined) {
          operations.push({
            op: 'replace',
            path: `/${key}`,
            value: null
          });
        }
        continue;
      }

      // Value exists in original, needs replace
      if (key in original) {
        if (useNestedPaths && typeof updatedValue === 'object' && !Array.isArray(updatedValue)) {
          // Recursively handle nested objects
          const nestedOps = JsonPatchBuilder.compare(
            originalValue as Record<string, unknown>,
            updatedValue as Record<string, unknown>,
            options
          );
          for (const op of nestedOps) {
            operations.push({
              ...op,
              path: `/${key}${op.path}`
            });
          }
        } else {
          operations.push({
            op: 'replace',
            path: `/${key}`,
            value: updatedValue
          });
        }
      } else {
        // New value, needs add
        operations.push({
          op: 'add',
          path: `/${key}`,
          value: updatedValue
        });
      }
    }

    return operations;
  }

  /**
   * Compares only specific fields between two objects
   *
   * @param original The original object
   * @param updated The updated object
   * @param fields Array of field names to compare
   * @param usePascalCase Convert path to PascalCase (for .NET APIs)
   * @returns Array of patch operations
   */
  static compareFields<T extends Record<string, unknown>>(
    original: T,
    updated: Partial<T>,
    fields: (keyof T)[],
    usePascalCase = true
  ): JsonPatchDocument {
    const operations: JsonPatchDocument = [];

    for (const field of fields) {
      const key = field as string;
      const originalValue = original[key];
      const updatedValue = updated[key];

      if (!JsonPatchBuilder.isEqual(originalValue, updatedValue)) {
        const path = usePascalCase
          ? `/${key.charAt(0).toUpperCase()}${key.slice(1)}`
          : `/${key}`;

        operations.push({
          op: 'replace',
          path,
          value: updatedValue
        });
      }
    }

    return operations;
  }

  /**
   * Adds an "add" operation
   */
  add(path: string, value: unknown): JsonPatchBuilder {
    this.operations.push({ op: 'add', path, value });
    return this;
  }

  /**
   * Adds a "remove" operation
   */
  remove(path: string): JsonPatchBuilder {
    this.operations.push({ op: 'remove', path });
    return this;
  }

  /**
   * Adds a "replace" operation
   */
  replace(path: string, value: unknown): JsonPatchBuilder {
    this.operations.push({ op: 'replace', path, value });
    return this;
  }

  /**
   * Adds a "move" operation
   */
  move(from: string, path: string): JsonPatchBuilder {
    this.operations.push({ op: 'move', from, path });
    return this;
  }

  /**
   * Adds a "copy" operation
   */
  copy(from: string, path: string): JsonPatchBuilder {
    this.operations.push({ op: 'copy', from, path });
    return this;
  }

  /**
   * Adds a "test" operation
   */
  test(path: string, value: unknown): JsonPatchBuilder {
    this.operations.push({ op: 'test', path, value });
    return this;
  }

  /**
   * Returns the built patch document
   */
  build(): JsonPatchDocument {
    return [...this.operations];
  }

  /**
   * Clears all operations
   */
  clear(): JsonPatchBuilder {
    this.operations = [];
    return this;
  }

  /**
   * Returns true if there are any operations
   */
  hasOperations(): boolean {
    return this.operations.length > 0;
  }

  /**
   * Returns the number of operations
   */
  get length(): number {
    return this.operations.length;
  }

  /**
   * Deep equality check for two values
   */
  private static isEqual(a: unknown, b: unknown): boolean {
    // Handle primitives
    if (a === b) return true;

    // Treat null, undefined, and empty string as equivalent
    const isEmptyA = a == null || a === '';
    const isEmptyB = b == null || b === '';
    if (isEmptyA && isEmptyB) return true;

    // Handle null/undefined
    if (a == null || b == null) return a === b;

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => JsonPatchBuilder.isEqual(item, b[index]));
    }

    // Handle objects
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key =>
        JsonPatchBuilder.isEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      );
    }

    return false;
  }
}

/**
 * Shorthand function to compare objects and generate patch
 */
export function createPatchDocument<T extends Record<string, unknown>>(
  original: T,
  updated: Partial<T>,
  options?: JsonPatchBuilderOptions
): JsonPatchDocument {
  return JsonPatchBuilder.compare(original, updated, options);
}

/**
 * Shorthand function to compare specific fields
 */
export function createFieldsPatch<T extends Record<string, unknown>>(
  original: T,
  updated: Partial<T>,
  fields: (keyof T)[]
): JsonPatchDocument {
  return JsonPatchBuilder.compareFields(original, updated, fields);
}