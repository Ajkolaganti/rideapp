import { useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, Percent, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Driver } from '../types';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_your_key');

interface DriverDashboardProps {
  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;
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

  const handleSubscribe = async () => {
    const stripe = await stripePromise;
    // In a real app, you would create a session on your backend
    // This is just a mock implementation
    alert('Subscription successful! You can now offer unlimited rides.');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Offer a Ride
          </h1>
          <p className="text-gray-400">
            Share your journey and help others reach their destination
          </p>
        </div>

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
  );
}