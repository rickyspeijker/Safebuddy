const router = require('express').Router();

// Minimal stub routes for emergency alerts.

// List alerts
router.get('/', (req, res) => {
  res.json([]);
});

// Create an alert
router.post('/', (req, res) => {
  const alert = req.body || {};
  res.status(201).json({ message: 'Emergency alert created (stub)', alert });
});

// Resolve an alert
router.put('/:id/resolve', (req, res) => {
  res.json({ message: `Emergency alert ${req.params.id} resolved (stub)` });
});

module.exports = router;
