import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Shield, Plus, LogIn, Users, Award, X } from 'lucide-react';

const Teams = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-teams');
  
  // My Teams State
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard State
  const [dashboardTeam, setDashboardTeam] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Create Team State
  const [createData, setCreateData] = useState({ name: '', sport: 'cricket', logo: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Join Team State
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const fetchMyTeams = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/teams/my-teams');
      if (res.data.success) {
        setMyTeams(res.data.data);
      }
    } catch (err) {
      setError('Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchTeamDashboard = async (teamId) => {
    setDashboardLoading(true);
    setActiveTab('dashboard');
    try {
      const res = await axiosInstance.get(`/teams/${teamId}`);
      if (res.data.success) {
        setDashboardTeam(res.data.data);
      }
    } catch (err) {
      alert('Failed to load team dashboard.');
      setActiveTab('my-teams');
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newPosition) => {
    try {
      const res = await axiosInstance.patch(`/teams/${dashboardTeam._id}/position`, {
        userId,
        position: newPosition
      });
      if (res.data.success) {
        // Optimistically update UI
        setDashboardTeam(prev => {
          if (prev.captain._id === userId) return { ...prev, captainPosition: newPosition };
          const updatedMembers = prev.members.map(m => m.user._id === userId ? { ...m, position: newPosition } : m);
          return { ...prev, members: updatedMembers };
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const res = await axiosInstance.post('/teams', createData);
      if (res.data.success) {
        setCreateSuccess(`Team created! Your team code is: ${res.data.data.teamCode}`);
        setCreateData({ name: '', sport: 'cricket', logo: '' });
        fetchMyTeams();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      const res = await axiosInstance.post('/teams/join', { teamCode: joinCode });
      if (res.data.success) {
        setJoinSuccess(`Successfully joined ${res.data.data.name}!`);
        setJoinCode('');
        fetchMyTeams();
      }
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join team.');
    } finally {
      setJoinLoading(false);
    }
  };

  // Helper for win rate
  const getWinRate = (stats) => {
    if (!stats || !stats.matchesPlayed) return 0;
    return Math.round((stats.wins / stats.matchesPlayed) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-[80vh]">
      <div className="bg-mesh"></div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
          <Shield className="h-8 w-8 mr-3 text-brand-400" />
          Team HQ
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage your squads, invite players, and prepare for battle.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 glass-panel p-1 rounded-xl w-fit mb-8 relative z-10">
        <button
          onClick={() => setActiveTab('my-teams')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'my-teams' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="h-4 w-4 mr-2" />
          My Teams
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'create' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </button>
        <button
          onClick={() => setActiveTab('join')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'join' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Join Team
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* My Teams Tab */}
        {activeTab === 'my-teams' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 p-4 bg-red-900/20 rounded-xl">{error}</div>
            ) : myTeams.length === 0 ? (
              <div className="text-center py-20 glass-panel rounded-2xl border border-gray-800">
                <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">No Teams Found</h3>
                <p className="text-gray-400 mb-6">You haven't joined or created any teams yet.</p>
                <div className="flex justify-center space-x-4">
                  <button onClick={() => setActiveTab('create')} className="btn-primary px-6 py-2 rounded-xl text-sm font-bold">Create a Team</button>
                  <button onClick={() => setActiveTab('join')} className="btn-secondary px-6 py-2 rounded-xl text-sm font-bold border border-gray-700 hover:bg-gray-800">Join a Team</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTeams.map(team => (
                  <div key={team._id} className="glass-panel rounded-2xl p-6 border border-gray-800 hover:border-brand-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <img src={team.logo} alt={team.name} className="h-14 w-14 rounded-full border-2 border-brand-500/30 object-cover" />
                        <div>
                          <h3 className="text-lg font-bold text-white">{team.name}</h3>
                          <span className="text-xs text-brand-400 font-semibold uppercase tracking-wider">{team.sport}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-950/50 rounded-xl p-4 mb-4 border border-gray-900">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Team Code:</span>
                        <span className="text-cyan-400 font-mono font-bold">{team.teamCode}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Captain:</span>
                        <span className="text-white font-medium">{team.captain._id === user._id ? 'You' : team.captain.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Members:</span>
                        <span className="text-white font-medium">{team.members.length + 1}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <div className="flex items-center space-x-1.5 text-yellow-500 text-sm font-bold">
                        <Award className="h-4 w-4" />
                        <span>{team.stats?.rating || 1000} MMR</span>
                      </div>
                      <button 
                        onClick={() => fetchTeamDashboard(team._id)}
                        className="text-brand-400 hover:text-brand-300 text-sm font-bold transition-colors"
                      >
                        View Dashboard &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Team Tab */}
        {activeTab === 'create' && (
          <div className="max-w-md mx-auto glass-panel p-8 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Team</h2>
            
            {createError && <div className="mb-4 p-3 bg-red-950/50 text-red-400 text-sm rounded-lg border border-red-900/50">{createError}</div>}
            {createSuccess && <div className="mb-4 p-3 bg-emerald-950/50 text-emerald-400 text-sm rounded-lg border border-emerald-900/50 font-medium">{createSuccess}</div>}
            
            <form onSubmit={handleCreateTeam} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Team Name</label>
                <input 
                  type="text" 
                  required 
                  maxLength="30"
                  value={createData.name}
                  onChange={(e) => setCreateData({...createData, name: e.target.value})}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g. Anand Avengers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Sport</label>
                <select 
                  value={createData.sport}
                  onChange={(e) => setCreateData({...createData, sport: e.target.value})}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                >
                  <option value="cricket">Cricket</option>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="tennis">Tennis</option>
                  <option value="badminton">Badminton</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Logo URL (Optional)</label>
                <input 
                  type="url" 
                  value={createData.logo}
                  onChange={(e) => setCreateData({...createData, logo: e.target.value})}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <button 
                type="submit" 
                disabled={createLoading}
                className="w-full btn-primary py-3 rounded-xl font-bold mt-2"
              >
                {createLoading ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </div>
        )}

        {/* Join Team Tab */}
        {activeTab === 'join' && (
          <div className="max-w-md mx-auto glass-panel p-8 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Join a Team</h2>
            
            {joinError && <div className="mb-4 p-3 bg-red-950/50 text-red-400 text-sm rounded-lg border border-red-900/50">{joinError}</div>}
            {joinSuccess && <div className="mb-4 p-3 bg-emerald-950/50 text-emerald-400 text-sm rounded-lg border border-emerald-900/50 font-medium">{joinSuccess}</div>}
            
            <form onSubmit={handleJoinTeam} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Enter 6-Digit Team Code</label>
                <input 
                  type="text" 
                  required 
                  maxLength="6"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="glass-input w-full px-4 py-3 rounded-xl text-white font-mono text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-brand-500 outline-none uppercase"
                  placeholder="XXXXXX"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">Ask your team captain for the invite code.</p>
              </div>

              <button 
                type="submit" 
                disabled={joinLoading || joinCode.length !== 6}
                className="w-full btn-primary py-3 rounded-xl font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinLoading ? 'Joining...' : 'Join Team'}
              </button>
            </form>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardTeam && (
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 animate-fadeIn relative">
            <button 
              onClick={() => setActiveTab('my-teams')}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Team Info Side */}
              <div className="md:w-1/3 flex flex-col items-center text-center space-y-4">
                <img src={dashboardTeam.logo} alt={dashboardTeam.name} className="h-32 w-32 rounded-full border-4 border-brand-500/50 object-cover shadow-lg shadow-brand-900/20" />
                <div>
                  <h2 className="text-3xl font-black text-white">{dashboardTeam.name}</h2>
                  <span className="text-brand-400 font-bold uppercase tracking-widest text-xs mt-1 block">{dashboardTeam.sport}</span>
                </div>
                
                <div className="w-full bg-gray-950/50 rounded-xl p-4 border border-gray-800 text-left space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">MMR Rating</span>
                    <span className="text-yellow-500 font-bold">{dashboardTeam.stats?.rating || 1000}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Matches Played</span>
                    <span className="text-white font-bold">{dashboardTeam.stats?.matchesPlayed || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Win Rate</span>
                    <span className="text-emerald-400 font-bold">
                      {getWinRate(dashboardTeam.stats)}%
                    </span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-gray-800">
                    <span className="block text-gray-400 text-xs text-center mb-1">Invite Code</span>
                    <div className="bg-gray-900 text-cyan-400 text-xl font-mono font-black text-center py-2 rounded-lg tracking-[0.3em]">
                      {dashboardTeam.teamCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roster Side */}
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Team Roster ({dashboardTeam.members.length + 1} Players)</h3>
                <div className="space-y-3">
                  {/* Captain Row */}
                  <div className="flex items-center justify-between p-4 bg-brand-950/20 border border-brand-900/40 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
                        {dashboardTeam.captain.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold flex items-center">
                          {dashboardTeam.captain.name} 
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-500 rounded uppercase tracking-wider">Captain</span>
                        </div>
                        <div className="text-xs text-brand-400">{dashboardTeam.captainPosition || 'Unassigned'}</div>
                      </div>
                    </div>
                    
                    {(user._id === dashboardTeam.captain._id) && (
                      <select 
                        className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-500 outline-none"
                        value={dashboardTeam.captainPosition || 'Unassigned'}
                        onChange={(e) => handleUpdateRole(dashboardTeam.captain._id, e.target.value)}
                      >
                        <option value="Unassigned">Unassigned</option>
                        <option value="Batsman">Batsman</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-Rounder">All-Rounder</option>
                        <option value="Wicket Keeper">Wicket Keeper</option>
                        <option value="Forward">Forward</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Defender">Defender</option>
                        <option value="Goalkeeper">Goalkeeper</option>
                      </select>
                    )}
                  </div>

                  {/* Members Rows */}
                  {dashboardTeam.members.map(member => (
                    <div key={member._id} className="flex items-center justify-between p-4 bg-gray-900/30 border border-gray-800 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                          {member.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-bold">{member.user.name}</div>
                          <div className="text-xs text-gray-400">{member.position || 'Unassigned'}</div>
                        </div>
                      </div>
                      
                      {(user._id === dashboardTeam.captain._id || user._id === member.user._id) && (
                        <select 
                          className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-500 outline-none"
                          value={member.position || 'Unassigned'}
                          onChange={(e) => handleUpdateRole(member.user._id, e.target.value)}
                        >
                          <option value="Unassigned">Unassigned</option>
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-Rounder">All-Rounder</option>
                          <option value="Wicket Keeper">Wicket Keeper</option>
                          <option value="Forward">Forward</option>
                          <option value="Midfielder">Midfielder</option>
                          <option value="Defender">Defender</option>
                          <option value="Goalkeeper">Goalkeeper</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    );
  };
  
  export default Teams;
