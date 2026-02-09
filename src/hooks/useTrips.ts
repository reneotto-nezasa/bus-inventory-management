import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Trip, BusTransport, TripDeparture, TransportGroup, TransportGroupMember, TourGuideAssignment } from '../types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select(`
          *,
          bus_transports(
            *,
            seat_map:seat_maps(*),
            boarding_point_assignments(
              *,
              boarding_point:boarding_points(*)
            )
          ),
          trip_departures(
            *,
            tour_guide_assignments(*),
            transport_groups(
              *,
              transport_group_members(
                *,
                bus_transport:bus_transports(*)
              )
            )
          )
        `)
        .order('termin', { ascending: false });

      if (fetchError) throw fetchError;
      setTrips(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrip = useCallback((id: string) => {
    const trip = trips.find((t) => t.id === id);
    if (trip) {
      setCurrentTrip(trip);
    }
  }, [trips]);

  const createTrip = useCallback(async (data: Partial<Trip>) => {
    try {
      const { data: newTrip, error: createError } = await supabase
        .from('trips')
        .insert({
          code: data.code || '',
          text: data.text || 'Neue Reise',
          termin: data.termin || new Date().toISOString().split('T')[0],
          bis: data.bis || new Date().toISOString().split('T')[0],
          abpreis: data.abpreis || 0,
          status_hin: data.status_hin || 'Offen',
          status_rueck: data.status_rueck || 'Offen',
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newTrip) {
        setTrips((prev) => [newTrip, ...prev]);
        setCurrentTrip(newTrip);
        return newTrip;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
      throw err;
    }
  }, []);

  const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
        if (currentTrip?.id === id) {
          setCurrentTrip((prev) => prev ? { ...prev, ...data } : null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    }
  }, [currentTrip]);

  const deleteTrip = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (currentTrip?.id === id) {
        setCurrentTrip(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
    }
  }, [currentTrip]);

  const createBusTransport = useCallback(async (tripId: string, data: Partial<BusTransport>) => {
    try {
      const { data: newTransport, error: createError } = await supabase
        .from('bus_transports')
        .insert({
          trip_id: tripId,
          unterart: data.unterart || 'BUS',
          termin: data.termin || new Date().toISOString().split('T')[0],
          bis: data.bis || new Date().toISOString().split('T')[0],
          richtung: data.richtung || 'HIN',
          sitzplan: data.sitzplan || false,
          status: data.status || 'Offen',
          text: data.text || 'Bus-Fahrt',
          preis: data.preis || 0,
          gruppe: data.gruppe || 'Busreise',
          seat_map_id: data.seat_map_id,
          idbuspro: data.idbuspro,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchTrips();
      return newTransport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bus transport');
      throw err;
    }
  }, [fetchTrips]);

  const updateBusTransport = useCallback(async (id: string, updates: Partial<BusTransport>) => {
    try {
      const { error: updateError } = await supabase
        .from('bus_transports')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bus transport');
    }
  }, [fetchTrips]);

  const linkSeatMapToTransport = useCallback(async (transportId: string, seatMapId: string | null) => {
    await updateBusTransport(transportId, {
      seat_map_id: seatMapId,
      sitzplan: !!seatMapId,
    });
  }, [updateBusTransport]);

  const createTripDeparture = useCallback(async (tripId: string, data: Partial<TripDeparture>) => {
    try {
      const { data: newDeparture, error: createError } = await supabase
        .from('trip_departures')
        .insert({
          trip_id: tripId,
          start_date: data.start_date || new Date().toISOString().split('T')[0],
          end_date: data.end_date,
          code: data.code,
          booking_deadline: data.booking_deadline,
          status_hin: data.status_hin || 'Frei',
          status_rueck: data.status_rueck || 'Frei',
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchTrips();
      return newDeparture;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip departure');
      throw err;
    }
  }, [fetchTrips]);

  const updateTripDeparture = useCallback(async (id: string, updates: Partial<TripDeparture>) => {
    try {
      const { error: updateError } = await supabase
        .from('trip_departures')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip departure');
    }
  }, [fetchTrips]);

  const deleteTripDeparture = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('trip_departures')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip departure');
    }
  }, [fetchTrips]);

  const createTourGuideAssignment = useCallback(async (tripDepartureId: string, data: Partial<TourGuideAssignment>) => {
    try {
      const { data: newGuide, error: createError } = await supabase
        .from('tour_guide_assignments')
        .insert({
          trip_departure_id: tripDepartureId,
          name: data.name,
          first_name: data.first_name,
          gender: data.gender,
          code: data.code,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchTrips();
      return newGuide;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tour guide assignment');
      throw err;
    }
  }, [fetchTrips]);

  const updateTourGuideAssignment = useCallback(async (id: string, updates: Partial<TourGuideAssignment>) => {
    try {
      const { error: updateError } = await supabase
        .from('tour_guide_assignments')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tour guide assignment');
    }
  }, [fetchTrips]);

  const deleteTourGuideAssignment = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tour_guide_assignments')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tour guide assignment');
    }
  }, [fetchTrips]);

  const createTransportGroup = useCallback(async (tripDepartureId: string, label: string, sortOrder: number = 0) => {
    try {
      const { data: newGroup, error: createError } = await supabase
        .from('transport_groups')
        .insert({
          trip_departure_id: tripDepartureId,
          label,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (createError) throw createError;

      await fetchTrips();
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transport group');
      throw err;
    }
  }, [fetchTrips]);

  const updateTransportGroup = useCallback(async (id: string, updates: Partial<TransportGroup>) => {
    try {
      const { error: updateError } = await supabase
        .from('transport_groups')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transport group');
    }
  }, [fetchTrips]);

  const deleteTransportGroup = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('transport_groups')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transport group');
    }
  }, [fetchTrips]);

  const addTransportToGroup = useCallback(async (transportGroupId: string, busTransportId: string) => {
    try {
      const { error: createError } = await supabase
        .from('transport_group_members')
        .insert({
          transport_group_id: transportGroupId,
          bus_transport_id: busTransportId,
        });

      if (createError) throw createError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transport to group');
    }
  }, [fetchTrips]);

  const removeTransportFromGroup = useCallback(async (transportGroupId: string, busTransportId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('transport_group_members')
        .delete()
        .eq('transport_group_id', transportGroupId)
        .eq('bus_transport_id', busTransportId);

      if (deleteError) throw deleteError;

      await fetchTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove transport from group');
    }
  }, [fetchTrips]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return {
    trips,
    currentTrip,
    loading,
    error,
    loadTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    createBusTransport,
    updateBusTransport,
    linkSeatMapToTransport,
    createTripDeparture,
    updateTripDeparture,
    deleteTripDeparture,
    createTourGuideAssignment,
    updateTourGuideAssignment,
    deleteTourGuideAssignment,
    createTransportGroup,
    updateTransportGroup,
    deleteTransportGroup,
    addTransportToGroup,
    removeTransportFromGroup,
    setCurrentTrip,
    refetch: fetchTrips,
  };
}
