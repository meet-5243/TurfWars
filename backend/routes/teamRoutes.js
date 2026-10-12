const express = require('express');
const router = express.Router();
const {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamById,
  removeMember,
  updatePlayerPosition
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

// Routes
router.post('/', protect, createTeam);
router.post('/join', protect, joinTeam);
router.get('/my-teams', protect, getMyTeams);
router.get('/:id', getTeamById); // Public profile view
router.delete('/:id/members/:userId', protect, removeMember);
router.patch('/:id/position', protect, updatePlayerPosition);

module.exports = router;
