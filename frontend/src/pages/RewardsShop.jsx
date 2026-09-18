import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Gift, Award, ShoppingBag } from 'lucide-react';

const RewardsShop = () => {
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await axiosInstance.get('/loyalty/points/balance');
        setPointsBalance(res.data.data.balance);
      } catch (err) {
        console.error('Error fetching points', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const items = [
    {
      id: 1,
      name: 'TurfWars Premium Sipper',
      description: 'Stay hydrated during your matches with our branded 750ml sipper bottle.',
      points: 500,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 2,
      name: 'TurfWars Official T-Shirt',
      description: 'Breathable, sweat-wicking athletic jersey for your next tournament.',
      points: 1200,
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 3,
      name: 'Sports Gym Bag',
      description: 'Spacious duffel bag to carry all your gear, shoes, and accessories.',
      points: 2000,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
    },
    {
      id: 4,
      name: 'TurfWars Captain Cap',
      description: 'Stylish snapback cap with embroidered TurfWars logo.',
      points: 800,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
    }
  ];

  const handleRedeem = (itemName, cost) => {
    if (pointsBalance < cost) {
      alert(`You need ${cost - pointsBalance} more TurfPoints to redeem this item!`);
    } else {
      alert(`Awesome! You have enough points to redeem the ${itemName}. (Full redemption flow coming soon!)`);
    }
  };

  if (loading) return <div className="p-8 text-center text-turf-accent">Loading Rewards Shop...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center">
            <Gift className="mr-3 h-8 w-8 text-turf-accent" />
            Rewards Shop
          </h1>
          <p className="text-gray-400 mt-2">Redeem your hard-earned TurfPoints for exclusive merchandise.</p>
        </div>
        
        <div className="mt-6 md:mt-0 bg-gray-900 border border-yellow-500/30 px-6 py-4 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.15)] flex items-center">
          <Award className="h-8 w-8 text-yellow-500 mr-3" />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Your Balance</p>
            <p className="text-2xl font-black text-yellow-500">{pointsBalance} <span className="text-sm font-semibold">pts</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col group hover:border-turf-accent transition-colors duration-300">
            <div className="h-48 overflow-hidden relative bg-gray-800">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute top-2 right-2 bg-yellow-500 text-gray-950 font-black px-3 py-1 rounded-full text-xs shadow-lg">
                {item.points} pts
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
              <p className="text-gray-400 text-sm flex-grow mb-6 leading-relaxed">{item.description}</p>
              
              <button 
                onClick={() => handleRedeem(item.name, item.points)}
                className={`w-full flex justify-center items-center py-2.5 rounded-xl text-sm font-bold transition-all ${
                  pointsBalance >= item.points 
                    ? 'bg-turf-accent text-gray-950 hover:bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {pointsBalance >= item.points ? 'Redeem Now' : 'Not Enough Points'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsShop;
