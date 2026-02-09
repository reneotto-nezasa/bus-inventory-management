import type { Seat, UnassignedPassenger, BulkAssignmentSuggestion } from '../types';

export function generateBulkAssignments(
  unassignedPassengers: UnassignedPassenger[],
  availableSeats: Seat[]
): BulkAssignmentSuggestion[] {
  const suggestions: BulkAssignmentSuggestion[] = [];
  const assignedSeats = new Set<string>();
  const assignedPassengers = new Set<string>();

  const getAdjacentSeat = (seat: Seat, seats: Seat[]): Seat | null => {
    const sameRow = seats.filter((s) => s.reihe === seat.reihe && !assignedSeats.has(s.id));

    if (seat.platz === 'A') {
      return sameRow.find((s) => s.platz === 'B') || null;
    } else if (seat.platz === 'B') {
      return sameRow.find((s) => s.platz === 'A') || null;
    } else if (seat.platz === 'C') {
      return sameRow.find((s) => s.platz === 'D') || null;
    } else if (seat.platz === 'D') {
      return sameRow.find((s) => s.platz === 'C') || null;
    }
    return null;
  };

  const isWindowSeat = (seat: Seat): boolean => {
    return seat.platz === 'A' || seat.platz === 'D';
  };

  const isAisleSeat = (seat: Seat): boolean => {
    return seat.platz === 'B' || seat.platz === 'C';
  };

  const findBestSeatForPreference = (
    passenger: UnassignedPassenger,
    availSeats: Seat[]
  ): { seat: Seat; confidence: 'high' | 'medium' | 'low'; reason: string } | null => {
    const prefText = passenger.preference_text?.toLowerCase() || '';
    const prefType = passenger.preference_type;

    let filtered = availSeats.filter((s) => !assignedSeats.has(s.id));

    if (prefType === 'position') {
      if (prefText.includes('vorne') || prefText.includes('forward')) {
        filtered.sort((a, b) => (a.reihe || 99) - (b.reihe || 99));
        if (filtered.length > 0) {
          return {
            seat: filtered[0],
            confidence: 'high',
            reason: `Position: ${passenger.preference_text}`,
          };
        }
      } else if (prefText.includes('hinten') || prefText.includes('back')) {
        filtered.sort((a, b) => (b.reihe || 0) - (a.reihe || 0));
        if (filtered.length > 0) {
          return {
            seat: filtered[0],
            confidence: 'high',
            reason: `Position: ${passenger.preference_text}`,
          };
        }
      } else if (prefText.includes('fenster') || prefText.includes('window')) {
        const windowSeats = filtered.filter(isWindowSeat);
        if (windowSeats.length > 0) {
          return {
            seat: windowSeats[0],
            confidence: 'high',
            reason: `Position: ${passenger.preference_text}`,
          };
        }
      } else if (prefText.includes('gang') || prefText.includes('aisle')) {
        const aisleSeats = filtered.filter(isAisleSeat);
        if (aisleSeats.length > 0) {
          return {
            seat: aisleSeats[0],
            confidence: 'high',
            reason: `Position: ${passenger.preference_text}`,
          };
        }
      }
    }

    return null;
  };

  const passengersWithCompanion: Array<{
    passenger: UnassignedPassenger;
    companionName: string;
  }> = [];

  for (const passenger of unassignedPassengers) {
    if (
      passenger.preference_type === 'companion' &&
      passenger.preference_text
    ) {
      const match = passenger.preference_text.match(/(?:with|neben|next to)\s+([^,]+)/i);
      if (match) {
        const companionName = match[1].trim();
        passengersWithCompanion.push({ passenger, companionName });
      }
    }
  }

  for (const { passenger, companionName } of passengersWithCompanion) {
    if (assignedPassengers.has(passenger.id)) continue;

    const companion = unassignedPassengers.find(
      (p) => p.name.toLowerCase().includes(companionName.toLowerCase()) && !assignedPassengers.has(p.id)
    );

    if (companion) {
      for (const seat of availableSeats) {
        if (assignedSeats.has(seat.id)) continue;

        const adjacentSeat = getAdjacentSeat(seat, availableSeats);
        if (adjacentSeat && !assignedSeats.has(adjacentSeat.id)) {
          suggestions.push({
            passenger_id: passenger.id,
            passenger_name: passenger.name,
            suggested_seat_id: seat.id,
            suggested_seat_label: seat.label,
            reason: `Companion: next to ${companion.name} in ${adjacentSeat.label}`,
            confidence: 'high',
            conflicts: [],
          });

          suggestions.push({
            passenger_id: companion.id,
            passenger_name: companion.name,
            suggested_seat_id: adjacentSeat.id,
            suggested_seat_label: adjacentSeat.label,
            reason: `Companion: next to ${passenger.name} in ${seat.label}`,
            confidence: 'high',
            conflicts: [],
          });

          assignedSeats.add(seat.id);
          assignedSeats.add(adjacentSeat.id);
          assignedPassengers.add(passenger.id);
          assignedPassengers.add(companion.id);
          break;
        }
      }
    }
  }

  for (const passenger of unassignedPassengers) {
    if (assignedPassengers.has(passenger.id)) continue;

    if (passenger.preference_text && passenger.preference_type === 'position') {
      const result = findBestSeatForPreference(
        passenger,
        availableSeats.filter((s) => !assignedSeats.has(s.id))
      );

      if (result) {
        suggestions.push({
          passenger_id: passenger.id,
          passenger_name: passenger.name,
          suggested_seat_id: result.seat.id,
          suggested_seat_label: result.seat.label,
          reason: result.reason,
          confidence: result.confidence,
          conflicts: [],
        });

        assignedSeats.add(result.seat.id);
        assignedPassengers.add(passenger.id);
      }
    }
  }

  const remainingPassengers = unassignedPassengers.filter(
    (p) => !assignedPassengers.has(p.id)
  );
  const remainingSeats = availableSeats
    .filter((s) => !assignedSeats.has(s.id))
    .sort((a, b) => {
      if (a.reihe !== b.reihe) return (a.reihe || 99) - (b.reihe || 99);
      return a.platz.localeCompare(b.platz);
    });

  for (let i = 0; i < remainingPassengers.length && i < remainingSeats.length; i++) {
    const passenger = remainingPassengers[i];
    const seat = remainingSeats[i];

    suggestions.push({
      passenger_id: passenger.id,
      passenger_name: passenger.name,
      suggested_seat_id: seat.id,
      suggested_seat_label: seat.label,
      reason: 'Standard assignment',
      confidence: 'medium',
      conflicts: [],
    });

    assignedSeats.add(seat.id);
    assignedPassengers.add(passenger.id);
  }

  const positionPreferences = suggestions.filter(
    (s) => s.reason.startsWith('Position:') && s.confidence === 'high'
  );
  const targetRowNumbers = new Map<number, number>();

  for (const pref of positionPreferences) {
    const seat = availableSeats.find((s) => s.id === pref.suggested_seat_id);
    if (seat && seat.reihe) {
      targetRowNumbers.set(seat.reihe, (targetRowNumbers.get(seat.reihe) || 0) + 1);
    }
  }

  for (const suggestion of suggestions) {
    const seat = availableSeats.find((s) => s.id === suggestion.suggested_seat_id);
    if (seat && seat.reihe && targetRowNumbers.get(seat.reihe)! > 1) {
      const competingPref = positionPreferences.find(
        (p) => p.passenger_id !== suggestion.passenger_id &&
        availableSeats.find((s) => s.id === p.suggested_seat_id)?.reihe === seat.reihe
      );
      if (competingPref) {
        suggestion.conflicts.push(
          `Both ${suggestion.passenger_name} and ${competingPref.passenger_name} prefer row ${seat.reihe}`
        );
      }
    }
  }

  return suggestions;
}
