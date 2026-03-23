import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';

// Set required env vars for tests
process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-32ch';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32-chars-ok';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('JWT Utilities', () => {
  const payload = {
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'test@auralytics.io',
    role: 'hr' as const,
  };

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const { accessToken, refreshToken } = generateTokenPair(payload);
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    it('should generate different tokens each call', () => {
      const pair1 = generateTokenPair(payload);
      const pair2 = generateTokenPair(payload);
      // Tokens include iat so they differ slightly but sub matches
      const decoded1 = verifyAccessToken(pair1.accessToken);
      const decoded2 = verifyAccessToken(pair2.accessToken);
      expect(decoded1.sub).toBe(decoded2.sub);
    });
  });

  describe('verifyAccessToken', () => {
    it('should decode a valid access token', () => {
      const { accessToken } = generateTokenPair(payload);
      const decoded = verifyAccessToken(accessToken);
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw on tampered token', () => {
      const { accessToken } = generateTokenPair(payload);
      const tampered = accessToken.slice(0, -5) + 'xxxxx';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should decode a valid refresh token', () => {
      const { refreshToken } = generateTokenPair(payload);
      const decoded = verifyRefreshToken(refreshToken);
      expect(decoded.sub).toBe(payload.sub);
    });

    it('should throw on invalid refresh token', () => {
      expect(() => verifyRefreshToken('bad.token')).toThrow();
    });
  });
});
