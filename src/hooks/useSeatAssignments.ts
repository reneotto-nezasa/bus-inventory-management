import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SeatAssignment, UnassignedPassenger, Seat } from '../types';

export function useSeatAssignments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeatAssignmentsForTransport = useCallback(async (busTransportId: string) => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('seat_assignments')
        .select('*')
        .eq('bus_transport_id', busTransportId);

      if (fetchError) throw fetchError;
      return data as SeatAssignment[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seat assignments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const assignPassengerToSeat = useCallback(async (
    seatId: string,
    busTransportId: string,
    passengerName: string,
    bookingReference?: string,
    preferences?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: assignError } = await supabase
        .from('seat_assignments')
        .insert({
          seat_id: seatId,
          bus_transport_id: busTransportId,
          passenger_name: passengerName,
          booking_reference: bookingReference || null,
          preferences: preferences || null,
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (assignError) throw assignError;
      return data as SeatAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign passenger to seat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const freeSeat = useCallback(async (seatId: string, busTransportId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: existingAssignment } = await supabase
        .from('seat_assignments')
        .select('*')
        .eq('seat_id', seatId)
        .eq('bus_transport_id', busTransportId)
        .maybeSingle();

      if (!existingAssignment) {
        throw new Error('No assignment found for this seat');
      }

      const { error: deleteError } = await supabase
        .from('seat_assignments')
        .delete()
        .eq('seat_id', seatId)
        .eq('bus_transport_id', busTransportId);

      if (deleteError) throw deleteError;

      return existingAssignment as SeatAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to free seat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const movePassenger = useCallback(async (
    fromSeatId: string,
    toSeatId: string,
    busTransportId: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data: existingAssignment } = await supabase
        .from('seat_assignments')
        .select('*')
        .eq('seat_id', fromSeatId)
        .eq('bus_transport_id', busTransportId)
        .maybeSingle();

      if (!existingAssignment) {
        throw new Error('No assignment found for source seat');
      }

      const { error: deleteError } = await supabase
        .from('seat_assignments')
        .delete()
        .eq('seat_id', fromSeatId)
        .eq('bus_transport_id', busTransportId);

      if (deleteError) throw deleteError;

      const { data: newAssignment, error: insertError } = await supabase
        .from('seat_assignments')
        .insert({
          seat_id: toSeatId,
          bus_transport_id: busTransportId,
          passenger_name: existingAssignment.passenger_name,
          booking_reference: existingAssignment.booking_reference,
          preferences: existingAssignment.preferences,
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        oldAssignment: existingAssignment as SeatAssignment,
        newAssignment: newAssignment as SeatAssignment,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move passenger');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSeatAssignment = useCallback(async (
    assignmentId: string,
    updates: Partial<SeatAssignment>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('seat_assignments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data as SeatAssignment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seat assignment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUnassignedPassengers = useCallback(async (busTransportId: string): Promise<UnassignedPassenger[]> => {
    return [];
  }, []);

  return {
    loading,
    error,
    fetchSeatAssignmentsForTransport,
    assignPassengerToSeat,
    freeSeat,
    movePassenger,
    updateSeatAssignment,
    getUnassignedPassengers,
  };
}
