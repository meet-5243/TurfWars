import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerRoute from './components/OwnerRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TurfDetails from './pages/TurfDetails';
import MyBookings from './pages/MyBookings';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerTurfForm from './pages/OwnerTurfForm';
import OwnerBookings from './pages/OwnerBookings';
import Profile from './pages/Profile';

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
