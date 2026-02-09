import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TourGuideAssignment } from '../types';

export function useTourGuides() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTourGuides = useCallback(async (tripDepartureId: string): Promise<TourGuideAssignment[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tour_guide_assignments')
        .select('*')
        .eq('trip_departure_id', tripDepartureId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tour guides';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTourGuide = useCallback(async (
    tripDepartureId: string,
    guideData: {
      name: string;
      first_name?: string;
      gender?: 'male' | 'female' | 'other';
      code?: string;
      phone?: string;
      email?: string;
    }
  ): Promise<TourGuideAssignment> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('tour_guide_assignments')
        .insert({
          trip_departure_id: tripDepartureId,
          name: guideData.name,
          first_name: guideData.first_name || null,
          gender: guideData.gender || null,
          code: guideData.code || null,
          phone: guideData.phone || null,
          email: guideData.email || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tour guide';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTourGuide = useCallback(async (
    guideId: string,
    updates: Partial<Omit<TourGuideAssignment, 'id' | 'trip_departure_id' | 'created_at'>>
  ): Promise<TourGuideAssignment> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('tour_guide_assignments')
        .update(updates)
        .eq('id', guideId)
        .select()
        .single();

      if (updateError) throw updateError;

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tour guide';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTourGuide = useCallback(async (guideId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('tour_guide_assignments')
        .delete()
        .eq('id', guideId);

      if (deleteError) throw deleteError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tour guide';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignSeat = useCallback(async (
    guideId: string,
    seatId: string | null,
    blockSeat: boolean = true
  ): Promise<TourGuideAssignment> => {
    try {
      setLoading(true);
      setError(null);

      const { data: guide, error: fetchError } = await supabase
        .from('tour_guide_assignments')
        .select('*')
        .eq('id', guideId)
        .single();

      if (fetchError) throw fetchError;

      if (guide.assigned_seat_id && blockSeat) {
        await supabase
          .from('seats')
          .update({ is_blocked: false, block_reason: null })
          .eq('id', guide.assigned_seat_id);
      }

      const { data, error: updateError } = await supabase
        .from('tour_guide_assignments')
        .update({ assigned_seat_id: seatId })
        .eq('id', guideId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (seatId && blockSeat) {
        const guideName = guide.first_name
          ? `${guide.first_name} ${guide.name}`
          : guide.name;

        await supabase
          .from('seats')
          .update({
            is_blocked: true,
            block_reason: `Reiseleiter: ${guideName}`,
          })
          .eq('id', seatId);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign seat';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchTourGuides,
    createTourGuide,
    updateTourGuide,
    deleteTourGuide,
    assignSeat,
  };
}
