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

interface TopDriversProps {
  className?: string;
}

export function TopDrivers({ className = "mt-16" }: TopDriversProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableDrivers = async () => {
      try {
        const now = new Date();
        const currentTime = format(now, 'HH:mm:ss');
        const today = format(now, 'yyyy-MM-dd');

        console.log('Fetching drivers with params:', {
          currentTime,
          today
        });

        // Get all drivers with their availability for today
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
          .gte('availability.end_time', currentTime) // Only show future end times
          .order('rides_offered', { ascending: false });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        console.log('Raw database response:', data);

        // Filter out drivers with no valid availability or who are on a ride
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
      .channel('drivers_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'drivers' 
        }, 
        () => {
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
      <div className={`${className}`}>
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="animate-pulse text-neon-blue">Loading available drivers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold gradient-text mb-6">Available Drivers</h2>
      {drivers.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-gray-400">No drivers available right now. Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <div key={driver.id} className="glass-card rounded-2xl p-6 hover-float">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">{driver.name}</h3>
                  <p className="text-sm text-gray-400">{driver.car_model}</p>
                </div>
                <div className="flex items-center text-neon-blue">
                  <Star className="w-4 h-4 mr-1" />
                  <span>{driver.rides_offered} rides</span>
                </div>
              </div>

              <div className="space-y-4">
                {driver.availability.map((slot) => (
                  <div key={slot.id} className="space-y-2">
                    <div className="flex items-center text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 text-neon-blue" />
                      {slot.from_area} → {slot.to_area}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-4 h-4 mr-2 text-neon-blue" />
                      {format(parseISO(`2000-01-01T${slot.start_time}`), 'h:mm a')} - 
                      {format(parseISO(`2000-01-01T${slot.end_time}`), 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}