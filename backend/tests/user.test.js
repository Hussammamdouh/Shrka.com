const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  it('should require authentication to get profile', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.statusCode).toBe(401);
  });
  // Add more tests for authenticated flow in real test setup
}); 