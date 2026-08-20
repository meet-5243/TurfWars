import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import TurfCard from '../components/TurfCard';
import { Search, MapPin, Activity, Sparkles, Smile } from 'lucide-react';

const Home = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('cricket');
  const [selectedCity, setSelectedCity] = useState('');

  // Distinct cities list (dynamically generated from fetched turfs)
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const res = await axiosInstance.get('/turfs');
        if (res.data.success) {
          setTurfs(res.data.data);
          
          // Generate unique cities
          const uniqueCities = [...new Set(res.data.data.map(t => t.city.trim()))].filter(Boolean);
          setCities(uniqueCities);
        }
      } catch (err) {
        console.error('Error fetching turfs:', err);
        setError('Failed to fetch turfs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTurfs();
  }, []);

  // Filtering logic
  const filteredTurfs = turfs.filter((turf) => {
    const matchesSearch = turf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          turf.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport ? turf.sport === selectedSport : true;
    const matchesCity = selectedCity ? turf.city.toLowerCase() === selectedCity.toLowerCase() : true;
    
    return matchesSearch && matchesSport && matchesCity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <div className="bg-mesh"></div>
      
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 mb-10 border border-brand-900/20 text-center sm:text-left">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/40 via-transparent to-transparent"></div>
        <div className="absolute top-4 right-4 animate-bounce">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-950/60 border border-brand-800 text-brand-400">
            <Sparkles className="h-3 w-3" />
            <span>Ready to Play?</span>
          </span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Claim Your Spot. <br />
            <span className="bg-gradient-to-r from-brand-400 to-green-400 bg-clip-text text-transparent">
              Own The Turf.
            </span>
          </h1>
          <p className="mt-4 text-gray-300 text-base sm:text-lg leading-relaxed">
            Book slots instantly for Cricket and Pickle Ball. High quality surfaces. Offline payment. Quick approval.
          </p>
        </div>
      </div>

      {/* Sport Category Toggle Switch */}
      <div className="flex justify-center mb-8">
        <div className="relative flex p-1 bg-gray-900/60 border border-gray-800/80 rounded-2xl backdrop-blur-md shadow-inner">
          {/* Active Highlight Slider */}
          <div
            className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-300 ease-out shadow-lg shadow-brand-600/20"
            style={{
              left: selectedSport === 'cricket' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)'
            }}
          />
          <button
            onClick={() => setSelectedSport('cricket')}
            className={`relative z-10 px-8 py-3 rounded-xl font-bold text-sm transition-colors duration-200 min-w-[140px] text-center ${
              selectedSport === 'cricket' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Cricket
          </button>
          <button
            onClick={() => setSelectedSport('pickle ball')}
            className={`relative z-10 px-8 py-3 rounded-xl font-bold text-sm transition-colors duration-200 min-w-[140px] text-center ${
              selectedSport === 'pickle ball' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Pickle Ball
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel rounded-2xl p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search by turf name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 block w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm"
          />
        </div>

        {/* City Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-500" />
          </div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="glass-input pl-10 block w-full px-3 py-2.5 rounded-xl text-white placeholder-gray-500 text-sm appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {cities.map((city, idx) => (
              <option key={idx} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500 mb-4"></div>
          <span className="text-gray-400 text-sm font-medium">Fetching active grounds...</span>
        </div>
      ) : error ? (
        <div className="glass-panel text-center p-12 rounded-2xl border border-red-950/20 max-w-lg mx-auto">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      ) : filteredTurfs.length === 0 ? (
        <div className="glass-panel text-center p-16 rounded-2xl border border-gray-800 max-w-lg mx-auto flex flex-col items-center">
          <Smile className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Turfs Found</h3>
          <p className="text-gray-400 text-sm">
            We couldn't find any active turfs matching your criteria. Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurfs.map((turf) => (
            <TurfCard key={turf._id} turf={turf} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
