import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Car, Search, MessageCircle, Star, Zap } from 'lucide-react';
import { AuthProvider } from './components/auth/AuthProvider';
import { AuthPage } from './components/auth/AuthPage';
import { Navigation } from './components/Navigation';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { TopDrivers } from './components/TopDrivers';
import { DriverDashboard } from './components/DriverDashboard';
import { FindRide } from './components/FindRide';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Driver } from './types';

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

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-deep-space text-white">
          <Navigation />
          
          <Routes>
            <Route path="/" element={
              <>
                {/* Hero Section */}
                <div 
                  className="relative bg-cover bg-center h-screen"
                  style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
                  }}
                >
                  <div className="absolute inset-0 bg-deep-space bg-opacity-70 backdrop-blur-sm" />
                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex flex-col justify-center h-full">
                      <h1 className="text-4xl md:text-7xl font-bold mb-6 gradient-text animate-float">
                        Future of Ride Sharing
                      </h1>
                      <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                        Experience seamless transportation with our network of verified drivers. Smart matching, instant booking, and secure rides.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href="/find-ride"
                          className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-medium rounded-lg hover:shadow-neon-hover transition-all duration-300"
                        >
                          <Search className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                          Find a Ride
                        </a>
                        <a
                          href="/driver-dashboard"
                          className="group inline-flex items-center justify-center px-8 py-4 glass-card text-white text-lg font-medium rounded-lg hover:neon-border transition-all duration-300"
                        >
                          <Car className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                          Offer a Ride
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-card rounded-xl p-8 hover-float">
                      <div className="w-14 h-14 bg-gradient-radial from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 gradient-text">Smart Search</h3>
                      <p className="text-gray-300">AI-powered ride matching for optimal routes and timing.</p>
                    </div>
                    <div className="glass-card rounded-xl p-8 hover-float">
                      <div className="w-14 h-14 bg-gradient-radial from-green-500 to-green-700 rounded-full flex items-center justify-center mb-6">
                        <MessageCircle className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 gradient-text">Instant Connect</h3>
                      <p className="text-gray-300">Real-time communication with drivers through secure channels.</p>
                    </div>
                    <div className="glass-card rounded-xl p-8 hover-float">
                      <div className="w-14 h-14 bg-gradient-radial from-purple-500 to-purple-700 rounded-full flex items-center justify-center mb-6">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 gradient-text">Dynamic Pricing</h3>
                      <p className="text-gray-300">Smart discounts and rewards for frequent riders.</p>
                    </div>
                  </div>

                  {/* Top Drivers Section */}
                  <TopDrivers drivers={drivers} />
                </div>
              </>
            } />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/driver-dashboard"
              element={
                <PrivateRoute>
                  <DriverDashboard drivers={drivers} setDrivers={setDrivers} />
                </PrivateRoute>
              }
            />
            <Route
              path="/find-ride"
              element={
                <PrivateRoute>
                  <FindRide drivers={drivers} />
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