const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please provide a team name'], 
    unique: true, 
    trim: true,
    maxlength: [30, 'Team name cannot be more than 30 characters']
  },
  logo: { 
    type: String, 
    default: 'https://ui-avatars.com/api/?name=Team&background=06b6d4&color=fff&size=150' 
  },
  captain: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  captainPosition: {
    type: String,
    default: 'Unassigned'
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['player', 'vice-captain'], default: 'player' },
    position: { type: String, default: 'Unassigned' },
    joinedAt: { type: Date, default: Date.now }
  }],
  teamCode: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  sport: {
    type: String,
    required: [true, 'Please specify the sport this team plays'],
    enum: ['cricket', 'football', 'tennis', 'badminton', 'basketball', 'volleyball'],
    default: 'cricket'
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    rating: { type: Number, default: 1000 } // Elo rating starting at 1000
  }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
