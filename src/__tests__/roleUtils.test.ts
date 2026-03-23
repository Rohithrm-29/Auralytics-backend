import { canManage, isValidManagerForRole, TOP_LEVEL_ROLES } from '../utils/roleUtils';

describe('Role Utilities', () => {
  describe('canManage', () => {
    it('hr can manage recruiter', () => {
      expect(canManage('hr', 'recruiter')).toBe(true);
    });

    it('hr cannot manage designer', () => {
      expect(canManage('hr', 'designer')).toBe(false);
    });

    it('manager can manage senior_designer', () => {
      expect(canManage('manager', 'senior_designer')).toBe(true);
    });

    it('manager can manage designer', () => {
      expect(canManage('manager', 'designer')).toBe(true);
    });

    it('senior_designer can manage designer', () => {
      expect(canManage('senior_designer', 'designer')).toBe(true);
    });

    it('recruiter cannot manage anyone', () => {
      expect(canManage('recruiter', 'designer')).toBe(false);
      expect(canManage('recruiter', 'recruiter')).toBe(false);
    });

    it('designer cannot manage anyone', () => {
      expect(canManage('designer', 'designer')).toBe(false);
    });
  });

  describe('isValidManagerForRole', () => {
    it('hr is valid manager for recruiter', () => {
      expect(isValidManagerForRole('hr', 'recruiter')).toBe(true);
    });

    it('manager is valid for senior_designer', () => {
      expect(isValidManagerForRole('manager', 'senior_designer')).toBe(true);
    });

    it('manager is valid for designer', () => {
      expect(isValidManagerForRole('manager', 'designer')).toBe(true);
    });

    it('senior_designer is valid for designer', () => {
      expect(isValidManagerForRole('senior_designer', 'designer')).toBe(true);
    });

    it('designer is NOT valid manager for anyone', () => {
      expect(isValidManagerForRole('designer', 'designer')).toBe(false);
    });

    it('recruiter is NOT valid manager for anyone', () => {
      expect(isValidManagerForRole('recruiter', 'designer')).toBe(false);
    });

    it('hr cannot manage designer directly', () => {
      expect(isValidManagerForRole('hr', 'designer')).toBe(false);
    });
  });

  describe('TOP_LEVEL_ROLES', () => {
    it('hr and manager are top-level', () => {
      expect(TOP_LEVEL_ROLES).toContain('hr');
      expect(TOP_LEVEL_ROLES).toContain('manager');
    });

    it('others are not top-level', () => {
      expect(TOP_LEVEL_ROLES).not.toContain('recruiter');
      expect(TOP_LEVEL_ROLES).not.toContain('designer');
      expect(TOP_LEVEL_ROLES).not.toContain('senior_designer');
    });
  });
});
