import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { Swords, MapPin, Calendar, Clock, Shield, Plus, X, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';

const BattleBoard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'my-battles'
  
  const [challenges, setChallenges] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [acceptingId, setAcceptingId] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  
  // Create Challenge State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [turfs, setTurfs] = useState([]);
  const [createData, setCreateData] = useState({
    title: '',
    turfId: '',
    date: '',
    startTime: '',
    endTime: '',
    wager: 0
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchData();
  }, [user, activeTab, selectedTeam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'board') {
        const [boardRes, teamsRes, turfsRes] = await Promise.all([
          axiosInstance.get('/matches/board'),
          user ? axiosInstance.get('/teams/my-teams') : Promise.resolve({ data: { data: [] } }),
          axiosInstance.get('/turfs')
        ]);
        
        if (boardRes.data.success) setChallenges(boardRes.data.data);
        if (turfsRes.data.success) setTurfs(turfsRes.data.data);
        
        if (teamsRes.data?.success && myTeams.length === 0) {
          const captainTeams = teamsRes.data.data.filter(t => t.captain._id === user?._id || t.captain === user?._id);
          setMyTeams(captainTeams);
          if (captainTeams.length > 0 && !selectedTeam) setSelectedTeam(captainTeams[0]._id);
        }
      } else if (activeTab === 'my-battles' && selectedTeam) {
        const res = await axiosInstance.get(`/matches/team/${selectedTeam}`);
        if (res.data.success) setMyMatches(res.data.data);
      }
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!selectedTeam) {
      setCreateError("You must select a team to issue a challenge from.");
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const payload = { ...createData, teamAId: selectedTeam };
      const res = await axiosInstance.post('/matches/challenge', payload);
      
      if (res.data.success) {
        setShowCreateModal(false);
        setCreateData({ title: '', turfId: '', date: '', startTime: '', endTime: '', wager: 0 });
        setActiveTab('my-battles');
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to post challenge.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAcceptChallenge = async (matchId) => {
    if (!selectedTeam) {
      alert("You need to select a team you are the captain of to accept a challenge.");
      return;
    }

    setAcceptingId(matchId);
    try {
      const res = await axiosInstance.post(`/matches/${matchId}/accept`, { teamBId: selectedTeam });
      if (res.data.success) {
        alert("Challenge Accepted! Switch to 'My Battles' to view it.");
        setChallenges(challenges.filter(c => c._id !== matchId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept challenge.');
    } finally {
      setAcceptingId(null);
    }
  };

  const [paymentLoading, setPaymentLoading] = useState(null);

  const handlePayment = async (matchId, matchAmount) => {
    if (!selectedTeam) {
      alert("Select the team you are paying for at the top of the page first.");
      return;
    }

    setPaymentLoading(matchId);
    try {
      const orderRes = await axiosInstance.post(`/matches/${matchId}/payment/create-order`);
      
      if (orderRes.data.success) {
        const { orderId, amount, currency } = orderRes.data.data;
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SsI2LJqhZvVWVM',
          amount: amount.toString(),
          currency: currency,
          name: 'TurfWars Match Battle',
          description: '50% Split Share Payment',
          order_id: orderId,
          handler: async function (response) {
            try {
              const verifyRes = await axiosInstance.post(`/matches/${matchId}/payment/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                teamId: selectedTeam
              });

              if (verifyRes.data.success) {
                alert('Payment successful! Your 50% split is verified.');
                fetchData(); // Refresh UI
              }
            } catch (err) {
              alert('Payment verification failed.');
            }
          },
          theme: { color: "#ef4444" } // Red for battle!
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initialize payment gateway.');
    } finally {
      setPaymentLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'accepted': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative min-h-[80vh]">
      <div className="bg-mesh"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Swords className="h-8 w-8 mr-3 text-red-500" />
            Battle Board
          </h1>
          <p className="text-gray-400 text-sm mt-1">Accept open challenges from rival teams and fight for glory.</p>
        </div>
        
        {myTeams.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="glass-panel p-2 rounded-xl flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-400 uppercase ml-2">Playing As:</span>
              <select 
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
              >
                {myTeams.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-900/30"
            >
              <Plus className="h-4 w-4" />
              <span>Post Challenge</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {user && (
        <div className="flex space-x-1 glass-panel p-1 rounded-xl w-fit mb-8 relative z-10">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'board' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Public Arena
          </button>
          <button
            onClick={() => setActiveTab('my-battles')}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'my-battles' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            My Battles
          </button>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl w-full max-w-lg border border-gray-800 overflow-hidden shadow-2xl relative animate-fadeIn">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Swords className="h-5 w-5 mr-2 text-red-500" />
                Issue Open Challenge
              </h2>
            </div>
            
            <form onSubmit={handleCreateChallenge} className="p-6 space-y-4">
              {createError && <div className="p-3 bg-red-950/50 text-red-400 text-sm rounded-lg border border-red-900/50">{createError}</div>}
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Challenge Title</label>
                <input 
                  type="text" required maxLength="50"
                  value={createData.title}
                  onChange={(e) => setCreateData({...createData, title: e.target.value})}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  placeholder="e.g., Looking for a 7v7 clash!"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Select Arena (Turf)</label>
                <select 
                  required
                  value={createData.turfId}
                  onChange={(e) => setCreateData({...createData, turfId: e.target.value})}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white outline-none"
                >
                  <option value="">-- Choose Turf --</option>
                  {turfs.map(t => (
                    <option key={t._id} value={t._id}>{t.name} (₹{t.pricePerHour}/hr)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Date</label>
                  <input 
                    type="date" required
                    min={new Date().toISOString().split('T')[0]}
                    value={createData.date}
                    onChange={(e) => setCreateData({...createData, date: e.target.value})}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">TurfPoints Wager</label>
                  <input 
                    type="number" min="0" max="1000" step="50"
                    value={createData.wager}
                    onChange={(e) => setCreateData({...createData, wager: Number(e.target.value)})}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-white outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Start Time</label>
                  <input 
                    type="time" required
                    value={createData.startTime}
                    onChange={(e) => setCreateData({...createData, startTime: e.target.value})}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">End Time</label>
                  <input 
                    type="time" required
                    value={createData.endTime}
                    onChange={(e) => setCreateData({...createData, endTime: e.target.value})}
                    className="glass-input w-full px-4 py-2.5 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={createLoading}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold mt-4 transition-all"
              >
                {createLoading ? 'Posting...' : 'Post Challenge to Board'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 p-4 bg-red-900/20 rounded-xl">{error}</div>
        ) : activeTab === 'board' ? (
          /* Public Arena (Open Challenges) */
          challenges.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl border border-gray-800">
              <Swords className="h-16 w-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Open Challenges</h3>
              <p className="text-gray-400 mb-6">The board is quiet right now. Check back later or create your own challenge!</p>
              {myTeams.length > 0 && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg"
                >
                  Be the first to challenge
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map(challenge => (
                <div key={challenge._id} className="glass-panel rounded-2xl p-6 border border-red-900/30 hover:border-red-500/50 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-red-500/10 blur-[40px] pointer-events-none"></div>
                  
                  <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-800">
                    <div className="relative">
                      <img src={challenge.teamA.logo} alt={challenge.teamA.name} className="h-16 w-16 rounded-full border-2 border-red-500/50 object-cover" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-0.5">Challenger</span>
                      <h3 className="text-lg font-black text-white leading-tight">{challenge.teamA.name}</h3>
                      <div className="text-xs text-yellow-500 font-bold mt-1">⭐ {challenge.teamA.stats?.rating || 1000} MMR</div>
                    </div>
                  </div>

                  <h4 className="text-md font-bold text-gray-200 mb-3">{challenge.title}</h4>
                  
                  <div className="space-y-2 text-sm text-gray-400 mb-6 bg-gray-950/40 p-3 rounded-xl border border-gray-800/50">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-cyan-400 shrink-0" />
                      <span className="truncate">{challenge.turf?.name || 'Unknown Turf'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-brand-400 shrink-0" />
                      <span>{new Date(challenge.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-brand-400 shrink-0" />
                      <span>{challenge.startTime} - {challenge.endTime}</span>
                    </div>
                    {challenge.wager > 0 && (
                      <div className="flex items-center text-yellow-400 font-bold pt-1">
                        <Swords className="h-4 w-4 mr-2 shrink-0" />
                        <span>{challenge.wager} TurfPoints Wager</span>
                      </div>
                    )}
                  </div>

                  {user ? (
                    myTeams.length > 0 ? (
                      challenge.teamA._id === selectedTeam ? (
                        <button disabled className="w-full py-3 bg-gray-800 text-gray-500 rounded-xl text-sm font-bold cursor-not-allowed">
                          Your Team's Challenge
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAcceptChallenge(challenge._id)}
                          disabled={acceptingId === challenge._id}
                          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-red-900/30 transition-all hover:scale-[1.02]"
                        >
                          {acceptingId === challenge._id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto"></div>
                          ) : 'Accept Challenge'}
                        </button>
                      )
                    ) : (
                      <Link to="/teams" className="w-full flex justify-center py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-bold border border-gray-700">
                        Create a Team to Accept
                      </Link>
                    )
                  ) : (
                    <Link to="/login" className="w-full flex justify-center py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold">
                      Login to Accept
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* My Battles */
          myMatches.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl border border-gray-800">
              <Shield className="h-16 w-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Active Battles</h3>
              <p className="text-gray-400 mb-6">Your team hasn't participated in any matches yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myMatches.map(match => (
                <div key={match._id} className="glass-panel rounded-2xl p-5 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Team A vs Team B */}
                  <div className="flex items-center justify-center w-full md:w-2/3 space-x-4 md:space-x-8">
                    <div className="flex flex-col items-center text-center">
                      <img src={match.teamA?.logo} alt={match.teamA?.name} className="h-12 w-12 rounded-full border-2 border-brand-500 mb-2 object-cover" />
                      <span className="text-sm font-bold text-white">{match.teamA?.name}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(match.status)} mb-2`}>
                        {match.status}
                      </span>
                      <Swords className="h-6 w-6 text-gray-600" />
                    </div>

                    <div className="flex flex-col items-center text-center">
                      {match.teamB ? (
                        <>
                          <img src={match.teamB.logo} alt={match.teamB.name} className="h-12 w-12 rounded-full border-2 border-blue-500 mb-2 object-cover" />
                          <span className="text-sm font-bold text-white">{match.teamB.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full border-2 border-dashed border-gray-600 mb-2 flex items-center justify-center text-gray-500 text-xl font-bold">?</div>
                          <span className="text-sm font-bold text-gray-500">Waiting...</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="w-full md:w-1/3 bg-gray-950/40 p-4 rounded-xl border border-gray-800 text-sm text-gray-400 space-y-2">
                    <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-cyan-400" />{match.turf?.name}</div>
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-brand-400" />{new Date(match.date).toLocaleDateString()}</div>
                    <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-brand-400" />{match.startTime} - {match.endTime}</div>
                    
                    {match.status === 'accepted' && (
                      <div className="pt-3 mt-3 border-t border-gray-800 space-y-2">
                        {/* Display Payment Statuses */}
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-2">
                          <span className={match.teamAPaid ? 'text-emerald-400' : 'text-red-400'}>
                            {match.teamA.name}: {match.teamAPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          <span className={match.teamBPaid ? 'text-emerald-400' : 'text-red-400'}>
                            {match.teamB.name}: {match.teamBPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>

                        {/* Payment Button */}
                        {((match.teamA._id === selectedTeam && !match.teamAPaid) || 
                          (match.teamB._id === selectedTeam && !match.teamBPaid)) ? (
                          <button 
                            onClick={() => handlePayment(match._id, match.bookingAmount / 2)}
                            disabled={paymentLoading === match._id}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center transition-all"
                          >
                            {paymentLoading === match._id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mx-auto"></div>
                            ) : (
                              <>
                                <IndianRupee className="h-3 w-3 mr-1" />
                                Pay Split Share (₹{match.bookingAmount / 2})
                              </>
                            )}
                          </button>
                        ) : (
                          <button disabled className="w-full bg-emerald-900/50 text-emerald-400 border border-emerald-900 font-bold py-2 rounded-lg text-xs flex items-center justify-center cursor-not-allowed">
                            ✓ You have paid your share
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BattleBoard;
