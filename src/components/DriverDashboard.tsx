import { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, Percent, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Driver } from '../types';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface DriverDashboardProps {
  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;
}

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

export function DriverDashboard({ drivers, setDrivers }: DriverDashboardProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    carModel: '',
    fromArea: '',
    toArea: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    discount: {
      enabled: false,
      percentage: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    const fetchRideRequests = async () => {
      try {
        setRequestsLoading(true);
        console.log('Starting to fetch ride requests...');

        // First verify that the current user is a driver
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('id')
          .eq('id', user?.id)
          .single();

        if (driverError || !driverData) {
          console.error('Not authorized as driver:', driverError);
          return;
        }

        const today = new Date();
        const formattedDate = format(today, 'yyyy-MM-dd');
        console.log('Fetching requests from date:', formattedDate);

        // Fetch ride requests
        const { data, error } = await supabase
          .from('ride_requests')
          .select(`
            id,
            rider_name,
            contact,
            from_area,
            to_area,
            date,
            start_time,
            end_time,
            status
          `)
          .eq('status', 'pending')
          .gte('date', formattedDate)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching ride requests:', error);
          throw error;
        }

        console.log('Fetched ride requests:', data);
        setRideRequests(data || []);
      } catch (err) {
        console.error('Error in fetchRideRequests:', err);
      } finally {
        setRequestsLoading(false);
      }
    };

    if (user) {
      fetchRideRequests();
    }

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
          fetchRideRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!user) {
      setError('You must be logged in to create a ride offer');
      setLoading(false);
      return;
    }
    
    try {
      // Start a Supabase transaction
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .upsert({
          id: user.id,
          name: formData.name,
          contact: formData.contact,
          car_model: formData.carModel,
          rides_offered: 0,
          is_subscribed: false
        })
        .select()
        .single();

      if (driverError) throw driverError;

      // Create availability
      const { error: availabilityError } = await supabase
        .from('availability')
        .insert({
          driver_id: user.id,
          from_area: formData.fromArea,
          to_area: formData.toArea,
          date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime
        });

      if (availabilityError) throw availabilityError;

      // Create or update discount
      const { error: discountError } = await supabase
        .from('discounts')
        .upsert({
          driver_id: user.id,
          enabled: formData.discount.enabled,
          percentage: formData.discount.percentage
        });

      if (discountError) throw discountError;

      // Reset form
      setFormData({
        name: '',
        contact: '',
        carModel: '',
        fromArea: '',
        toArea: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        discount: {
          enabled: false,
          percentage: 0
        }
      });

      // Show success message
      alert('Ride offer created successfully!');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the ride offer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Create checkout session
      const { data: session, error: sessionError } = await supabase
        .from('create_checkout_session')
        .select('session_id')
        .single();

      if (sessionError) {
        throw sessionError;
      }

      // Redirect to checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.session_id,
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error in subscription process:', error);
      setError(error instanceof Error ? error.message : 'Failed to process subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const RideRequestsSection = () => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold gradient-text mb-6">Ride Requests</h2>
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
    <div className="min-h-screen pt-16">
      <div 
        className="relative bg-cover bg-center py-12"
        style={{
          backgroundImage: 'url(/car-ride.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-deep-space/90 backdrop-blur-sm" />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold gradient-text mb-4">
              Offer a Ride
            </h1>
            <p className="text-gray-400">
              Share your journey and help others reach their destination
            </p>
          </div>

          <RideRequestsSection />

          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold gradient-text">Driver Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="auth-input"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="auth-input"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Car Model
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.carModel}
                      onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                      className="auth-input"
                      placeholder="Tesla Model 3"
                    />
                  </div>
                </div>
              </div>

              {/* Ride Details */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold gradient-text">Ride Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 inline-block mr-1" />
                      From Area
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fromArea}
                      onChange={(e) => setFormData({ ...formData, fromArea: e.target.value })}
                      className="auth-input"
                      placeholder="Enter pickup area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <MapPin className="w-4 h-4 inline-block mr-1" />
                      To Area
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.toArea}
                      onChange={(e) => setFormData({ ...formData, toArea: e.target.value })}
                      className="auth-input"
                      placeholder="Enter drop-off area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline-block mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="auth-input"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="auth-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        End Time
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="auth-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Option */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold gradient-text flex items-center">
                  <Percent className="w-5 h-5 mr-2" />
                  Offer Discount
                </h2>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.discount.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          enabled: e.target.checked
                        }
                      })}
                      className="form-checkbox h-5 w-5 text-neon-blue rounded border-gray-700 bg-deep-space/50
                      focus:ring-neon-blue focus:ring-offset-0"
                    />
                    <span className="ml-2 text-gray-300">Enable discount</span>
                  </label>
                  {formData.discount.enabled && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount.percentage}
                      onChange={(e) => setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          percentage: parseInt(e.target.value)
                        }
                      })}
                      className="auth-input w-24"
                      placeholder="%"
                    />
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`auth-button ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating...' : 'Create Ride Offer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}