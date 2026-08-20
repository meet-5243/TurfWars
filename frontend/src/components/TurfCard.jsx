import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Activity, IndianRupee } from 'lucide-react';

const TurfCard = ({ turf }) => {
  const { _id, name, location, city, pricePerHour, sport, images, capacity } = turf;

  // Fallback beautiful backgrounds based on sport type
  const getSportFallbackGradient = (sportType) => {
    switch (sportType) {
      case 'cricket':
        return 'from-amber-700 to-stone-900';
      case 'pickle ball':
        return 'from-lime-600 to-emerald-950';
      default:
        return 'from-brand-900 to-slate-950';
    }
  };

  const imageSrc = images && images.length > 0 ? images[0] : null;

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full group">
      {/* Turf Image / Visual Fallback */}
      <div className="relative h-48 overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getSportFallbackGradient(sport)} flex flex-col justify-between p-4 relative`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60"></div>
            <span className="self-end px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-black/40 border border-white/10 backdrop-blur-md">
              {sport}
            </span>
            <div>
              <h4 className="text-xl font-extrabold text-white tracking-wide truncate">{name}</h4>
              <p className="text-xs text-white/70 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1 text-brand-400" />
                {city}
              </p>
            </div>
          </div>
        )}

        {/* Hover overlay indicator */}
        <div className="absolute inset-0 bg-brand-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {imageSrc && (
            <div className="flex justify-between items-start mb-3">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md bg-brand-950 border border-brand-900 text-brand-400">
                {sport}
              </span>
            </div>
          )}

          {imageSrc && (
            <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors duration-200 line-clamp-1">
              {name}
            </h3>
          )}

          <p className="text-sm text-gray-400 mt-1 flex items-start line-clamp-2">
            <MapPin className="h-4 w-4 mr-1 text-brand-500 shrink-0 mt-0.5" />
            <span>{location}, {city}</span>
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Users className="h-3.5 w-3.5 text-brand-400" />
              <span>Cap: {capacity} Players</span>
            </div>
            <div className="flex items-center space-x-1 justify-end">
              <Activity className="h-3.5 w-3.5 text-brand-400" />
              <span className="capitalize">{sport}</span>
            </div>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-800">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Price per Hour</span>
            <div className="flex items-center text-lg font-extrabold text-white">
              <IndianRupee className="h-4 w-4 text-brand-400" />
              <span>{pricePerHour}</span>
            </div>
          </div>
          <Link
            to={`/turfs/${_id}`}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/10 hover:shadow-brand-600/25 transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TurfCard;
