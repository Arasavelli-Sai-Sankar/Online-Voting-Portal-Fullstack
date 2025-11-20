const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');

const router = express.Router();

// Public: list active elections
router.get('/', async (req, res) => {
  const now = new Date();
  const elections = await Election.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ startDate: 1 });
  res.json({ elections });
});

// Admin: create election
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, startDate, endDate, isActive } = req.body || {};
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'title, startDate, endDate required' });
    }
    const election = await Election.create({
      title,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? !!isActive : true
    });
    res.status(201).json({ election });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// Admin: update election
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body || {};
    if (update.startDate) update.startDate = new Date(update.startDate);
    if (update.endDate) update.endDate = new Date(update.endDate);
    const election = await Election.findByIdAndUpdate(id, update, { new: true });
    if (!election) return res.status(404).json({ error: 'Election not found' });
    res.json({ election });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update election' });
  }
});

// Admin: delete election
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Candidate.deleteMany({ election: id });
    const result = await Election.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Election not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete election' });
  }
});

// Public: list candidates for an election
router.get('/:id/candidates', async (req, res) => {
  try {
    const { id } = req.params;
    const candidates = await Candidate.find({ election: id }).sort({ name: 1 });
    res.json({ candidates });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list candidates' });
  }
});

// Admin: add candidate to election
router.post('/:id/candidates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Candidate name required' });
    const candidate = await Candidate.create({ name, election: id });
    res.status(201).json({ candidate });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

module.exports = router;