import { createClient } from '@/lib/supabase/server';
import { siteSettings as mockSettings, professionals as mockProfessionals, activities as mockActivities, events as mockEvents } from '@/lib/cms-mock';

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

export async function getSiteSettings() {
  if (!isSupabaseConfigured()) return mockSettings;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('site_settings').select('*');
    
    if (error || !data) return mockSettings;

    // Transform flat array into object for easy access
    return data.reduce((acc: any, item) => {
      acc[item.setting_key] = item.setting_value;
      return acc;
    }, { ...mockSettings }); // Fallback to mock for missing keys
  } catch (error) {
    return mockSettings;
  }
}

export async function getProfessionals() {
  if (!isSupabaseConfigured()) return mockProfessionals;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });
      
    return (error || !data) ? mockProfessionals : data;
  } catch (error) {
    return mockProfessionals;
  }
}

export async function getActivities() {
  if (!isSupabaseConfigured()) return mockActivities;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('is_active', true);
      
    return (error || !data) ? mockActivities : data;
  } catch (error) {
    return mockActivities;
  }
}

export async function getEvents() {
  if (!isSupabaseConfigured()) return mockEvents;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
      
    return (error || !data) ? mockEvents : data;
  } catch (error) {
    return mockEvents;
  }
}
