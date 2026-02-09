import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Bus, Car, Calendar, Clock, DollarSign, Settings, AlertCircle } from 'lucide-react';
import type { Trip, BusTransport, BoardingPoint } from '../../types';
import { useBoardingPoints, useTrips } from '../../hooks';
import { SurchargeManagementPanel } from './SurchargeManagementPanel';

interface BoardingPointsTabProps {
  trip: Trip;
  selectedTransportId: string | null;
}

type FilterType = 'all' | 'assigned' | 'released';
type DirectionTab = 'outbound' | 'return';

export function BoardingPointsTab({ trip, selectedTransportId }: BoardingPointsTabProps) {
  const { t } = useTranslation(['trips', 'boarding']);
  const {
    boardingPoints,
    transferCostCategories,
    assignBoardingPointToTransport,
    unassignBoardingPointFromTransport,
    updateBoardingPointAssignment,
  } = useBoardingPoints();
  const { updateBusTransport, refetch } = useTrips();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedBoardingPoints, setSelectedBoardingPoints] = useState<Set<string>>(new Set());
  const [showSurchargePanel, setShowSurchargePanel] = useState(false);
  const [directionTab, setDirectionTab] = useState<DirectionTab>('outbound');

  const selectedTransport = useMemo(() => {
    if (!selectedTransportId) return null;
    return trip.bus_transports?.find((t) => t.id === selectedTransportId) || null;
  }, [trip.bus_transports, selectedTransportId]);

  const assignedBoardingPointIds = useMemo(() => {
    if (!selectedTransport?.boarding_point_assignments) return new Set<string>();
    return new Set(
      selectedTransport.boarding_point_assignments
        .filter((a) => !a.direction || a.direction === directionTab)
        .map((a) => a.boarding_point_id)
    );
  }, [selectedTransport, directionTab]);

  const filteredBoardingPoints = useMemo(() => {
    let points = boardingPoints;

    if (filter === 'assigned') {
      points = points.filter((bp) => assignedBoardingPointIds.has(bp.id));
    } else if (filter === 'released') {
      points = points.filter((bp) => bp.status === 'freigegeben');
    }

    return points;
  }, [boardingPoints, filter, assignedBoardingPointIds]);

  const formatBoardingPointLocation = (bp: BoardingPoint): string => {
    if (bp.postal_code && bp.street_address) {
      return t('boarding:enrichedFormat', {
        postalCode: bp.postal_code,
        city: bp.ort,
        streetAddress: bp.street_address,
      });
    }
    return `${bp.plz} ${bp.ort}, ${bp.stelle}`;
  };

  const handleToggleAssignment = async (boardingPointId: string) => {
    if (!selectedTransport) return;

    const isAssigned = assignedBoardingPointIds.has(boardingPointId);

    if (isAssigned) {
      const assignment = selectedTransport.boarding_point_assignments?.find(
        (a) => a.boarding_point_id === boardingPointId && (!a.direction || a.direction === directionTab)
      );
      if (assignment) {
        await unassignBoardingPointFromTransport(assignment.id);
      }
    } else {
      await assignBoardingPointToTransport(
        selectedTransport.id,
        boardingPointId,
        selectedTransport.transfer_cost_category_id
      );
      const assignment = selectedTransport.boarding_point_assignments?.find(
        (a) => a.boarding_point_id === boardingPointId
      );
      if (assignment) {
        await updateBoardingPointAssignment(assignment.id, { direction: directionTab });
      }
    }

    await refetch();
  };

  const handleBulkAssign = async () => {
    if (!selectedTransport) return;

    for (const boardingPointId of selectedBoardingPoints) {
      if (!assignedBoardingPointIds.has(boardingPointId)) {
        await assignBoardingPointToTransport(
          selectedTransport.id,
          boardingPointId,
          selectedTransport.transfer_cost_category_id
        );
      }
    }

    setSelectedBoardingPoints(new Set());
    await refetch();
  };

  const handleBulkUnassign = async () => {
    if (!selectedTransport) return;

    for (const boardingPointId of selectedBoardingPoints) {
      const assignment = selectedTransport.boarding_point_assignments?.find(
        (a) => a.boarding_point_id === boardingPointId && (!a.direction || a.direction === directionTab)
      );
      if (assignment) {
        await unassignBoardingPointFromTransport(assignment.id);
      }
    }

    setSelectedBoardingPoints(new Set());
    await refetch();
  };

  const handleToggleSelection = (boardingPointId: string) => {
    const newSelection = new Set(selectedBoardingPoints);
    if (newSelection.has(boardingPointId)) {
      newSelection.delete(boardingPointId);
    } else {
      newSelection.add(boardingPointId);
    }
    setSelectedBoardingPoints(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedBoardingPoints(new Set(filteredBoardingPoints.map((bp) => bp.id)));
  };

  const handleDeselectAll = () => {
    setSelectedBoardingPoints(new Set());
  };

  const handleUpdatePickupTime = async (assignmentId: string, pickupTime: string) => {
    await updateBoardingPointAssignment(assignmentId, { pickup_time: pickupTime });
    await refetch();
  };

  const handleUpdatePickupNote = async (assignmentId: string, pickupNote: string) => {
    await updateBoardingPointAssignment(assignmentId, { pickup_note: pickupNote });
    await refetch();
  };

  const handleCategoryChange = async (categoryId: string) => {
    if (!selectedTransport) return;
    await updateBusTransport(selectedTransport.id, {
      transfer_cost_category_id: categoryId || null,
    });
    await refetch();
  };

  const getSurchargeForBoardingPoint = (boardingPointId: string): number | null => {
    if (!selectedTransport?.transfer_cost_category_id) return null;

    const boardingPoint = boardingPoints.find((bp) => bp.id === boardingPointId);
    const surcharge = boardingPoint?.boarding_point_surcharges?.find(
      (s) => s.transfer_cost_category_id === selectedTransport.transfer_cost_category_id
    );

    return surcharge?.amount || null;
  };

  const TypeIcon = selectedTransport?.unterart === 'PKW' ? Car : Bus;
  const showSurcharges = directionTab === 'outbound';

  if (!selectedTransport) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('trips:boardingPoints.messages.noTransportSelected')}
          </h3>
          <p className="text-gray-400">
            {t('trips:boardingPoints.messages.noTransportSelectedHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TypeIcon className="w-6 h-6 text-teal-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedTransport.text}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedTransport.termin).toLocaleDateString()}
                  </span>
                  <span className="badge-info text-xs">
                    {selectedTransport.richtung === 'HIN' ? t('trips:transports.outbound') : t('trips:transports.return')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSurchargePanel(!showSurchargePanel)}
              className="btn-ghost flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t('trips:boardingPoints.surchargePanel.editSurcharges')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t('trips:boardingPoints.transferCategory')}
              </label>
              <select
                value={selectedTransport.transfer_cost_category_id || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">{t('trips:boardingPoints.noCategory')}</option>
                {transferCostCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-700">
            <button
              onClick={() => setDirectionTab('outbound')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                directionTab === 'outbound'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('boarding:outboundPoints')}
            </button>
            <button
              onClick={() => setDirectionTab('return')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                directionTab === 'return'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('boarding:returnPoints')}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {(['all', 'assigned', 'released'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filter === filterType
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t(`trips:boardingPoints.filters.${filterType === 'assigned' ? 'assignedOnly' : filterType === 'released' ? 'releasedOnly' : 'all'}`)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {selectedBoardingPoints.size > 0 && (
                <>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    {t('trips:boardingPoints.bulkActions.deselectAll')}
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    className="btn-ghost text-sm"
                  >
                    {t('trips:boardingPoints.bulkActions.assignSelected')} ({selectedBoardingPoints.size})
                  </button>
                  <button
                    onClick={handleBulkUnassign}
                    className="btn-ghost text-sm"
                  >
                    {t('trips:boardingPoints.bulkActions.unassignSelected')} ({selectedBoardingPoints.size})
                  </button>
                </>
              )}
              {selectedBoardingPoints.size === 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  {t('trips:boardingPoints.bulkActions.selectAll')}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-400 w-12"></th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-400 w-16">
                    {t('trips:boardingPoints.table.assigned')}
                  </th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                    {t('trips:boardingPoints.table.code')}
                  </th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                    {t('trips:boardingPoints.table.location')}
                  </th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                    {t('boarding:pickupTime')}
                  </th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                    {t('boarding:pickupNote')}
                  </th>
                  {showSurcharges && (
                    <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                      {t('boarding:surcharge')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredBoardingPoints.map((boardingPoint) => {
                  const isAssigned = assignedBoardingPointIds.has(boardingPoint.id);
                  const assignment = selectedTransport.boarding_point_assignments?.find(
                    (a) => a.boarding_point_id === boardingPoint.id && (!a.direction || a.direction === directionTab)
                  );
                  const surcharge = getSurchargeForBoardingPoint(boardingPoint.id);
                  const needsEnrichment = !boardingPoint.postal_code || !boardingPoint.street_address;

                  return (
                    <tr
                      key={boardingPoint.id}
                      className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={selectedBoardingPoints.has(boardingPoint.id)}
                          onChange={() => handleToggleSelection(boardingPoint.id)}
                          className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleToggleAssignment(boardingPoint.id)}
                          className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-white text-sm">{boardingPoint.code}</td>
                      <td className="py-2 px-2 text-white text-sm">
                        <div className="flex items-center gap-2">
                          <span>{formatBoardingPointLocation(boardingPoint)}</span>
                          {needsEnrichment && (
                            <span className="badge-warning text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {t('boarding:needsEnrichment')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        {isAssigned && assignment ? (
                          <input
                            type="time"
                            value={assignment.pickup_time || ''}
                            onChange={(e) => handleUpdatePickupTime(assignment.id, e.target.value)}
                            className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm w-28"
                            placeholder={t('boarding:noTimeSet')}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">{t('boarding:noTimeSet')}</span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {isAssigned && assignment ? (
                          <input
                            type="text"
                            value={assignment.pickup_note || ''}
                            onChange={(e) => handleUpdatePickupNote(assignment.id, e.target.value)}
                            className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm w-40"
                            placeholder={t('boarding:pickupNote')}
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      {showSurcharges && (
                        <td className="py-2 px-2">
                          {surcharge !== null ? (
                            <span className="text-teal-400 text-sm font-medium flex items-center gap-1">
                              +<DollarSign className="w-3 h-3" />{surcharge.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSurchargePanel && (
        <SurchargeManagementPanel
          boardingPoints={boardingPoints}
          transferCostCategories={transferCostCategories}
          onClose={() => setShowSurchargePanel(false)}
        />
      )}
    </div>
  );
}
