import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDriver, setIsDriver] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleProtectedRoute = (path: string) => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-deep-space/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-neon-blue" />
            <span className="text-xl font-bold gradient-text">RideMate</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {!isDriver && (
                  <>
                    <Link
                      to="/find-ride"
                      className={`nav-link ${location.pathname === '/find-ride' ? 'text-neon-blue' : ''}`}
                    >
                      Find Ride
                    </Link>
                    <Link
                      to="/request-ride"
                      className={`nav-link ${location.pathname === '/request-ride' ? 'text-neon-blue' : ''}`}
                    >
                      Request Ride
                    </Link>
                  </>
                )}
                {isDriver && (
                  <Link
                    to="/driver-dashboard"
                    className={`nav-link ${location.pathname === '/driver-dashboard' ? 'text-neon-blue' : ''}`}
                  >
                    Driver Dashboard
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="nav-link"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="auth-button"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}