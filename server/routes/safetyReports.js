const router = require('express').Router();

// Minimal stub routes for safety reports.

// List reports
router.get('/', (req, res) => {
  res.json([]);
});

// Create a report
router.post('/', (req, res) => {
  const report = req.body || {};
  res.status(201).json({ message: 'Safety report created (stub)', report });
});

// Update a report
router.put('/:id', (req, res) => {
  const report = req.body || {};
  res.json({ message: `Safety report ${req.params.id} updated (stub)`, report });
});

module.exports = router;
