const express = require('express');
const axios = require('axios');
const router = express.Router();

const APP_ID = process.env.BASE44_APP_ID || '69065969794f6d47834ae4a2';
const BASE_URL = `https://app.base44.com/api/apps/${APP_ID}/entities`;
const API_KEY = process.env.BASE44_API_KEY;

if (!API_KEY) {
  console.warn('BASE44_API_KEY not set — base44 proxy will fail until set in .env');
}

// List entities or query
router.get('/entities/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const response = await axios.get(`${BASE_URL}/${entity}`, {
      headers: {
        api_key: API_KEY,
        'Content-Type': 'application/json'
      },
      params: req.query
    });
    res.json(response.data);
  } catch (err) {
    console.error('Base44 proxy error (list):', err?.response?.data || err.message);
    res.status(502).json({ message: 'Base44 proxy error', details: err?.response?.data || err.message });
  }
});

// Get single entity
router.get('/entities/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const response = await axios.get(`${BASE_URL}/${entity}/${id}`, {
      headers: { api_key: API_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Base44 proxy error (get):', err?.response?.data || err.message);
    res.status(502).json({ message: 'Base44 proxy error', details: err?.response?.data || err.message });
  }
});

// Create entity
router.post('/entities/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const response = await axios.post(`${BASE_URL}/${entity}`, req.body, {
      headers: { api_key: API_KEY, 'Content-Type': 'application/json' }
    });
    res.status(201).json(response.data);
  } catch (err) {
    console.error('Base44 proxy error (create):', err?.response?.data || err.message);
    res.status(502).json({ message: 'Base44 proxy error', details: err?.response?.data || err.message });
  }
});

// Update entity
router.put('/entities/:entity/:id', async (req, res) => {
  try {
    const { entity, id } = req.params;
    const response = await axios.put(`${BASE_URL}/${entity}/${id}`, req.body, {
      headers: { api_key: API_KEY, 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (err) {
    console.error('Base44 proxy error (update):', err?.response?.data || err.message);
    res.status(502).json({ message: 'Base44 proxy error', details: err?.response?.data || err.message });
  }
});

module.exports = router;
