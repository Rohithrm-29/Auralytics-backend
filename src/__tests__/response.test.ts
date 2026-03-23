import { getPagination, buildPaginationMeta } from '../utils/response';

describe('Response Utilities', () => {
  describe('getPagination', () => {
    it('should return defaults for page=1 limit=10', () => {
      const result = getPagination(1, 10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.from).toBe(0);
      expect(result.to).toBe(9);
    });

    it('should calculate correct range for page=2 limit=10', () => {
      const result = getPagination(2, 10);
      expect(result.from).toBe(10);
      expect(result.to).toBe(19);
    });

    it('should enforce minimum page of 1', () => {
      const result = getPagination(0, 10);
      expect(result.page).toBe(1);
    });

    it('should cap limit at 100', () => {
      const result = getPagination(1, 500);
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const result = getPagination(1, 0);
      expect(result.limit).toBe(1);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should compute totalPages correctly', () => {
      const meta = buildPaginationMeta(100, 1, 10);
      expect(meta.totalPages).toBe(10);
      expect(meta.total).toBe(100);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
    });

    it('should round up totalPages', () => {
      const meta = buildPaginationMeta(101, 1, 10);
      expect(meta.totalPages).toBe(11);
    });

    it('should handle 0 total', () => {
      const meta = buildPaginationMeta(0, 1, 10);
      expect(meta.totalPages).toBe(0);
    });
  });
});
