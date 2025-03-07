import { Link } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { TopDrivers } from './TopDrivers';
import { Shield, MapPin, Clock, Phone, MessageCircle, Car, Users, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

interface RideRequest {
  id: string;
  rider_name: string;
  contact: string;
  from_area: string;
  to_area: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'accepted' | 'completed';
}

export function Home() {
  const { user } = useAuth();
  const [isDriver, setIsDriver] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkDriverStatus = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', user.id)
          .single();
        setIsDriver(!!data);
      } catch (err) {
        console.error('Error:', err);
      }
    };

    checkDriverStatus();
  }, [user]);

  useEffect(() => {
    const checkDriverAndFetchRequests = async () => {
      if (!user) {
        console.log('No user logged in');
        return;
      }

      try {
        console.log('Checking driver status for user:', user.id);
        
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', user.id)
          .single();

        if (driverError) {
          console.error('Error checking driver status:', driverError);
          return;
        }

        const isDriverUser = !!driverData;
        console.log('Is user a driver?', isDriverUser);
        setIsDriver(isDriverUser);

        if (isDriverUser) {
          fetchRideRequests();
        }
      } catch (err) {
        console.error('Error in checkDriverStatus:', err);
      }
    };

    const fetchRideRequests = async () => {
      try {
        setRequestsLoading(true);
        console.log('Starting to fetch ride requests...');

        const now = new Date();
        const currentDate = format(now, 'yyyy-MM-dd');
        const currentTime = format(now, 'HH:mm:ss');

        console.log('Fetching requests with params:', { currentDate, currentTime });

        const { data, error } = await supabase
          .from('ride_requests')
          .select('*')
          .eq('status', 'pending')
          .gte('date', currentDate)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching ride requests:', error);
          throw error;
        }

        // Filter out requests whose end time has passed
        const activeRequests = data?.filter(request => {
          const requestDate = request.date;
          const requestEndTime = request.end_time;
          
          // If the date is today, check the time
          if (requestDate === currentDate) {
            return requestEndTime > currentTime;
          }
          
          // If the date is in the future, include it
          return requestDate > currentDate;
        }) || [];

        console.log('Active ride requests:', activeRequests);
        setRideRequests(activeRequests);
      } catch (err) {
        console.error('Error in fetchRideRequests:', err);
        setError('Failed to load ride requests');
      } finally {
        setRequestsLoading(false);
      }
    };

    // Initial check and fetch
    checkDriverAndFetchRequests();

    // Set up periodic refresh every minute
    const intervalId = setInterval(() => {
      if (isDriver) {
        fetchRideRequests();
      }
    }, 60000);

    // Set up real-time subscription
    const subscription = supabase
      .channel('ride_requests_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ride_requests',
          filter: 'status=eq.pending'
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          if (isDriver) {
            fetchRideRequests();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, [user]); // Only depend on user changes

  const RideRequestsSection = () => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold gradient-text mb-6">Available Ride Requests</h2>
      {requestsLoading ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="animate-pulse text-neon-blue">Loading ride requests...</div>
        </div>
      ) : rideRequests.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-gray-400">No pending ride requests available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rideRequests.map((request) => (
            <div key={request.id} className="glass-card rounded-2xl p-6 hover-float">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {request.rider_name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {format(parseISO(request.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-4 h-4 mr-2 text-neon-blue" />
                  {request.from_area} → {request.to_area}
                </div>
                <div className="flex items-center text-gray-300">
                  <Clock className="w-4 h-4 mr-2 text-neon-blue" />
                  {format(parseISO(`2000-01-01T${request.start_time}`), 'h:mm a')} - 
                  {format(parseISO(`2000-01-01T${request.end_time}`), 'h:mm a')}
                </div>
              </div>

              <div className="flex space-x-3">
                <a
                  href={`tel:${request.contact}`}
                  className="flex-1 flex items-center justify-center p-2 rounded-lg 
                  bg-deep-space/50 text-gray-300 hover:text-neon-blue 
                  hover:bg-deep-space/70 transition-all duration-200"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${request.contact}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center p-2 rounded-lg 
                  bg-deep-space/50 text-gray-300 hover:text-neon-blue 
                  hover:bg-deep-space/70 transition-all duration-200"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span>Message</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background with Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/car-ride.jpg)',
              backgroundPosition: 'center 25%'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-space/95 via-deep-space/80 to-deep-space/95" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              <span className="gradient-text">Your Journey</span>
              <br />
              <span className="text-white">Our Priority</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Connect with verified drivers, share your journey, and travel with confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!user ? (
                <Link
                  to="/auth"
                  className="auth-button text-lg px-8 py-4 inline-flex items-center"
                >
                  Get Started
                  <Zap className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/find-ride"
                    className="auth-button text-lg px-8 py-4 inline-flex items-center"
                  >
                    Find a Ride
                    <Car className="ml-2 w-5 h-5" />
                  </Link>
                  {!isDriver && (
                    <Link
                      to="/request-ride"
                      className="auth-button text-lg px-8 py-4 inline-flex items-center
                      bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      Request a Ride
                      <Users className="ml-2 w-5 h-5" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-6 hover-float">
              <div className="text-4xl font-bold gradient-text mb-2">500+</div>
              <div className="text-gray-400">Active Drivers</div>
            </div>
            <div className="glass-card rounded-2xl p-6 hover-float">
              <div className="text-4xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-gray-400">Happy Riders</div>
            </div>
            <div className="glass-card rounded-2xl p-6 hover-float">
              <div className="text-4xl font-bold gradient-text mb-2">98%</div>
              <div className="text-gray-400">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-24 bg-deep-space/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold gradient-text text-center mb-16">
            Why Choose RideMate?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-8 hover-float">
              <div className="text-neon-blue mb-6">
                <Shield className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                Verified Drivers
              </h3>
              <p className="text-gray-400">
                All our drivers undergo thorough background checks and verification processes.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 hover-float">
              <div className="text-neon-blue mb-6">
                <MapPin className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                Smart Routes
              </h3>
              <p className="text-gray-400">
                Advanced matching algorithm to find the perfect ride for your journey.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 hover-float">
              <div className="text-neon-blue mb-6">
                <Clock className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                Real-time Updates
              </h3>
              <p className="text-gray-400">
                Stay informed with instant notifications and live tracking features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Show TopDrivers only for logged-in users */}
      {user && (
        <div className="relative z-10 py-24 bg-deep-space/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TopDrivers />
          </div>
        </div>
      )}
    </div>
  );
} 