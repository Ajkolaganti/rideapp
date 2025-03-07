import { useState, useEffect } from 'react';
import { format, parseISO, addMinutes, parse } from 'date-fns';
import { MapPin, Calendar, Search, Phone, MessageCircle, Star, Clock, Car, Shield, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth/AuthProvider';

interface Driver {
  id: string;
  name: string;
  contact: string;
  car_model: string;
  rides_offered: number;
  is_subscribed: boolean;
  is_on_ride: boolean;
  availability: {
    id: string;
    from_area: string;
    to_area: string;
    date: string;
    start_time: string;
    end_time: string;
  }[];
  discounts: {
    enabled: boolean;
    percentage: number;
  }[];
}

// Add a helper function to format time
const formatTimeToAMPM = (time: string) => {
  // Parse the time string (HH:mm:ss or HH:mm) into a Date object
  const date = parse(time, 'HH:mm:ss', new Date());
  // Format it to AM/PM
  return format(date, 'h:mm a');
};

export function FindRide() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    fromArea: '',
    toArea: ''
  });

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const now = new Date();
        const currentTime = format(now, 'HH:mm');
        const today = format(now, 'yyyy-MM-dd');

        console.log('Fetching drivers with params:', {
          currentTime,
          today,
          now: now.toISOString()
        });

        // Get all drivers for today
        const { data, error } = await supabase
          .from('drivers')
          .select(`
            id,
            name,
            contact,
            car_model,
            rides_offered,
            is_subscribed,
            is_on_ride,
            availability (
              id,
              from_area,
              to_area,
              date,
              start_time,
              end_time
            ),
            discounts (
              enabled,
              percentage
            )
          `)
          .eq('availability.date', today);

        if (error) throw error;

        console.log('Raw database response:', data);

        // Filter available drivers on the client side
        const availableDrivers = data?.filter(driver => {
          if (!driver.availability || driver.availability.length === 0 || driver.is_on_ride) {
            return false;
          }

          // Check if any availability slot's end time hasn't passed yet
          return driver.availability.some(slot => {
            const endTime = slot.end_time.substring(0, 5); // Get HH:mm part only
            return endTime > currentTime;
          });
        }) || [];

        console.log('Filtered available drivers:', availableDrivers);
        setDrivers(availableDrivers);
      } catch (err) {
        console.error('Error fetching drivers:', err);
        setError('Failed to load available drivers');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchDrivers();
    
    // Set up periodic refresh every minute
    const intervalId = setInterval(fetchDrivers, 60000); // Check every minute

    // Set up real-time subscription for driver status changes
    const subscription = supabase
      .channel('drivers_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'drivers' 
        }, 
        () => {
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      subscription.unsubscribe();
    };
  }, []);

  // Filter drivers based on search params
  const filteredDrivers = drivers.filter(driver => {
    return driver.availability?.some(
      availability =>
        (!searchParams.fromArea || availability.from_area.toLowerCase().includes(searchParams.fromArea.toLowerCase())) &&
        (!searchParams.toArea || availability.to_area.toLowerCase().includes(searchParams.toArea.toLowerCase()))
    );
  });

  // Update the time slot grouping function
  const groupAvailabilityByTime = (availability: Driver['availability']) => {
    return availability.reduce((acc, slot) => {
      const startTime = formatTimeToAMPM(slot.start_time);
      const endTime = formatTimeToAMPM(slot.end_time);
      const key = `${startTime} - ${endTime}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(slot);
      return acc;
    }, {} as Record<string, typeof availability>);
  };

  // Update the sorting function for time slots
  const sortTimeSlots = (a: string, b: string) => {
    const [aStart] = a.split(' - ');
    const [bStart] = b.split(' - ');
    // Parse the times back to Date objects for comparison
    const aDate = parse(aStart, 'h:mm a', new Date());
    const bDate = parse(bStart, 'h:mm a', new Date());
    return aDate.getTime() - bDate.getTime();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-pulse text-neon-blue">Loading available rides...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div 
        className="relative bg-cover bg-center py-12"
        style={{
          backgroundImage: 'url(/car-ride.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-deep-space/90 backdrop-blur-sm" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold gradient-text mb-4">Find a Ride</h1>
            <p className="text-gray-400">
              Available drivers in the next 30 minutes
            </p>
          </div>

          {/* Search Form */}
          <div className="glass-card rounded-2xl p-6 md:p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline-block mr-1" />
                  From Area
                </label>
                <input
                  type="text"
                  value={searchParams.fromArea}
                  onChange={(e) => setSearchParams({ ...searchParams, fromArea: e.target.value })}
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
                  value={searchParams.toArea}
                  onChange={(e) => setSearchParams({ ...searchParams, toArea: e.target.value })}
                  className="auth-input"
                  placeholder="Enter drop-off area"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card rounded-2xl p-6 mb-8 text-red-400 bg-red-900/20">
              {error}
            </div>
          )}

          {/* Results Section */}
          <div className="space-y-6">
            {filteredDrivers.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">No rides available</h3>
                <p className="text-gray-400">
                  No drivers are currently available for your route. Please try again later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.map((driver) => (
                  <div key={driver.id} className="glass-card rounded-2xl p-6 hover-float">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                        <span className="text-xl font-semibold text-neon-blue">
                          {driver.name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-100">{driver.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm">{driver.rides_offered}</span>
                          </div>
                          {driver.is_subscribed && (
                            <div className="flex items-center text-neon-blue">
                              <Shield className="w-4 h-4" />
                              <span className="ml-1 text-xs">Verified</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-300">
                        <Car className="w-4 h-4 mr-2 text-neon-blue" />
                        {driver.car_model}
                      </div>
                      {driver.discounts?.[0]?.enabled && (
                        <div className="inline-block px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30">
                          <p className="text-neon-blue text-sm font-medium">
                            {driver.discounts[0].percentage}% Off
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400">Available Time Slots</h4>
                      {Object.entries(groupAvailabilityByTime(driver.availability))
                        .sort(([a], [b]) => sortTimeSlots(a, b))
                        .map(([timeSlot, slots]) => (
                          <div key={timeSlot} className="p-3 rounded-lg bg-deep-space/30 border border-white/5">
                            <div className="flex items-center text-gray-300 mb-2">
                              <Clock className="w-4 h-4 mr-2 text-neon-blue" />
                              <span className="capitalize">{timeSlot}</span>
                            </div>
                            <div className="space-y-2">
                              {slots.map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center text-gray-400">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {slot.from_area}
                                    <span className="mx-2">→</span>
                                    {slot.to_area}
                                  </div>
                                  <div className="text-gray-500">
                                    {format(parseISO(slot.date), 'MMM d')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <a
                        href={`tel:${driver.contact}`}
                        className="flex-1 flex items-center justify-center p-2 rounded-lg 
                        bg-deep-space/50 text-gray-300 hover:text-neon-blue 
                        hover:bg-deep-space/70 transition-all duration-200"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${driver.contact}`}
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
        </div>
      </div>
    </div>
  );
}