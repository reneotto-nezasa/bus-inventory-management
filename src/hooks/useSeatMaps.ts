import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SeatMap, Seat, SeatType, SeatStatus } from '../types';

export function useSeatMaps() {
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([]);
  const [currentSeatMap, setCurrentSeatMap] = useState<SeatMap | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeatMaps = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('seat_maps')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSeatMaps(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seat maps');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSeats = useCallback(async (seatMapId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('seats')
        .select('*')
        .eq('seat_map_id', seatMapId)
        .order('row_index')
        .order('col_index');

      if (fetchError) throw fetchError;
      setSeats(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch seats');
    }
  }, []);

  const loadSeatMap = useCallback(async (id: string) => {
    const seatMap = seatMaps.find((s) => s.id === id);
    if (seatMap) {
      setCurrentSeatMap(seatMap);
      await fetchSeats(id);
    }
  }, [seatMaps, fetchSeats]);

  const createSeatMap = useCallback(async (data: Partial<SeatMap>) => {
    try {
      const { data: newSeatMap, error: createError } = await supabase
        .from('seat_maps')
        .insert({
          bezeichnung: data.bezeichnung || 'Neuer Sitzplan',
          art: data.art || 'BUS',
          orientierung: data.orientierung || 'Rechts -> Links',
          sitzplaetze_mit_reihenbezeichnung: data.sitzplaetze_mit_reihenbezeichnung ?? true,
          zoomfaktor: data.zoomfaktor || 1,
          rastergroesse: data.rastergroesse || 30,
          rows_count: data.rows_count || 12,
          cols_count: data.cols_count || 5,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (newSeatMap) {
        setSeatMaps((prev) => [newSeatMap, ...prev]);
        setCurrentSeatMap(newSeatMap);
        setSeats([]);
        return newSeatMap;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create seat map');
      throw err;
    }
  }, []);

  const updateSeatMap = useCallback(async (id: string, updates: Partial<SeatMap>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('seat_maps')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setSeatMaps((prev) => prev.map((s) => (s.id === id ? data : s)));
        if (currentSeatMap?.id === id) {
          setCurrentSeatMap(data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seat map');
    }
  }, [currentSeatMap]);

  const deleteSeatMap = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('seat_maps')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSeatMaps((prev) => prev.filter((s) => s.id !== id));
      if (currentSeatMap?.id === id) {
        setCurrentSeatMap(null);
        setSeats([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete seat map');
    }
  }, [currentSeatMap]);

  const updateSeat = useCallback(async (
    seatMapId: string,
    rowIndex: number,
    colIndex: number,
    updates: Partial<Seat>
  ) => {
    try {
      const existingSeat = seats.find(
        (s) => s.row_index === rowIndex && s.col_index === colIndex
      );

      if (existingSeat) {
        if (updates.seat_type === 'empty') {
          const { error: deleteError } = await supabase
            .from('seats')
            .delete()
            .eq('id', existingSeat.id);

          if (deleteError) throw deleteError;

          setSeats((prev) =>
            prev.filter((s) => !(s.row_index === rowIndex && s.col_index === colIndex))
          );
        } else {
          const { data, error: updateError } = await supabase
            .from('seats')
            .update(updates)
            .eq('id', existingSeat.id)
            .select()
            .single();

          if (updateError) throw updateError;

          if (data) {
            setSeats((prev) =>
              prev.map((s) =>
                s.row_index === rowIndex && s.col_index === colIndex ? data : s
              )
            );
          }
        }
      } else if (updates.seat_type && updates.seat_type !== 'empty') {
        const { data, error: insertError } = await supabase
          .from('seats')
          .insert({
            seat_map_id: seatMapId,
            row_index: rowIndex,
            col_index: colIndex,
            seat_type: updates.seat_type,
            label: updates.label || '',
            status: updates.status || 'available',
            block: updates.block || '',
            reihe: updates.reihe || null,
            platz: updates.platz || '',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          setSeats((prev) => [...prev, data]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seat');
    }
  }, [seats]);

  const changeSeatType = useCallback(async (
    seatMapId: string,
    rowIndex: number,
    colIndex: number,
    seatType: SeatType,
    label?: string
  ) => {
    await updateSeat(seatMapId, rowIndex, colIndex, {
      seat_type: seatType,
      label: label || '',
      status: 'available',
    });
  }, [updateSeat]);

  const changeSeatStatus = useCallback(async (
    seatMapId: string,
    rowIndex: number,
    colIndex: number,
    status: SeatStatus
  ) => {
    await updateSeat(seatMapId, rowIndex, colIndex, { status });
  }, [updateSeat]);

  const updateSeatById = useCallback(async (seatId: string, updates: Partial<Seat>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('seats')
        .update(updates)
        .eq('id', seatId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setSeats((prev) => prev.map((s) => (s.id === seatId ? { ...s, ...data } : s)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seat');
      throw err;
    }
  }, []);

  const createSeatMapFromTemplate = useCallback(async (templateType: 'hummel28' | 'novermann44') => {
    try {
      let seatMapData: Partial<SeatMap>;
      let seatsData: Array<Omit<Seat, 'id' | 'seat_map_id'>>;

      if (templateType === 'hummel28') {
        seatMapData = {
          bezeichnung: '28+1 Hummel Bus',
          art: 'BUS',
          orientierung: 'Rechts -> Links',
          sitzplaetze_mit_reihenbezeichnung: true,
          zoomfaktor: 1,
          rastergroesse: 30,
          rows_count: 9,
          cols_count: 5,
        };

        seatsData = [
          { row_index: 0, col_index: 0, seat_type: 'fahrer', label: 'Fahrer', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 0, col_index: 1, seat_type: 'einstieg', label: 'Einstieg', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 0, col_index: 3, seat_type: 'reiseleiter', label: '1D', status: 'blocked', block: '', reihe: 1, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 1, col_index: 0, seat_type: 'sitzplatz', label: '2A', status: 'available', block: '', reihe: 2, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 1, col_index: 1, seat_type: 'sitzplatz', label: '2B', status: 'available', block: '', reihe: 2, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 1, col_index: 3, seat_type: 'sitzplatz', label: '2C', status: 'available', block: '', reihe: 2, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 1, col_index: 4, seat_type: 'sitzplatz', label: '2D', status: 'available', block: '', reihe: 2, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 2, col_index: 0, seat_type: 'sitzplatz', label: '3A', status: 'available', block: '', reihe: 3, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 2, col_index: 1, seat_type: 'sitzplatz', label: '3B', status: 'available', block: '', reihe: 3, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 2, col_index: 3, seat_type: 'sitzplatz', label: '3C', status: 'available', block: '', reihe: 3, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 2, col_index: 4, seat_type: 'sitzplatz', label: '3D', status: 'available', block: '', reihe: 3, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 3, col_index: 0, seat_type: 'sitzplatz', label: '4A', status: 'available', block: '', reihe: 4, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 3, col_index: 1, seat_type: 'sitzplatz', label: '4B', status: 'available', block: '', reihe: 4, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 3, col_index: 3, seat_type: 'sitzplatz', label: '4C', status: 'available', block: '', reihe: 4, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 3, col_index: 4, seat_type: 'sitzplatz', label: '4D', status: 'available', block: '', reihe: 4, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 4, col_index: 0, seat_type: 'sitzplatz', label: '5A', status: 'available', block: '', reihe: 5, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 4, col_index: 1, seat_type: 'sitzplatz', label: '5B', status: 'available', block: '', reihe: 5, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 4, col_index: 3, seat_type: 'sitzplatz', label: '5C', status: 'available', block: '', reihe: 5, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 4, col_index: 4, seat_type: 'sitzplatz', label: '5D', status: 'available', block: '', reihe: 5, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 0, seat_type: 'sitzplatz', label: '6A', status: 'available', block: '', reihe: 6, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 1, seat_type: 'sitzplatz', label: '6B', status: 'available', block: '', reihe: 6, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 3, seat_type: 'wc', label: 'WC', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 4, seat_type: 'wc', label: 'WC', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 0, seat_type: 'sitzplatz', label: '7A', status: 'available', block: '', reihe: 7, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 1, seat_type: 'sitzplatz', label: '7B', status: 'available', block: '', reihe: 7, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 3, seat_type: 'sitzplatz', label: '7C', status: 'available', block: '', reihe: 7, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 4, seat_type: 'sitzplatz', label: '7D', status: 'available', block: '', reihe: 7, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 7, col_index: 0, seat_type: 'sitzplatz', label: '8A', status: 'available', block: '', reihe: 8, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 7, col_index: 1, seat_type: 'sitzplatz', label: '8B', status: 'available', block: '', reihe: 8, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 7, col_index: 3, seat_type: 'sitzplatz', label: '8C', status: 'available', block: '', reihe: 8, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 7, col_index: 4, seat_type: 'sitzplatz', label: '8D', status: 'available', block: '', reihe: 8, platz: 'D', passenger_name: null, booking_ref: null },
          { row_index: 8, col_index: 0, seat_type: 'sitzplatz', label: '9A', status: 'available', block: '', reihe: 9, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 8, col_index: 1, seat_type: 'sitzplatz', label: '9B', status: 'available', block: '', reihe: 9, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 8, col_index: 3, seat_type: 'sitzplatz', label: '9C', status: 'available', block: '', reihe: 9, platz: 'C', passenger_name: null, booking_ref: null },
          { row_index: 8, col_index: 4, seat_type: 'sitzplatz', label: '9D', status: 'available', block: '', reihe: 9, platz: 'D', passenger_name: null, booking_ref: null },
        ];
      } else {
        seatMapData = {
          bezeichnung: '44+1 Növermann Bus',
          art: 'BUS',
          orientierung: 'Rechts -> Links',
          sitzplaetze_mit_reihenbezeichnung: true,
          zoomfaktor: 1,
          rastergroesse: 30,
          rows_count: 12,
          cols_count: 5,
        };

        seatsData = [
          { row_index: 0, col_index: 0, seat_type: 'fahrer', label: 'Fahrer', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 0, col_index: 1, seat_type: 'einstieg', label: 'Einstieg', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 0, col_index: 3, seat_type: 'reiseleiter', label: '1D', status: 'blocked', block: '', reihe: 1, platz: 'D', passenger_name: null, booking_ref: null },
        ];

        for (let row = 2; row <= 5; row++) {
          const rowIndex = row - 1;
          seatsData.push(
            { row_index: rowIndex, col_index: 0, seat_type: 'sitzplatz', label: `${row}A`, status: 'available', block: '', reihe: row, platz: 'A', passenger_name: null, booking_ref: null },
            { row_index: rowIndex, col_index: 1, seat_type: 'sitzplatz', label: `${row}B`, status: 'available', block: '', reihe: row, platz: 'B', passenger_name: null, booking_ref: null },
            { row_index: rowIndex, col_index: 3, seat_type: 'sitzplatz', label: `${row}C`, status: 'available', block: '', reihe: row, platz: 'C', passenger_name: null, booking_ref: null },
            { row_index: rowIndex, col_index: 4, seat_type: 'sitzplatz', label: `${row}D`, status: 'available', block: '', reihe: row, platz: 'D', passenger_name: null, booking_ref: null }
          );
        }

        seatsData.push(
          { row_index: 5, col_index: 0, seat_type: 'sitzplatz', label: '6A', status: 'available', block: '', reihe: 6, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 1, seat_type: 'sitzplatz', label: '6B', status: 'available', block: '', reihe: 6, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 3, seat_type: 'wc', label: 'WC', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 5, col_index: 4, seat_type: 'wc', label: 'WC', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 0, seat_type: 'sitzplatz', label: '7A', status: 'available', block: '', reihe: 7, platz: 'A', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 1, seat_type: 'sitzplatz', label: '7B', status: 'available', block: '', reihe: 7, platz: 'B', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 3, seat_type: 'kueche', label: 'Küche', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null },
          { row_index: 6, col_index: 4, seat_type: 'kueche', label: 'Küche', status: 'blocked', block: '', reihe: null, platz: '', passenger_name: null, booking_ref: null }
        );

        for (let row = 8; row <= 12; row++) {
          const rowIndex = row - 1;
          seatsData.push(
            { row_index: rowIndex, col_index: 0, seat_type: 'sitzplatz', label: `${row}A`, status: 'available', block: '', reihe: row, platz: 'A', passenger_name: null, booking_ref: null },
            { row_index: rowIndex, col_index: 1, seat_type: 'sitzplatz', label: `${row}B`, status: 'available', block: '', reihe: row, platz: 'B', passenger_name: null, booking_ref: null },
            { row_index: rowIndex, col_index: 3, seat_type: 'sitzplatz', label: `${row}C`, status: 'available', block: '', reihe: row, platz: 'C', passenger_name: null, booking_ref: null },
            { row_index: rowIndex, col_index: 4, seat_type: 'sitzplatz', label: `${row}D`, status: 'available', block: '', reihe: row, platz: 'D', passenger_name: null, booking_ref: null }
          );
        }
      }

      const newSeatMap = await createSeatMap(seatMapData);
      if (!newSeatMap) throw new Error('Failed to create seat map');

      const seatsToInsert = seatsData.map(seat => ({
        ...seat,
        seat_map_id: newSeatMap.id,
      }));

      const { data: createdSeats, error: seatsError } = await supabase
        .from('seats')
        .insert(seatsToInsert)
        .select();

      if (seatsError) throw seatsError;

      setSeats(createdSeats || []);
      return newSeatMap;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create seat map from template');
      throw err;
    }
  }, [createSeatMap]);

  useEffect(() => {
    fetchSeatMaps();
  }, [fetchSeatMaps]);

  return {
    seatMaps,
    currentSeatMap,
    seats,
    loading,
    error,
    loadSeatMap,
    createSeatMap,
    createSeatMapFromTemplate,
    updateSeatMap,
    deleteSeatMap,
    updateSeat,
    updateSeatById,
    changeSeatType,
    changeSeatStatus,
    setCurrentSeatMap,
    setSeats,
  };
}
