// jest test for FAQ fallback endpoint using supertest
const request = require('supertest');
const express = require('express');
const app = express();

// temporary route (reuse the one from server file)
app.get('/faq-fallback', (req, res) => {
  const question = req.query.question || '';
  if (question === 'known') {
    return res.json({ status: 'known', answer: 'This is a known answer' });
  }
  return res.json({ status: 'sent' });
});

describe('GET /faq-fallback', () => {
  test('returns known answer when question is known', async () => {
    const response = await request(app).get('/faq-fallback').query({ question: 'known' });
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('known');
    expect(response.body.answer).toBe('This is a known answer');
  });

  test('returns sent status for unknown question', async () => {
    const response = await request(app).get('/faq-fallback').query({ question: 'unknown' });
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('sent');
  });
});
