import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BoardingPoint, TransferCostCategory, BoardingPointSurcharge, BoardingPointAssignment } from '../types';

export function useBoardingPoints() {
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([]);
  const [transferCostCategories, setTransferCostCategories] = useState<TransferCostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardingPoints = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('boarding_points')
        .select(`
          *,
          transfer_cost_category:transfer_cost_categories(*),
          boarding_point_surcharges(
            *,
            transfer_cost_category:transfer_cost_categories(*)
          )
        `)
        .order('ort');

      if (fetchError) throw fetchError;
      setBoardingPoints(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boarding points');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransferCostCategories = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transfer_cost_categories')
        .select('*')
        .order('sort_order');

      if (fetchError) throw fetchError;
      setTransferCostCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transfer cost categories');
    }
  }, []);

  const createBoardingPoint = useCallback(async (data: Partial<BoardingPoint>) => {
    try {
      const { data: newPoint, error: createError } = await supabase
        .from('boarding_points')
        .insert({
          ort: data.ort || '',
          stelle: data.stelle || '',
          plz: data.plz || '',
          art: data.art || 'BUS',
          code: data.code || '',
          status: data.status || 'freigegeben',
          idbuspro: data.idbuspro,
          transfer_cost_category_id: data.transfer_cost_category_id,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newPoint) {
        setBoardingPoints((prev) => [...prev, newPoint]);
        return newPoint;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create boarding point');
      throw err;
    }
  }, []);

  const updateBoardingPoint = useCallback(async (id: string, updates: Partial<BoardingPoint>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('boarding_points')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setBoardingPoints((prev) =>
          prev.map((bp) => (bp.id === id ? { ...bp, ...data } : bp))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update boarding point');
    }
  }, []);

  const deleteBoardingPoint = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('boarding_points')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setBoardingPoints((prev) => prev.filter((bp) => bp.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete boarding point');
    }
  }, []);

  const toggleStatus = useCallback(async (id: string) => {
    const bp = boardingPoints.find((b) => b.id === id);
    if (!bp) return;

    const newStatus = bp.status === 'freigegeben' ? 'gesperrt' : 'freigegeben';
    await updateBoardingPoint(id, { status: newStatus });
  }, [boardingPoints, updateBoardingPoint]);

  const createTransferCostCategory = useCallback(async (data: Partial<TransferCostCategory>) => {
    try {
      const { data: newCategory, error: createError } = await supabase
        .from('transfer_cost_categories')
        .insert({
          name: data.name || '',
          amount: data.amount || 0,
          sort_order: data.sort_order || transferCostCategories.length,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newCategory) {
        setTransferCostCategories((prev) => [...prev, newCategory]);
        return newCategory;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transfer cost category');
      throw err;
    }
  }, [transferCostCategories.length]);

  const updateTransferCostCategory = useCallback(async (id: string, updates: Partial<TransferCostCategory>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('transfer_cost_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setTransferCostCategories((prev) =>
          prev.map((cat) => (cat.id === id ? data : cat))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transfer cost category');
    }
  }, []);

  const deleteTransferCostCategory = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('transfer_cost_categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTransferCostCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transfer cost category');
    }
  }, []);

  const createOrUpdateBoardingPointSurcharge = useCallback(async (
    boardingPointId: string,
    transferCostCategoryId: string,
    amount: number
  ) => {
    try {
      const { data, error: upsertError } = await supabase
        .from('boarding_point_surcharges')
        .upsert({
          boarding_point_id: boardingPointId,
          transfer_cost_category_id: transferCostCategoryId,
          amount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'boarding_point_id,transfer_cost_category_id'
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      await fetchBoardingPoints();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save boarding point surcharge');
      throw err;
    }
  }, [fetchBoardingPoints]);

  const deleteBoardingPointSurcharge = useCallback(async (
    boardingPointId: string,
    transferCostCategoryId: string
  ) => {
    try {
      const { error: deleteError } = await supabase
        .from('boarding_point_surcharges')
        .delete()
        .eq('boarding_point_id', boardingPointId)
        .eq('transfer_cost_category_id', transferCostCategoryId);

      if (deleteError) throw deleteError;

      await fetchBoardingPoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete boarding point surcharge');
    }
  }, [fetchBoardingPoints]);

  const assignBoardingPointToTransport = useCallback(async (
    busTransportId: string,
    boardingPointId: string,
    transferCostCategoryId: string | null,
    zeit?: string
  ) => {
    try {
      let surchargeAmount: number | null = null;

      if (transferCostCategoryId) {
        const { data: surchargeData } = await supabase
          .from('boarding_point_surcharges')
          .select('amount')
          .eq('boarding_point_id', boardingPointId)
          .eq('transfer_cost_category_id', transferCostCategoryId)
          .maybeSingle();

        surchargeAmount = surchargeData?.amount || null;
      }

      const { data, error: assignError } = await supabase
        .from('boarding_point_assignments')
        .insert({
          bus_transport_id: busTransportId,
          boarding_point_id: boardingPointId,
          zeit: zeit || null,
          is_active: true,
          surcharge_amount: surchargeAmount,
        })
        .select()
        .single();

      if (assignError) throw assignError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign boarding point');
      throw err;
    }
  }, []);

  const unassignBoardingPointFromTransport = useCallback(async (
    assignmentId: string
  ) => {
    try {
      const { error: deleteError } = await supabase
        .from('boarding_point_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign boarding point');
      throw err;
    }
  }, []);

  const updateBoardingPointAssignment = useCallback(async (
    assignmentId: string,
    updates: Partial<BoardingPointAssignment>
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('boarding_point_assignments')
        .update(updates)
        .eq('id', assignmentId);

      if (updateError) throw updateError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update boarding point assignment');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBoardingPoints();
    fetchTransferCostCategories();
  }, [fetchBoardingPoints, fetchTransferCostCategories]);

  return {
    boardingPoints,
    transferCostCategories,
    loading,
    error,
    createBoardingPoint,
    updateBoardingPoint,
    deleteBoardingPoint,
    toggleStatus,
    createTransferCostCategory,
    updateTransferCostCategory,
    deleteTransferCostCategory,
    createOrUpdateBoardingPointSurcharge,
    deleteBoardingPointSurcharge,
    assignBoardingPointToTransport,
    unassignBoardingPointFromTransport,
    updateBoardingPointAssignment,
    refetch: fetchBoardingPoints,
  };
}
