import { supabase } from '@/supabase';

export type WaterEntry = {
  id: string;
  user_id: string;
  cups: number;
  bottles: number;
  start_time: string;
  end_time: string;
  date: string;
  created_at?: string;
};

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getEntries(): Promise<WaterEntry[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('water_intake')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  if (error) {
    console.error('getEntries error', error);
    return [];
  }

  return (data as WaterEntry[]) ?? [];
}

export async function addEntry(data: {
  cups: number;
  bottles: number;
  start_time: string;
  end_time: string;
}): Promise<WaterEntry | null> {
  const userId = await getUserId();
  if (!userId) {
    console.error('addEntry error: No user ID found');
    return null;
  }

  try {
    const { data: result, error } = await supabase
      .from('water_intake')
      .insert([{ 
        user_id: userId,
        cups: data.cups,
        bottles: data.bottles,
        start_time: data.start_time,
        end_time: data.end_time,
      }])
      .select()
      .single();

    if (error) {
      console.error('addEntry error:', error.message, error.details);
      return null;
    }

    return result as WaterEntry;
  } catch (err) {
    console.error('addEntry unexpected error:', err);
    return null;
  }
}

export async function updateEntry(id: string, updates: Partial<Omit<WaterEntry, 'id' | 'user_id' | 'created_at'>>): Promise<WaterEntry | null> {
  const { data, error } = await supabase
    .from('water_intake')
    .update({
      ...updates,
      // Update the date if start_time is provided
      ...(updates.start_time && { date: new Date(updates.start_time).toISOString().split('T')[0] })
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateEntry error', error);
    return null;
  }

  return data as WaterEntry;
}

export async function deleteEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from('water_intake').delete().eq('id', id);
  if (error) {
    console.error('deleteEntry error', error);
    return false;
  }
  return true;
}

export default { getEntries, addEntry, updateEntry, deleteEntry };
