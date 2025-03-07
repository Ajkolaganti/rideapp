import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Car, Search, MessageCircle, Star, Zap } from 'lucide-react';
import { AuthProvider } from './components/auth/AuthProvider';
import { AuthPage } from './components/auth/AuthPage';
import { Navigation } from './components/Navigation';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { TopDrivers } from './components/TopDrivers';
import { DriverDashboard } from './components/DriverDashboard';
import { FindRide } from './components/FindRide';
import { RequestRide } from './components/RequestRide';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Driver } from './types';
import { supabase } from './lib/supabase';
import { Home } from './components/Home';

const initialDrivers: Driver[] = [
  {
    id: '1',
    name: 'John Doe',
    contact: '1234567890',
    carModel: 'Tesla Model 3',
    availability: [],
    discount: {
      enabled: true,
      percentage: 15
    },
    ridesOffered: 25,
    isSubscribed: true
  },
  {
    id: '2',
    name: 'Jane Smith',
    contact: '0987654321',
    carModel: 'Toyota Camry',
    availability: [],
    discount: {
      enabled: false,
      percentage: 0
    },
    ridesOffered: 42,
    isSubscribed: true
  }
];

function App() {
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('drivers', initialDrivers);

  useEffect(() => {
    // ... existing driver fetching logic
  }, []);

  return (
    <AuthProvider>
      <Router>
        {/* Global Background */}
        <div className="fixed inset-0 -z-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/car-ride.jpg)',
              backgroundPosition: 'center 25%'
            }}
          />
          <div className="absolute inset-0 bg-deep-space/95 backdrop-blur-[2px]" />
        </div>

        {/* App Content */}
        <div className="relative min-h-screen">
          <Navigation />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/find-ride"
              element={
                <PrivateRoute>
                  <FindRide />
                </PrivateRoute>
              }
            />
            <Route
              path="/request-ride"
              element={
                <PrivateRoute>
                  <RequestRide />
                </PrivateRoute>
              }
            />
            <Route
              path="/driver-dashboard"
              element={
                <PrivateRoute>
                  <DriverDashboard drivers={drivers} setDrivers={setDrivers} />
                </PrivateRoute>
              }
            />
          </Routes>

          {/* Footer */}
          <footer className="bg-deep-space bg-opacity-90 backdrop-blur-sm py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-lg font-semibold mb-4 gradient-text">About Us</h4>
                  <p className="text-gray-400">Pioneering the future of transportation with smart technology and trusted connections.</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 gradient-text">Quick Links</h4>
                  <ul className="space-y-2">
                    <li><a href="/find-ride" className="text-gray-400 hover:text-neon-blue transition-colors">Find a Ride</a></li>
                    <li><a href="/driver-dashboard" className="text-gray-400 hover:text-neon-blue transition-colors">Become a Driver</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">How it Works</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 gradient-text">Contact</h4>
                  <p className="text-gray-400">24/7 Support Available</p>
                  <a href="mailto:support@rideapp.com" className="text-neon-blue hover:text-blue-400 transition-colors">support@rideapp.com</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;