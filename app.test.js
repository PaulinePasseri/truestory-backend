const request = require('supertest');
const app = require('./app');

// Exemple
it('GET /products', async () => {
 const res = await request(app).get('/products');

 expect(res.statusCode).toBe(200);
 expect(res.body.stock).toEqual(['iPhone', 'iPad', 'iPod']);
});