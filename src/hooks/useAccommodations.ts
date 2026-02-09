import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Accommodation, AccommodationFormData, CompositeAccommodationHotel } from '../types';

export function useAccommodations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccommodationsForDeparture = useCallback(async (tripDepartureId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: accommodations, error: fetchError } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_departure_id', tripDepartureId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (accommodations && accommodations.length > 0) {
        const accommodationIds = accommodations.map((a) => a.id);
        const { data: compositeHotels, error: hotelsError } = await supabase
          .from('composite_accommodation_hotels')
          .select('*')
          .in('accommodation_id', accommodationIds)
          .order('sort_order', { ascending: true });

        if (hotelsError) throw hotelsError;

        const accommodationsWithHotels = accommodations.map((acc) => ({
          ...acc,
          composite_hotels: compositeHotels?.filter((h) => h.accommodation_id === acc.id) || [],
        }));

        return accommodationsWithHotels as Accommodation[];
      }

      return accommodations as Accommodation[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accommodations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccommodation = useCallback(async (
    tripDepartureId: string,
    formData: AccommodationFormData
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data: accommodation, error: createError } = await supabase
        .from('accommodations')
        .insert({
          trip_departure_id: tripDepartureId,
          code: formData.code || null,
          name: formData.name,
          description: formData.description || null,
          room_type: formData.room_type || null,
          price: formData.price,
          currency: formData.currency,
          belegung_min: formData.belegung_min,
          belegung_max: formData.belegung_max,
          meal_plan: formData.meal_plan || null,
          checkin_date: formData.checkin_date || null,
          checkout_date: formData.checkout_date || null,
          nights: formData.nights,
          status: formData.status,
          is_composite: formData.is_composite,
          deck_name: formData.deck_name || null,
          amenities: formData.amenities || null,
          sort_order: formData.sort_order,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (formData.is_composite && formData.composite_hotels.length > 0 && accommodation) {
        const hotelsToInsert = formData.composite_hotels.map((hotel) => ({
          accommodation_id: accommodation.id,
          hotel_partner_id: hotel.hotel_partner_id,
          hotel_name: hotel.hotel_name || null,
          checkin_date: hotel.checkin_date || null,
          checkout_date: hotel.checkout_date || null,
          nights: hotel.nights,
          meal_plan: hotel.meal_plan || null,
          sort_order: hotel.sort_order,
        }));

        const { error: hotelsError } = await supabase
          .from('composite_accommodation_hotels')
          .insert(hotelsToInsert);

        if (hotelsError) throw hotelsError;
      }

      return accommodation as Accommodation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create accommodation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAccommodation = useCallback(async (
    accommodationId: string,
    formData: Partial<AccommodationFormData>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.code !== undefined) updateData.code = formData.code || null;
      if (formData.description !== undefined) updateData.description = formData.description || null;
      if (formData.room_type !== undefined) updateData.room_type = formData.room_type || null;
      if (formData.price !== undefined) updateData.price = formData.price;
      if (formData.currency !== undefined) updateData.currency = formData.currency;
      if (formData.belegung_min !== undefined) updateData.belegung_min = formData.belegung_min;
      if (formData.belegung_max !== undefined) updateData.belegung_max = formData.belegung_max;
      if (formData.meal_plan !== undefined) updateData.meal_plan = formData.meal_plan || null;
      if (formData.checkin_date !== undefined) updateData.checkin_date = formData.checkin_date || null;
      if (formData.checkout_date !== undefined) updateData.checkout_date = formData.checkout_date || null;
      if (formData.nights !== undefined) updateData.nights = formData.nights;
      if (formData.status !== undefined) updateData.status = formData.status;
      if (formData.is_composite !== undefined) updateData.is_composite = formData.is_composite;
      if (formData.deck_name !== undefined) updateData.deck_name = formData.deck_name || null;
      if (formData.amenities !== undefined) updateData.amenities = formData.amenities || null;
      if (formData.sort_order !== undefined) updateData.sort_order = formData.sort_order;

      const { data, error: updateError } = await supabase
        .from('accommodations')
        .update(updateData)
        .eq('id', accommodationId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (formData.is_composite && formData.composite_hotels) {
        await supabase
          .from('composite_accommodation_hotels')
          .delete()
          .eq('accommodation_id', accommodationId);

        if (formData.composite_hotels.length > 0) {
          const hotelsToInsert = formData.composite_hotels.map((hotel) => ({
            accommodation_id: accommodationId,
            hotel_partner_id: hotel.hotel_partner_id,
            hotel_name: hotel.hotel_name || null,
            checkin_date: hotel.checkin_date || null,
            checkout_date: hotel.checkout_date || null,
            nights: hotel.nights,
            meal_plan: hotel.meal_plan || null,
            sort_order: hotel.sort_order,
          }));

          const { error: hotelsError } = await supabase
            .from('composite_accommodation_hotels')
            .insert(hotelsToInsert);

          if (hotelsError) throw hotelsError;
        }
      }

      return data as Accommodation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update accommodation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccommodation = useCallback(async (accommodationId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', accommodationId);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete accommodation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHotelPartners = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('hotel_partners')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch hotel partners:', err);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    fetchAccommodationsForDeparture,
    createAccommodation,
    updateAccommodation,
    deleteAccommodation,
    fetchHotelPartners,
  };
}
