const Team = require('../models/Team');
const User = require('../models/User');

// Helper to generate a 6-character alphanumeric code
const generateTeamCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Players only)
const createTeam = async (req, res) => {
  try {
    const { name, sport, logo } = req.body;

    // Check if team name exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'Team name already exists. Please choose another.' });
    }

    // Generate unique code
    let teamCode = generateTeamCode();
    let codeExists = await Team.findOne({ teamCode });
    while (codeExists) {
      teamCode = generateTeamCode();
      codeExists = await Team.findOne({ teamCode });
    }

    // Fallback logo generation based on team name
    const finalLogo = logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=06b6d4&color=fff&size=150`;

    const team = await Team.create({
      name,
      sport,
      logo: finalLogo,
      captain: req.user._id,
      teamCode,
      members: [] // Captain doesn't need to be in members list to avoid duplicate counting, or we can add them. Let's keep members strictly for non-captains for easier querying.
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join a team using a code
// @route   POST /api/teams/join
// @access  Private
const joinTeam = async (req, res) => {
  try {
    const { teamCode } = req.body;

    if (!teamCode) {
      return res.status(400).json({ success: false, message: 'Please provide a team code.' });
    }

    const team = await Team.findOne({ teamCode: teamCode.toUpperCase() });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid team code. Team not found.' });
    }

    // Check if user is the captain
    if (team.captain.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You are already the captain of this team.' });
    }

    // Check if user is already a member
    const isMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this team.' });
    }

    // Add user to members
    team.members.push({ user: req.user._id, role: 'player' });
    await team.save();

    res.status(200).json({ success: true, message: 'Successfully joined the team!', data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all teams for logged-in user
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    // Find teams where user is either captain or in members array
    const teams = await Team.find({
      $or: [
        { captain: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('captain', 'name email phone')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Public
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('captain', 'name email phone')
      .populate('members.user', 'name email phone');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a member from team (Captain only)
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Ensure logged in user is the captain
    if (team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the captain can remove members.' });
    }

    // Remove the member
    team.members = team.members.filter(m => m.user.toString() !== req.params.userId);
    await team.save();

    res.status(200).json({ success: true, message: 'Member removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update player position in a team
// @route   PATCH /api/teams/:id/position
// @access  Private
const updatePlayerPosition = async (req, res) => {
  try {
    const { userId, position } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const isCaptain = team.captain.toString() === req.user._id.toString();

    // If not captain, you can only edit YOUR OWN position
    if (!isCaptain && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own role in the team.' });
    }

    if (team.captain.toString() === userId) {
      team.captainPosition = position;
    } else {
      const member = team.members.find(m => m.user.toString() === userId);
      if (!member) return res.status(404).json({ success: false, message: 'Player not found in this team.' });
      member.position = position;
    }

    await team.save();
    res.status(200).json({ success: true, message: 'Player role updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamById,
  removeMember,
  updatePlayerPosition
};
