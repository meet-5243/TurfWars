import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerRoute from './components/OwnerRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TurfDetails from './pages/TurfDetails';
import BookTurf from './pages/BookTurf';
import MyBookings from './pages/MyBookings';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerTurfForm from './pages/OwnerTurfForm';
import OwnerBookings from './pages/OwnerBookings';
import Profile from './pages/Profile';
import Teams from './pages/Teams';
import BattleBoard from './pages/BattleBoard';
import MembershipDashboard from './pages/MembershipDashboard';
import AdminMembership from './pages/AdminMembership';
import AdminSettlements from './pages/AdminSettlements';
import RewardsShop from './pages/RewardsShop';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#080c14] text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/turfs/:id" element={<TurfDetails />} />
              <Route path="/turfs/:id/book" element={<BookTurf />} />

              {/* Player Protected Routes */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/membership"
                element={
                  <ProtectedRoute>
                    <MembershipDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop"
                element={
                  <ProtectedRoute>
                    <RewardsShop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <ProtectedRoute>
                    <Teams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/battles"
                element={
                  <ProtectedRoute>
                    <BattleBoard />
                  </ProtectedRoute>
                }
              />

              {/* Owner Protected Routes */}
              <Route
                path="/owner-dashboard"
                element={
                  <OwnerRoute>
                    <OwnerDashboard />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner-turfs/new"
                element={
                  <OwnerRoute>
                    <OwnerTurfForm />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner-turfs/edit/:id"
                element={
                  <OwnerRoute>
                    <OwnerTurfForm />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner-bookings"
                element={
                  <OwnerRoute>
                    <OwnerBookings />
                  </OwnerRoute>
                }
              />
              <Route
                path="/admin/membership"
                element={
                  <AdminRoute>
                    <AdminMembership />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settlements"
                element={
                  <AdminRoute>
                    <AdminSettlements />
                  </AdminRoute>
                }
              />
            </Routes>
          </main>
          {/* Footer */}
          <footer className="py-6 border-t border-gray-900 bg-gray-950/20 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} TurfWars Booking Portal. All rights reserved.
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
