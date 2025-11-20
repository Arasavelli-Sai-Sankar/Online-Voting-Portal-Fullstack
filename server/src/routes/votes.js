const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');

const router = express.Router();

// User: cast a vote
router.post('/', requireAuth, async (req, res) => {
  try {
    const { electionId, candidateId } = req.body || {};
    if (!electionId || !candidateId) {
      return res.status(400).json({ error: 'electionId and candidateId required' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ error: 'Election not found' });

    const now = new Date();
    if (!election.isActive || election.startDate > now || election.endDate < now) {
      return res.status(400).json({ error: 'Election is not currently active' });
    }

    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
    if (!candidate) return res.status(404).json({ error: 'Candidate not found for election' });

    const vote = await Vote.create({
      voter: req.user._id,
      election: electionId,
      candidate: candidateId
    });

    res.status(201).json({ vote });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'You have already voted in this election' });
    }
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// Admin: election stats
router.get('/stats/:electionId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { electionId } = req.params;
    const stats = await Vote.aggregate([
      { $match: { election: require('mongoose').Types.ObjectId.createFromHexString(electionId) } },
      {
        $group: {
          _id: '$candidate',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: '$candidate' },
      {
        $project: {
          _id: 0,
          candidateId: '$candidate._id',
          candidateName: '$candidate.name',
          votes: '$count'
        }
      },
      { $sort: { votes: -1 } }
    ]);

    res.json({ stats });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;