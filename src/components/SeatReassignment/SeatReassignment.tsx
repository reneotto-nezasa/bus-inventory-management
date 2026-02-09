import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Undo2, Users, Ban, Wand2, User } from 'lucide-react';
import type { BusTransport, Seat, SeatMap, SeatAssignment, UnassignedPassenger, SeatOperation, BulkAssignmentSuggestion } from '../../types';
import { useSeatMaps, useSeatAssignments } from '../../hooks';
import { UnassignedPassengersPanel } from './UnassignedPassengersPanel';
import { PassengerInfoPanel } from './PassengerInfoPanel';
import { BulkAssignmentModal } from './BulkAssignmentModal';
import { generateBulkAssignments } from '../../utils/bulkAssignmentAlgorithm';

interface SeatReassignmentProps {
  transport: BusTransport;
  onClose: () => void;
}

type Mode = 'idle' | 'assigning' | 'freeing' | 'moving';

export function SeatReassignment({ transport, onClose }: SeatReassignmentProps) {
  const { t } = useTranslation('seatmaps');
  const { seatMaps, seats: seatMapSeats, loadSeatMap, updateSeatById } = useSeatMaps();
  const {
    assignPassengerToSeat,
    freeSeat,
    movePassenger,
    fetchSeatAssignmentsForTransport,
  } = useSeatAssignments();

  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [selectedPassenger, setSelectedPassenger] = useState<UnassignedPassenger | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [operations, setOperations] = useState<SeatOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; seat: Seat } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<SeatAssignment | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSuggestions, setBulkSuggestions] = useState<BulkAssignmentSuggestion[]>([]);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    assignment: SeatAssignment;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!transport.seat_map_id) {
        setLoading(false);
        return;
      }

      try {
        const map = seatMaps.find((sm) => sm.id === transport.seat_map_id);
        if (map) {
          setSeatMap(map);
          await loadSeatMap(map.id);
        }

        const assignmentsData = await fetchSeatAssignmentsForTransport(transport.id);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error('Failed to load seat reassignment data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [transport, seatMaps, loadSeatMap, fetchSeatAssignmentsForTransport]);

  useEffect(() => {
    setSeats(seatMapSeats);
  }, [seatMapSeats]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getSeatStatus = (seat: Seat): 'free' | 'occupied' | 'blocked' | 'user-blocked' | 'tour-guide' => {
    if (seat.is_blocked && seat.block_reason?.startsWith('Reiseleiter:')) {
      return 'tour-guide';
    }

    if (seat.is_blocked) {
      return 'user-blocked';
    }

    if (seat.seat_type === 'fahrer' || seat.seat_type === 'reiseleiter' ||
        seat.seat_type === 'wc' || seat.seat_type === 'kueche' ||
        seat.seat_type === 'einstieg' || seat.seat_type === 'holm' ||
        seat.seat_type === 'aufgang' || seat.seat_type === 'abgang' ||
        seat.seat_type === 'tisch' || seat.seat_type === 'empty') {
      return 'blocked';
    }

    const assignment = assignments.find((a) => a.seat_id === seat.id);
    return assignment ? 'occupied' : 'free';
  };

  const getSeatPassenger = (seat: Seat): string | null => {
    const assignment = assignments.find((a) => a.seat_id === seat.id);
    return assignment ? assignment.passenger_name : null;
  };

  const getSeatAssignment = (seat: Seat): SeatAssignment | null => {
    return assignments.find((a) => a.seat_id === seat.id) || null;
  };

  const unassignedPassengers = useMemo(() => {
    const mockPassengers: UnassignedPassenger[] = [
      {
        id: '1',
        name: 'Max Mustermann',
        booking_reference: 'BK-2024-1001',
        preference_text: 'Window seat preferred',
        preference_type: 'position',
        accommodation_type: 'Rubindeck Zweibettkabine',
        passenger_email: 'max.mustermann@example.com',
        passenger_phone: '+49 171 1234567'
      },
      {
        id: '2',
        name: 'Anna Schmidt',
        booking_reference: 'BK-2024-1002',
        preference_text: 'With Thomas Wagner',
        preference_type: 'companion',
        accommodation_type: 'Smaragddeck Einzelkabine',
        passenger_email: 'anna.schmidt@example.com',
        passenger_phone: '+49 171 2345678'
      },
      {
        id: '3',
        name: 'Peter Mueller',
        booking_reference: 'BK-2024-1003',
        accommodation_type: 'Rubindeck Zweibettkabine',
        passenger_email: 'peter.mueller@example.com'
      },
      {
        id: '4',
        name: 'Laura Weber',
        booking_reference: 'BK-2024-1004',
        preference_text: 'Wheelchair accessible',
        preference_type: 'accessibility',
        accommodation_type: 'Saphirdeck Barrierefreie Kabine',
        passenger_email: 'laura.weber@example.com',
        passenger_phone: '+49 171 3456789'
      },
      {
        id: '5',
        name: 'Thomas Wagner',
        booking_reference: 'BK-2024-1005',
        accommodation_type: 'Smaragddeck Einzelkabine',
        passenger_email: 'thomas.wagner@example.com',
        passenger_phone: '+49 171 4567890'
      },
    ];

    const assignedPassengerNames = new Set(assignments.map((a) => a.passenger_name));
    return mockPassengers.filter((p) => !assignedPassengerNames.has(p.name));
  }, [assignments]);

  const seatCounts = useMemo(() => {
    const assignableSeats = seats.filter(
      (s) =>
        s.seat_type !== 'fahrer' &&
        s.seat_type !== 'reiseleiter' &&
        s.seat_type !== 'wc' &&
        s.seat_type !== 'kueche' &&
        s.seat_type !== 'einstieg' &&
        s.seat_type !== 'holm' &&
        s.seat_type !== 'aufgang' &&
        s.seat_type !== 'abgang' &&
        s.seat_type !== 'tisch' &&
        s.seat_type !== 'empty'
    );

    const total = assignableSeats.length;
    const blocked = assignableSeats.filter((s) => s.is_blocked).length;
    const occupied = assignableSeats.filter((s) => !s.is_blocked && assignments.some((a) => a.seat_id === s.id)).length;
    const available = total - blocked - occupied;

    return { total, blocked, occupied, available };
  }, [seats, assignments]);

  const handleSeatClick = async (seat: Seat) => {
    const status = getSeatStatus(seat);

    if (mode === 'idle') {
      if (status === 'occupied') {
        const assignment = getSeatAssignment(seat);
        if (assignment) {
          setSelectedAssignment(assignment);
        }
      } else if (status === 'tour-guide') {
        const guideName = seat.block_reason?.replace('Reiseleiter: ', '') || 'Tour Guide';
        setSelectedAssignment({
          id: `tour-guide-${seat.id}`,
          seat_id: seat.id,
          bus_transport_id: transport.id,
          passenger_name: `${guideName} (${t('seat.tourGuide')})`,
          booking_reference: null,
          accommodation_type: null,
          passenger_email: null,
          passenger_phone: null,
          preferences: null,
          preference_text: t('seat.tourGuide'),
          preference_type: null,
          assigned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          seat,
        });
      } else if (status === 'free') {
        setMode('assigning');
        setSelectedSeat(seat);
      }
    } else if (mode === 'assigning' && selectedPassenger) {
      if (status === 'free') {
        await handleAssignPassenger(seat, selectedPassenger);
      }
    } else if (mode === 'moving' && selectedSeat) {
      if (status === 'free') {
        await handleMovePassenger(selectedSeat, seat);
      }
    }
  };

  const handleSeatHover = (e: React.MouseEvent, seat: Seat) => {
    const status = getSeatStatus(seat);
    if (status === 'tour-guide' && seat.block_reason) {
      const guideName = seat.block_reason.replace('Reiseleiter: ', '');
      setTooltipData({
        x: e.clientX,
        y: e.clientY,
        assignment: {
          id: `tooltip-${seat.id}`,
          seat_id: seat.id,
          bus_transport_id: transport.id,
          passenger_name: guideName,
          booking_reference: null,
          accommodation_type: null,
          passenger_email: null,
          passenger_phone: null,
          preferences: null,
          preference_text: t('seat.tourGuide'),
          preference_type: null,
          assigned_at: '',
          created_at: '',
          updated_at: '',
        },
      });
      return;
    }
    const assignment = getSeatAssignment(seat);
    if (assignment) {
      setTooltipData({
        x: e.clientX,
        y: e.clientY,
        assignment,
      });
    }
  };

  const handleSeatLeave = () => {
    setTooltipData(null);
  };

  const handleSeatRightClick = (e: React.MouseEvent, seat: Seat) => {
    e.preventDefault();
    const status = getSeatStatus(seat);
    if (status === 'free' || status === 'user-blocked' || status === 'tour-guide') {
      setContextMenu({ x: e.clientX, y: e.clientY, seat });
    }
  };

  const handleBlockSeat = async (seat: Seat) => {
    const reason = prompt(t('seat.blockReason'));
    try {
      await updateSeatById(seat.id, { is_blocked: true, block_reason: reason || null });
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, is_blocked: true, block_reason: reason || null } : s))
      );

      addOperation({
        id: crypto.randomUUID(),
        type: 'block',
        timestamp: new Date().toISOString(),
        seatId: seat.id,
        seatLabel: seat.label,
        blockReason: reason || undefined,
      });
    } catch (error) {
      console.error('Failed to block seat:', error);
    }
    setContextMenu(null);
  };

  const handleBlockSeatWithReason = async (seat: Seat, reason: string) => {
    try {
      await updateSeatById(seat.id, { is_blocked: true, block_reason: `${reason}: ` });
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, is_blocked: true, block_reason: `${reason}: ` } : s))
      );

      addOperation({
        id: crypto.randomUUID(),
        type: 'block',
        timestamp: new Date().toISOString(),
        seatId: seat.id,
        seatLabel: seat.label,
        blockReason: reason,
      });
    } catch (error) {
      console.error('Failed to block seat:', error);
    }
    setContextMenu(null);
  };

  const handleUnblockSeat = async (seat: Seat) => {
    try {
      await updateSeatById(seat.id, { is_blocked: false, block_reason: null });
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, is_blocked: false, block_reason: null } : s))
      );

      addOperation({
        id: crypto.randomUUID(),
        type: 'unblock',
        timestamp: new Date().toISOString(),
        seatId: seat.id,
        seatLabel: seat.label,
      });
    } catch (error) {
      console.error('Failed to unblock seat:', error);
    }
    setContextMenu(null);
  };

  const handleAssignPassenger = async (seat: Seat, passenger: UnassignedPassenger) => {
    try {
      const assignment = await assignPassengerToSeat(
        seat.id,
        transport.id,
        passenger.name,
        passenger.booking_reference || undefined,
        passenger.preferences || undefined
      );

      setAssignments((prev) => [...prev, assignment]);

      addOperation({
        id: crypto.randomUUID(),
        type: 'assign',
        timestamp: new Date().toISOString(),
        seatId: seat.id,
        seatLabel: seat.label,
        passengerName: passenger.name,
      });

      setMode('idle');
      setSelectedPassenger(null);
      setSelectedSeat(null);
    } catch (error) {
      console.error('Failed to assign passenger:', error);
    }
  };

  const handleFreeSeat = async (seat: Seat) => {
    try {
      const assignment = await freeSeat(seat.id, transport.id);

      setAssignments((prev) => prev.filter((a) => a.seat_id !== seat.id));

      addOperation({
        id: crypto.randomUUID(),
        type: 'free',
        timestamp: new Date().toISOString(),
        seatId: seat.id,
        seatLabel: seat.label,
        passengerName: assignment.passenger_name,
      });

      setMode('idle');
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Failed to free seat:', error);
      setMode('idle');
    }
  };

  const handleMovePassenger = async (fromSeat: Seat, toSeat: Seat) => {
    try {
      const result = await movePassenger(fromSeat.id, toSeat.id, transport.id);

      setAssignments((prev) =>
        prev.filter((a) => a.seat_id !== fromSeat.id).concat(result.newAssignment)
      );

      addOperation({
        id: crypto.randomUUID(),
        type: 'move',
        timestamp: new Date().toISOString(),
        seatId: toSeat.id,
        seatLabel: toSeat.label,
        fromSeatId: fromSeat.id,
        fromSeatLabel: fromSeat.label,
        toSeatId: toSeat.id,
        toSeatLabel: toSeat.label,
        passengerName: result.newAssignment.passenger_name,
      });

      setMode('idle');
      setSelectedSeat(null);
    } catch (error) {
      console.error('Failed to move passenger:', error);
      setMode('idle');
      setSelectedSeat(null);
    }
  };

  const handleBulkAssign = () => {
    const availableSeats = seats.filter(
      (s) =>
        !s.is_blocked &&
        getSeatStatus(s) === 'free' &&
        s.seat_type !== 'fahrer' &&
        s.seat_type !== 'reiseleiter' &&
        s.seat_type !== 'wc' &&
        s.seat_type !== 'kueche' &&
        s.seat_type !== 'einstieg' &&
        s.seat_type !== 'holm' &&
        s.seat_type !== 'aufgang' &&
        s.seat_type !== 'abgang' &&
        s.seat_type !== 'tisch' &&
        s.seat_type !== 'empty'
    );

    const suggestions = generateBulkAssignments(unassignedPassengers, availableSeats);
    setBulkSuggestions(suggestions);
    setShowBulkModal(true);
  };

  const handleApplyBulkAssignments = async (selectedSuggestions: BulkAssignmentSuggestion[]) => {
    try {
      const bulkOps: Array<{ seatId: string; seatLabel: string; passengerName: string }> = [];

      for (const suggestion of selectedSuggestions) {
        const passenger = unassignedPassengers.find((p) => p.id === suggestion.passenger_id);
        const seat = seats.find((s) => s.id === suggestion.suggested_seat_id);

        if (passenger && seat) {
          const assignment = await assignPassengerToSeat(
            seat.id,
            transport.id,
            passenger.name,
            passenger.booking_reference || undefined,
            passenger.preferences || undefined
          );

          setAssignments((prev) => [...prev, assignment]);
          bulkOps.push({
            seatId: seat.id,
            seatLabel: seat.label,
            passengerName: passenger.name,
          });
        }
      }

      addOperation({
        id: crypto.randomUUID(),
        type: 'bulk_assign',
        timestamp: new Date().toISOString(),
        seatId: '',
        seatLabel: '',
        bulkAssignments: bulkOps,
      });

      setShowBulkModal(false);
      setBulkSuggestions([]);
    } catch (error) {
      console.error('Failed to apply bulk assignments:', error);
    }
  };

  const addOperation = (operation: SeatOperation) => {
    setOperations((prev) => [operation, ...prev].slice(0, 10));
  };

  const handleUndo = async () => {
    if (operations.length === 0) return;

    const lastOperation = operations[0];

    try {
      if (lastOperation.type === 'assign') {
        await freeSeat(lastOperation.seatId, transport.id);
        setAssignments((prev) => prev.filter((a) => a.seat_id !== lastOperation.seatId));
      } else if (lastOperation.type === 'free') {
      } else if (lastOperation.type === 'move' && lastOperation.fromSeatId && lastOperation.toSeatId) {
        await movePassenger(lastOperation.toSeatId, lastOperation.fromSeatId, transport.id);
        const assignmentsData = await fetchSeatAssignmentsForTransport(transport.id);
        setAssignments(assignmentsData);
      } else if (lastOperation.type === 'block') {
        const seat = seats.find((s) => s.id === lastOperation.seatId);
        if (seat) await handleUnblockSeat(seat);
      } else if (lastOperation.type === 'unblock') {
        const seat = seats.find((s) => s.id === lastOperation.seatId);
        if (seat) await handleBlockSeat(seat);
      } else if (lastOperation.type === 'bulk_assign' && lastOperation.bulkAssignments) {
        for (const bulkOp of lastOperation.bulkAssignments) {
          await freeSeat(bulkOp.seatId, transport.id);
        }
        const assignmentsData = await fetchSeatAssignmentsForTransport(transport.id);
        setAssignments(assignmentsData);
      }

      setOperations((prev) => prev.slice(1));
    } catch (error) {
      console.error('Failed to undo operation:', error);
    }
  };

  const handleSelectPassenger = (passenger: UnassignedPassenger) => {
    setSelectedPassenger(passenger);
    setMode('assigning');
  };

  const grid = useMemo(() => {
    if (!seatMap) return [];

    const gridArray: (Seat | null)[][] = [];
    for (let row = 0; row < seatMap.rows_count; row++) {
      gridArray[row] = [];
      for (let col = 0; col < seatMap.cols_count; col++) {
        const seat = seats.find((s) => s.row_index === row && s.col_index === col);
        gridArray[row][col] = seat || null;
      }
    }
    return gridArray;
  }, [seatMap, seats]);

  if (!transport.seat_map_id || !seatMap) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">{t('reassignment.noSeatMap')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-400">{t('reassignment.noSeatMapHint')}</p>
          <button onClick={onClose} className="btn-primary mt-4 w-full">
            {t('actions.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{t('reassignment.title')}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {transport.text} - {new Date(transport.termin).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-teal-400 font-medium">
                {t('seat.available')}: {seatCounts.available}/{seatCounts.total}
              </span>
              {seatCounts.blocked > 0 && (
                <span className="text-red-400 flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  {seatCounts.blocked} {t('seat.blocked')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unassignedPassengers.length > 0 && (
              <button
                onClick={handleBulkAssign}
                className="btn-ghost flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {t('bulk.smartAssign')}
              </button>
            )}
            {operations.length > 0 && (
              <button
                onClick={handleUndo}
                className="btn-ghost flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                {t('reassignment.undo')}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-300">{t('reassignment.free')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-300">{t('reassignment.occupied')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-gray-300">{t('seat.legendTourGuide')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-300">{t('seat.blocked')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-gray-300">{t('reassignment.blocked')}</span>
                </div>
              </div>
            </div>

            {mode === 'assigning' && selectedPassenger && (
              <div className="mb-4 p-3 bg-teal-500 bg-opacity-20 border border-teal-500 rounded text-center">
                <p className="text-white font-medium">
                  {t('reassignment.clickSeatToAssign')}: <strong>{selectedPassenger.name}</strong>
                </p>
              </div>
            )}

            <div className="inline-block bg-gray-700 rounded-lg p-4">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 mb-1">
                  {row.map((seat, colIndex) => {
                    if (!seat || seat.seat_type === 'empty') {
                      return <div key={colIndex} className="w-16 h-16"></div>;
                    }

                    const status = getSeatStatus(seat);
                    const passenger = getSeatPassenger(seat);
                    const isSelectable = status === 'free' || status === 'occupied' || status === 'tour-guide';

                    let bgColor = 'bg-gray-600';
                    if (status === 'free') bgColor = 'bg-blue-500';
                    else if (status === 'occupied') bgColor = 'bg-green-500';
                    else if (status === 'tour-guide') bgColor = 'bg-purple-500';
                    else if (status === 'user-blocked') bgColor = 'bg-red-500';
                    else if (status === 'blocked') bgColor = 'bg-gray-500';

                    const getTourGuideName = () => {
                      if (status === 'tour-guide' && seat.block_reason) {
                        const match = seat.block_reason.match(/Reiseleiter:\s*(.+)/);
                        if (match) {
                          const fullName = match[1].trim();
                          const names = fullName.split(' ');
                          return names.map(n => n[0]).join('');
                        }
                      }
                      return null;
                    };

                    const tourGuideInitials = getTourGuideName();

                    return (
                      <button
                        key={colIndex}
                        onClick={() => isSelectable && handleSeatClick(seat)}
                        onMouseEnter={(e) => (status === 'occupied' || status === 'tour-guide') && handleSeatHover(e, seat)}
                        onMouseLeave={handleSeatLeave}
                        onContextMenu={(e) => handleSeatRightClick(e, seat)}
                        disabled={!isSelectable && status !== 'user-blocked'}
                        className={`w-16 h-16 rounded ${bgColor} text-white text-xs flex flex-col items-center justify-center transition-all relative ${
                          isSelectable || status === 'user-blocked' ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                        title={(status === 'user-blocked' || status === 'tour-guide') && seat.block_reason ? seat.block_reason : undefined}
                      >
                        {status === 'user-blocked' ? (
                          <X className="w-8 h-8" />
                        ) : status === 'tour-guide' ? (
                          <>
                            <span className="font-bold">{seat.label}</span>
                            {tourGuideInitials && (
                              <span className="text-[10px] mt-1 truncate w-full px-1">
                                {tourGuideInitials}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-bold">{seat.label}</span>
                            {passenger && (
                              <span className="text-[10px] mt-1 truncate w-full px-1">
                                {passenger.split(' ').pop()}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {selectedAssignment ? (
            <PassengerInfoPanel
              assignment={selectedAssignment}
              onClose={() => setSelectedAssignment(null)}
            />
          ) : (
            <UnassignedPassengersPanel
              transportId={transport.id}
              assignments={assignments}
              onSelectPassenger={handleSelectPassenger}
              selectedPassenger={selectedPassenger}
            />
          )}
        </div>
      </div>

      {tooltipData && (
        <div
          className="fixed bg-gray-900 border border-gray-700 rounded shadow-lg p-2 z-50 pointer-events-none"
          style={{ top: tooltipData.y + 10, left: tooltipData.x + 10 }}
        >
          <p className="text-white text-sm font-medium">{tooltipData.assignment.passenger_name}</p>
          {tooltipData.assignment.preference_text && (
            <p className="text-gray-400 text-xs mt-1 max-w-xs truncate">
              {tooltipData.assignment.preference_text}
            </p>
          )}
          {tooltipData.assignment.booking_reference && (
            <p className="text-teal-400 text-xs mt-1">
              {tooltipData.assignment.booking_reference}
            </p>
          )}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {!contextMenu.seat.is_blocked ? (
            <>
              <button
                onClick={() => handleBlockSeat(contextMenu.seat)}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                {t('seat.block')}
              </button>
              <button
                onClick={() => handleBlockSeatWithReason(contextMenu.seat, 'Reiseleiter')}
                className="w-full px-4 py-2 text-left text-purple-400 hover:bg-gray-700 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {t('seat.tourGuide')}
              </button>
            </>
          ) : (
            <button
              onClick={() => handleUnblockSeat(contextMenu.seat)}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              {t('seat.unblock')}
            </button>
          )}
        </div>
      )}

      {showBulkModal && (
        <BulkAssignmentModal
          suggestions={bulkSuggestions}
          onApply={handleApplyBulkAssignments}
          onCancel={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
}
