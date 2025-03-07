import { useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function RequestRide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    riderName: '',
    contact: '',
    fromArea: '',
    toArea: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to request a ride');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting ride request:', {
        rider_id: user.id,
        ...formData
      });

      const { data, error: requestError } = await supabase
        .from('ride_requests')
        .insert({
          rider_id: user.id,
          rider_name: formData.riderName,
          contact: formData.contact,
          from_area: formData.fromArea,
          to_area: formData.toArea,
          date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) {
        console.error('Database error:', requestError);
        throw new Error(requestError.message);
      }

      console.log('Ride request created:', data);

      // Reset form
      setFormData({
        riderName: '',
        contact: '',
        fromArea: '',
        toArea: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: ''
      });

      // Show success message and redirect
      alert('Ride request created successfully!');
      navigate('/');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ride request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="relative bg-cover bg-center py-12">
        <div className="absolute inset-0 bg-deep-space/90 backdrop-blur-sm" />
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-4">Request a Ride</h1>
            <p className="text-gray-400">
              Let drivers know about your travel needs
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.riderName}
                    onChange={(e) => setFormData({ ...formData, riderName: e.target.value })}
                    className="auth-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline-block mr-1" />
                    From Area
                  </label>
                  <input
                    type="text"
                    value={formData.fromArea}
                    onChange={(e) => setFormData({ ...formData, fromArea: e.target.value })}
                    className="auth-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline-block mr-1" />
                    To Area
                  </label>
                  <input
                    type="text"
                    value={formData.toArea}
                    onChange={(e) => setFormData({ ...formData, toArea: e.target.value })}
                    className="auth-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="auth-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="auth-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="auth-input"
                    required
                  />
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
                className={`auth-button w-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 