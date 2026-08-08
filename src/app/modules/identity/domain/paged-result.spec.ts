import { emptyPage, pageOf } from './paged-result';

const items = Array.from({ length: 14 }, (_, index) => `item-${index + 1}`);

describe('pageOf', () => {
  it('returns the first slice and the total count for page one', () => {
    const result = pageOf(items, { page: 1, pageSize: 10 });

    expect(result.entries).toHaveLength(10);
    expect(result.entries[0]).toBe('item-1');
    expect(result.totalResults).toBe(14);
    expect(result.totalPages).toBe(2);
  });

  it('returns the remainder on the last page', () => {
    const result = pageOf(items, { page: 2, pageSize: 10 });

    expect(result.entries).toEqual(['item-11', 'item-12', 'item-13', 'item-14']);
  });

  it('returns no entries past the last page rather than clamping to it', () => {
    const result = pageOf(items, { page: 9, pageSize: 10 });

    expect(result.entries).toEqual([]);
    expect(result.page).toBe(9);
    expect(result.totalPages).toBe(2);
  });

  it('reports one page when there is nothing to show', () => {
    const result = pageOf([], { page: 1, pageSize: 10 });

    expect(result.totalResults).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it('treats a page or size below one as one', () => {
    const result = pageOf(items, { page: 0, pageSize: 0 });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.entries).toEqual(['item-1']);
  });
});

describe('emptyPage', () => {
  it('is a renderable zero state, not a partially filled one', () => {
    const result = emptyPage();

    expect(result.entries).toEqual([]);
    expect(result.totalResults).toBe(0);
    expect(result.totalPages).toBe(1);
  });
});
