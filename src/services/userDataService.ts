import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Appointment type definition
export interface Appointment {
  id?: string;
  user_id?: string;
  doctor_name: string;
  doctor_specialty?: string;
  date: string;
  time: string;
  reason?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Helper function to ensure status is of the correct type
const validateAppointmentStatus = (status: string | null): 'pending' | 'confirmed' | 'cancelled' | 'completed' => {
  if (status === 'pending' || status === 'confirmed' || status === 'cancelled' || status === 'completed') {
    return status;
  }
  return 'pending'; // Default value if status is invalid
};

// Helper function to convert database row to Appointment type
const mapDbRowToAppointment = (row: any): Appointment => {
  return {
    ...row,
    status: validateAppointmentStatus(row.status)
  };
};

// Health check type definition
export interface HealthCheck {
  id?: string;
  user_id?: string;
  symptoms: string[];
  severity?: string;
  duration?: string;
  previous_conditions?: string[];
  medications?: string[];
  notes?: string;
  created_at?: string;
}

// Profile type definition
export interface Profile {
  id?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  region?: string;
  city?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

// Helper function to log detailed error information
const logError = (context: string, error: any) => {
  console.error(`Error in ${context}:`, error);
  if (error.message) console.error(`Message: ${error.message}`);
  if (error.details) console.error(`Details: ${error.details}`);
  if (error.hint) console.error(`Hint: ${error.hint}`);
  if (error.code) console.error(`Code: ${error.code}`);
};

// Custom hook to fetch user profile
export const useUserProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('Fetching user session...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }
        
        if (!user) {
          console.log('No authenticated user found');
          setLoading(false);
          return;
        }

        console.log('User authenticated:', user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          logError('fetching profile', error);
          throw error;
        }

        console.log("Fetched profile data:", data);
        setProfile(data);
      } catch (err) {
        logError('fetching profile', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        toast({
          title: "Error",
          description: "Failed to fetch your profile data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    try {
      console.log('Getting authenticated user...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated, updating profile for:', user.id);

      // First, check if the profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        logError('checking if profile exists', checkError);
        throw checkError;
      }

      // Prepare the profile data with timestamps
      const profileData = {
        ...updatedProfile,
        id: user.id,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with data:', profileData);
      
      let result;
      
      if (!existingProfile) {
        // Create a new profile if it doesn't exist
        profileData.created_at = new Date().toISOString();
        result = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();
      } else {
        // Update the existing profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
          .select()
          .single();
      }

      if (result.error) {
        logError('updating profile', result.error);
        throw new Error(`Failed to update profile: ${result.error.message}`);
      }
      
      console.log('Profile updated successfully:', result.data);
      setProfile(result.data);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      return result.data;
    } catch (err) {
      logError('updating profile', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive"
      });
      throw err;
    }
  };

  return { profile, loading, error, updateProfile };
};

// Custom hook to fetch user appointments
export const useUserAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        console.log('Fetching user session for appointments...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }
        
        if (!user) {
          console.log('No authenticated user found for appointments');
          setLoading(false);
          return;
        }

        console.log('User authenticated, fetching appointments for:', user.id);

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) {
          logError('fetching appointments', error);
          throw error;
        }

        console.log('Appointments data fetched:', data);
        const typedAppointments: Appointment[] = (data || []).map(mapDbRowToAppointment);
        setAppointments(typedAppointments);
      } catch (err) {
        logError('fetching appointments', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
        toast({
          title: "Error",
          description: "Failed to fetch your appointments. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [toast]);

  const addAppointment = async (newAppointment: Omit<Appointment, 'user_id'>) => {
    try {
      console.log('Getting authenticated user for adding appointment...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated, adding appointment for:', user.id);

      // First check if the profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        logError('checking if profile exists', checkError);
        throw checkError;
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          logError('creating profile', insertError);
          throw insertError;
        }
      }

      // Then create the appointment with the user_id reference
      const appointmentWithUserId = {
        ...newAppointment,
        user_id: user.id,
        status: validateAppointmentStatus(newAppointment.status || 'pending'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating appointment with data:', appointmentWithUserId);

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentWithUserId])
        .select()
        .single();

      if (error) {
        logError('inserting appointment', error);
        throw error;
      }

      console.log('Appointment created successfully:', data);
      setAppointments(prev => [...prev, mapDbRowToAppointment(data)]);
      toast({
        title: "Success",
        description: "Appointment booked successfully"
      });
      
      return mapDbRowToAppointment(data);
    } catch (err) {
      logError('adding appointment', err);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const safeUpdates = { 
        ...updates,
        ...(updates.status && { status: validateAppointmentStatus(updates.status) })
      };

      const { data, error } = await supabase
        .from('appointments')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? mapDbRowToAppointment(data) : appointment
        )
      );
      
      toast({
        title: "Success",
        description: "Appointment updated successfully"
      });
      
      return mapDbRowToAppointment(data);
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive"
      });
      throw err;
    }
  };

  return { 
    appointments, 
    loading, 
    error, 
    addAppointment, 
    updateAppointment 
  };
};

// Custom hook to fetch user health checks
export const useUserHealthChecks = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHealthChecks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('health_checks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setHealthChecks(data || []);
      } catch (err) {
        console.error('Error fetching health checks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch health checks'));
        toast({
          title: "Error",
          description: "Failed to fetch your health check history",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealthChecks();
  }, [toast]);

  const saveHealthCheck = async (healthCheckData: Omit<HealthCheck, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const healthCheckWithUserId = {
        ...healthCheckData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('health_checks')
        .insert([healthCheckWithUserId])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setHealthChecks(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Health check saved successfully"
      });
      
      return data;
    } catch (err) {
      console.error('Error saving health check:', err);
      toast({
        title: "Error",
        description: "Failed to save health check data",
        variant: "destructive"
      });
      throw err;
    }
  };

  return { 
    healthChecks, 
    loading, 
    error, 
    saveHealthCheck 
  };
};

// Fetch user stats (counts of appointments, health checks, etc.)
export const useUserStats = () => {
  const [stats, setStats] = useState({
    appointmentsCount: 0,
    healthChecksCount: 0,
    upcomingAppointments: 0,
    completedHealthChecks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { count: appointmentsCount, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (appointmentsError) throw appointmentsError;

        // Use the current date and time for more accurate filtering
        const now = new Date().toISOString();
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('date', now.split('T')[0])  // Check date is greater than or equal to today
          .not('status', 'eq', 'cancelled');

        if (upcomingError) throw upcomingError;

        const { count: healthChecksCount, error: healthChecksError } = await supabase
          .from('health_checks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (healthChecksError) throw healthChecksError;

        setStats({
          appointmentsCount: appointmentsCount || 0,
          healthChecksCount: healthChecksCount || 0,
          upcomingAppointments: upcomingCount || 0,
          completedHealthChecks: healthChecksCount || 0
        });
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user statistics'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
