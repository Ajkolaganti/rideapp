import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Star, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TopDriver {
  id: string;
  name: string;
  car_model: string;
  rides_offered: number;
  availability: {
    from_area: string;
    to_area: string;
  }[];
}

export function Home() {
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopDrivers = async () => {
      try {
        console.log('Fetching top drivers...');
        const { data, error } = await supabase
          .from('drivers')
          .select(`
            id,
            name,
            car_model,
            rides_offered,
            availability (
              from_area,
              to_area
            )
          `)
          .eq('is_subscribed', true)
          .order('rides_offered', { ascending: false })
          .limit(3);

        if (error) throw error;

        console.log('Fetched top drivers:', data);
        setTopDrivers(data || []);
      } catch (err) {
        console.error('Error fetching top drivers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopDrivers();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-deep-space to-transparent" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
            Share Your Journey
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Connect with verified drivers and find your perfect ride
          </p>
          <Link
            to="/find-ride"
            className="auth-button inline-flex max-w-xs"
          >
            Find a Ride
          </Link>
        </div>
      </div>

      {/* Top Drivers Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold gradient-text text-center mb-12">
          Top Rated Drivers
        </h2>
        
        {loading ? (
          <div className="text-center text-gray-400">Loading top drivers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topDrivers.map((driver) => (
              <div key={driver.id} className="glass-card rounded-2xl p-6 hover-float">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 
                    flex items-center justify-center">
                    <span className="text-2xl font-semibold text-neon-blue">
                      {driver.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-100">{driver.name}</h3>
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-2 text-gray-400 text-sm">
                        {driver.rides_offered} rides
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <Car className="w-4 h-4 mr-2 text-neon-blue" />
                    {driver.car_model}
                  </div>

                  {driver.availability?.[0] && (
                    <div className="flex items-center text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 text-neon-blue" />
                      {driver.availability[0].from_area} - {driver.availability[0].to_area}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 