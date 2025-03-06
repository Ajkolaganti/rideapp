import React, { useState, useEffect } from 'react';
import { Star, MapPin, Car, Clock, Shield, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { addMinutes, format, parseISO } from 'date-fns';

interface Driver {
  id: string;
  name: string;
  car_model: string;
  rides_offered: number;
  is_subscribed: boolean;
  is_on_ride?: boolean;
  availability: {
    id: string;
    from_area: string;
    to_area: string;
    date: string;
    start_time: string;
    end_time: string;
  }[];
}

export function TopDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableDrivers = async () => {
      try {
        const now = new Date();
        const thirtyMinutesFromNow = addMinutes(now, 30);
        const currentTime = format(now, 'HH:mm:ss');
        const thirtyMinLaterTime = format(thirtyMinutesFromNow, 'HH:mm:ss');
        const today = format(now, 'yyyy-MM-dd');

        console.log('Fetching drivers with params:', {
          currentTime,
          thirtyMinLaterTime,
          today
        });

        // First, get all drivers with their availability
        const { data, error } = await supabase
          .from('drivers')
          .select(`
            id,
            name,
            car_model,
            rides_offered,
            is_subscribed,
            is_on_ride,
            availability!inner (
              id,
              from_area,
              to_area,
              date,
              start_time,
              end_time
            )
          `)
          .eq('availability.date', today)
          .gte('availability.start_time', currentTime)
          .lte('availability.start_time', thirtyMinLaterTime)
          .order('rides_offered', { ascending: false });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        console.log('Raw database response:', data);

        // Filter out drivers with no valid availability
        const availableDrivers = data?.filter(driver => 
          driver.availability && 
          driver.availability.length > 0 &&
          !driver.is_on_ride
        ) || [];

        console.log('Filtered available drivers:', availableDrivers);
        setDrivers(availableDrivers);
      } catch (err) {
        console.error('Error fetching drivers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDrivers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('available_drivers')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'drivers' 
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchAvailableDrivers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center">
        <div className="glass-card inline-block p-4 rounded-xl">
          <Activity className="w-6 h-6 text-neon-blue animate-pulse" />
        </div>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-6">
          Available Drivers
        </h2>
        <div className="glass-card p-8 max-w-md mx-auto">
          <p className="text-gray-400">
            No drivers available in the next 30 minutes. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/car-ride.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-deep-space/95 backdrop-blur-sm" />
      </div>
      
      <div className="relative z-10">
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold gradient-text mb-4">
              Available Drivers
            </h2>
            <p className="text-gray-400">
              Drivers available in the next 30 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <div key={driver.id} className="glass-card rounded-2xl p-6 hover-float">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 
                    flex items-center justify-center">
                    <span className="text-2xl font-semibold text-neon-blue">
                      {driver.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {driver.name}
                      </h3>
                      {driver.is_subscribed && (
                        <Shield className="w-4 h-4 text-neon-blue" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 text-sm">{driver.rides_offered}</span>
                      </div>
                      {driver.is_on_ride && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                          font-medium bg-green-900/20 text-green-400">
                          <Activity className="w-3 h-3 mr-1" />
                          On a ride
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <Car className="w-4 h-4 mr-2 text-neon-blue" />
                    {driver.car_model}
                  </div>

                  {driver.availability?.[0] && (
                    <>
                      <div className="flex items-center text-gray-300">
                        <MapPin className="w-4 h-4 mr-2 text-neon-blue" />
                        {driver.availability[0].from_area} → {driver.availability[0].to_area}
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-neon-blue" />
                        Available at {format(parseISO(`2000-01-01T${driver.availability[0].start_time}`), 'h:mm a')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}