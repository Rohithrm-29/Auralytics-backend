/**
 * Integration tests for the Express app.
 *
 * These tests use supertest to hit the actual HTTP layer without mocking
 * the router or middleware. They do NOT call the database — Supabase calls
 * would need to be mocked in a real CI environment.
 *
 * Run with: npm test
 */

import request from 'supertest';
import app from '../app';

// We only test publicly accessible, non-DB endpoints here.
// Full DB-backed tests require a test Supabase project + seeded data.

describe('Health Check', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('auralytics-api');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('404 Handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Auth — Login Validation', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@auralytics.io' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for malformed email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Protected Routes — No Token', () => {
  const protectedEndpoints = [
    ['GET',  '/api/v1/employees'],
    ['GET',  '/api/v1/projects'],
    ['GET',  '/api/v1/tasks'],
    ['GET',  '/api/v1/kra'],
    ['GET',  '/api/v1/notifications'],
    ['GET',  '/api/v1/dashboard/stats'],
  ];

  it.each(protectedEndpoints)(
    '%s %s returns 401 without token',
    async (method, path) => {
      const res = await (request(app) as any)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
  );
});

describe('Protected Routes — Invalid Token', () => {
  it('returns 401 with a bad Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Response format', () => {
  it('all error responses include success:false and error.code', async () => {
    const res = await request(app).get('/api/v1/employees');
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
  });
});
