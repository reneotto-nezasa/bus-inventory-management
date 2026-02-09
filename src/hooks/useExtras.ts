import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TripExtra, TripExtraFormData, EarlyBirdDiscount, EarlyBirdDiscountFormData } from '../types';

export function useExtras() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExtrasForDeparture = useCallback(async (tripDepartureId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('trip_extras')
        .select('*')
        .eq('trip_departure_id', tripDepartureId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      return (data || []) as TripExtra[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch extras');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEarlyBirdDiscounts = useCallback(async (tripDepartureId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('early_bird_discounts')
        .select('*')
        .eq('trip_departure_id', tripDepartureId)
        .order('booking_deadline', { ascending: true });

      if (fetchError) throw fetchError;
      return (data || []) as EarlyBirdDiscount[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch early bird discounts');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createExtra = useCallback(async (
    tripDepartureId: string,
    formData: TripExtraFormData
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('trip_extras')
        .insert({
          trip_departure_id: tripDepartureId,
          type: formData.type,
          name: formData.name,
          description: formData.description || null,
          price: formData.price,
          currency: formData.currency,
          date: formData.date || null,
          status: formData.status,
          is_included: formData.is_included,
          sort_order: formData.sort_order,
        })
        .select()
        .single();

      if (createError) throw createError;
      return data as TripExtra;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create extra');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExtra = useCallback(async (
    extraId: string,
    formData: Partial<TripExtraFormData>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (formData.type !== undefined) updateData.type = formData.type;
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description || null;
      if (formData.price !== undefined) updateData.price = formData.price;
      if (formData.currency !== undefined) updateData.currency = formData.currency;
      if (formData.date !== undefined) updateData.date = formData.date || null;
      if (formData.status !== undefined) updateData.status = formData.status;
      if (formData.is_included !== undefined) updateData.is_included = formData.is_included;
      if (formData.sort_order !== undefined) updateData.sort_order = formData.sort_order;

      const { data, error: updateError } = await supabase
        .from('trip_extras')
        .update(updateData)
        .eq('id', extraId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data as TripExtra;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update extra');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExtra = useCallback(async (extraId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('trip_extras')
        .delete()
        .eq('id', extraId);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete extra');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createEarlyBirdDiscount = useCallback(async (
    tripDepartureId: string,
    formData: EarlyBirdDiscountFormData
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('early_bird_discounts')
        .insert({
          trip_departure_id: tripDepartureId,
          travel_date_from: formData.travel_date_from || null,
          travel_date_to: formData.travel_date_to || null,
          booking_deadline: formData.booking_deadline,
          discount_value: formData.discount_value,
          discount_type: formData.discount_type,
          description: formData.description || null,
        })
        .select()
        .single();

      if (createError) throw createError;
      return data as EarlyBirdDiscount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create early bird discount');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEarlyBirdDiscount = useCallback(async (
    discountId: string,
    formData: Partial<EarlyBirdDiscountFormData>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (formData.travel_date_from !== undefined) updateData.travel_date_from = formData.travel_date_from || null;
      if (formData.travel_date_to !== undefined) updateData.travel_date_to = formData.travel_date_to || null;
      if (formData.booking_deadline !== undefined) updateData.booking_deadline = formData.booking_deadline;
      if (formData.discount_value !== undefined) updateData.discount_value = formData.discount_value;
      if (formData.discount_type !== undefined) updateData.discount_type = formData.discount_type;
      if (formData.description !== undefined) updateData.description = formData.description || null;

      const { data, error: updateError } = await supabase
        .from('early_bird_discounts')
        .update(updateData)
        .eq('id', discountId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data as EarlyBirdDiscount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update early bird discount');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEarlyBirdDiscount = useCallback(async (discountId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('early_bird_discounts')
        .delete()
        .eq('id', discountId);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete early bird discount');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchExtrasForDeparture,
    fetchEarlyBirdDiscounts,
    createExtra,
    updateExtra,
    deleteExtra,
    createEarlyBirdDiscount,
    updateEarlyBirdDiscount,
    deleteEarlyBirdDiscount,
  };
}
