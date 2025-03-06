import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const checkDriverStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking driver status:', error);
          return;
        }

        setIsDriver(!!data);
      } catch (err) {
        console.error('Error:', err);
      }
    };

    checkDriverStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed w-full top-0 z-50">
      <div className="glass-card backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                  <Car className="w-6 h-6 text-neon-blue group-hover:animate-pulse" />
                </div>
                <span className="ml-2 text-xl font-bold gradient-text">RideShare</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {user ? (
                <>
                  <Link
                    to="/find-ride"
                    className="nav-link hover:text-neon-blue transition-colors"
                  >
                    Find a Ride
                  </Link>
                  {!isDriver && (
                    <Link
                      to="/driver-dashboard"
                      className="nav-link hover:text-neon-blue transition-colors"
                    >
                      Offer Rides
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-2 rounded-lg bg-deep-space/50 
                    text-gray-300 hover:text-neon-blue hover:bg-deep-space/70 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="nav-link hover:text-neon-blue transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 
                    text-white hover:shadow-neon-hover transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg bg-deep-space/50 text-gray-300 
                hover:text-neon-blue hover:bg-deep-space/70 transition-all duration-200"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/find-ride"
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find a Ride
                  </Link>
                  {!isDriver && (
                    <Link
                      to="/driver-dashboard"
                      className="mobile-nav-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Offer Rides
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left mobile-nav-link flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    className="mobile-nav-link bg-gradient-to-r from-blue-600 to-purple-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}