const request = require('supertest');
const app = require('../app');

describe('Company API', () => {
  it('should require authentication to create a company', async () => {
    const res = await request(app).post('/api/company').send({ name: 'TestCo' });
    expect(res.statusCode).toBe(401);
  });
  // Add more tests for authenticated flow in real test setup
}); 