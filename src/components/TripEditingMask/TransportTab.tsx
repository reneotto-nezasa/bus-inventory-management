import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bus, Car, Plus, MapPin, Calendar, Armchair, FileText, Users, Loader2 } from 'lucide-react';
import type { Trip, BusTransport } from '../../types';
import { useTrips } from '../../hooks';
import { useSeatMaps } from '../../hooks';
import { SeatReassignment } from '../SeatReassignment';
import { generateSeatPlanPDF } from '../../utils/generateSeatPlanPDF';
import { generateBoardingListPDF } from '../../utils/generateBoardingListPDF';

interface TransportTabProps {
  trip: Trip;
  onSelectTransport: (transportId: string | null) => void;
}

export function TransportTab({ trip, onSelectTransport }: TransportTabProps) {
  const { t } = useTranslation('trips');
  const { createBusTransport } = useTrips();
  const { seatMaps } = useSeatMaps();
  const [reassignmentTransport, setReassignmentTransport] = useState<BusTransport | null>(null);

  const transports = trip.bus_transports || [];
  const rootOutboundTransports = transports.filter((t) => t.richtung === 'HIN' && !t.parent_transport_id);
  const returnTransports = transports.filter((t) => t.richtung === 'RUECK');

  const getContinuationLegs = (parentId: string) => {
    return transports.filter((t) => t.parent_transport_id === parentId);
  };

  const handleAddTransport = async (direction: 'HIN' | 'RUECK') => {
    await createBusTransport(trip.id, {
      unterart: 'BUS',
      richtung: direction,
      termin: trip.termin,
      bis: trip.bis,
      status: 'Offen',
      text: direction === 'HIN' ? 'Hinfahrt' : 'Rückfahrt',
      preis: 0,
      gruppe: 'Busreise',
    });
  };

  const handleAddContinuationLeg = async (parentTransportId: string) => {
    await createBusTransport(trip.id, {
      unterart: 'BUS',
      richtung: 'HIN',
      termin: trip.termin,
      bis: trip.bis,
      status: 'Offen',
      text: 'Weiterfahrt',
      preis: 0,
      gruppe: 'Busreise',
      parent_transport_id: parentTransportId,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-teal-400" />
            {t('transports.outbound')}
          </h3>
          <button
            onClick={() => handleAddTransport('HIN')}
            className="btn-ghost text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('transports.addTransport')}
          </button>
        </div>

        <div className="space-y-3">
          {rootOutboundTransports.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('transports.empty')}</p>
          ) : (
            rootOutboundTransports.map((transport) => {
              const continuationLegs = getContinuationLegs(transport.id);
              return (
                <div key={transport.id} className="space-y-2">
                  <TransportCard
                    transport={transport}
                    seatMaps={seatMaps}
                    onSelectTransport={onSelectTransport}
                    onOpenReassignment={setReassignmentTransport}
                    onAddContinuationLeg={transport.unterart === 'BUS' ? handleAddContinuationLeg : undefined}
                  />
                  {continuationLegs.map((leg) => (
                    <div key={leg.id} className="ml-8 pl-4 border-l-2 border-teal-500">
                      <TransportCard
                        transport={leg}
                        seatMaps={seatMaps}
                        onSelectTransport={onSelectTransport}
                        onOpenReassignment={setReassignmentTransport}
                        isContinuationLeg
                      />
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Bus className="w-5 h-5 text-teal-400" />
            {t('transports.return')}
          </h3>
          <button
            onClick={() => handleAddTransport('RUECK')}
            className="btn-ghost text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('transports.addTransport')}
          </button>
        </div>

        <div className="space-y-3">
          {returnTransports.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('transports.empty')}</p>
          ) : (
            returnTransports.map((transport) => (
              <TransportCard
                key={transport.id}
                transport={transport}
                seatMaps={seatMaps}
                onSelectTransport={onSelectTransport}
                onOpenReassignment={setReassignmentTransport}
              />
            ))
          )}
        </div>
      </div>

      {reassignmentTransport && (
        <SeatReassignment
          transport={reassignmentTransport}
          onClose={() => setReassignmentTransport(null)}
        />
      )}
    </div>
  );
}

interface TransportCardProps {
  transport: BusTransport;
  seatMaps: any[];
  onSelectTransport: (transportId: string | null) => void;
  onOpenReassignment: (transport: BusTransport) => void;
  onAddContinuationLeg?: (parentId: string) => void;
  isContinuationLeg?: boolean;
}

function TransportCard({ transport, seatMaps, onSelectTransport, onOpenReassignment, onAddContinuationLeg, isContinuationLeg }: TransportCardProps) {
  const { t } = useTranslation('trips');
  const { updateBusTransport, linkSeatMapToTransport } = useTrips();
  const [editMode, setEditMode] = useState(false);
  const [generatingSeatPlan, setGeneratingSeatPlan] = useState(false);
  const [generatingBoardingList, setGeneratingBoardingList] = useState(false);
  const [formData, setFormData] = useState({
    text: transport.text,
    unterart: transport.unterart,
    termin: transport.termin,
    bis: transport.bis,
    status: transport.status,
    preis: transport.preis,
    fruehbucher: transport.fruehbucher || false,
    altersermaessigung: transport.altersermaessigung || false,
    hinweis_stamm: transport.hinweis_stamm || '',
    seat_plan_note: transport.seat_plan_note || '',
  });
  const [priceError, setPriceError] = useState<string>('');

  const validatePrice = (unterart: 'BUS' | 'PKW', preis: number): boolean => {
    if (unterart === 'PKW' && preis > 0) {
      setPriceError(t('transports.pkwPriceError'));
      return false;
    }
    if (unterart === 'BUS' && preis < 0) {
      setPriceError(t('transports.busPriceError'));
      return false;
    }
    setPriceError('');
    return true;
  };

  const handlePriceChange = (value: number) => {
    setFormData({ ...formData, preis: value });
    validatePrice(formData.unterart, value);
  };

  const handleSave = async () => {
    if (!validatePrice(formData.unterart, formData.preis)) {
      return;
    }
    await updateBusTransport(transport.id, formData);
    setEditMode(false);
  };

  const handleGenerateSeatPlan = async () => {
    try {
      setGeneratingSeatPlan(true);
      await generateSeatPlanPDF(transport.id);
    } catch (error) {
      console.error('Failed to generate seat plan PDF:', error);
      alert('Failed to generate seat plan PDF. Please try again.');
    } finally {
      setGeneratingSeatPlan(false);
    }
  };

  const handleGenerateBoardingList = async () => {
    try {
      setGeneratingBoardingList(true);
      await generateBoardingListPDF(transport.id);
    } catch (error) {
      console.error('Failed to generate boarding list PDF:', error);
      alert('Failed to generate boarding list PDF. Please try again.');
    } finally {
      setGeneratingBoardingList(false);
    }
  };

  const TypeIcon = transport.unterart === 'PKW' ? Car : Bus;
  const boardingPointsCount = transport.boarding_point_assignments?.length || 0;

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <TypeIcon className="w-6 h-6 text-teal-400" />
          <div>
            {editMode ? (
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
              />
            ) : (
              <h4 className="font-semibold text-white">{transport.text}</h4>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-info text-xs">{transport.richtung === 'HIN' ? t('transports.outbound') : t('transports.return')}</span>
              <span className="badge-neutral text-xs">
                {transport.unterart === 'PKW' ? t('transports.car') : t('transports.bus')}
              </span>
              {isContinuationLeg && (
                <span className="px-2 py-0.5 bg-teal-900/30 border border-teal-700 rounded text-teal-300 text-xs">
                  {t('transports.continuationLeg')}
                </span>
              )}
              <span className="badge-neutral text-xs">{transport.status}</span>
              {transport.fruehbucher && (
                <span className="px-2 py-0.5 bg-green-900/30 border border-green-700 rounded text-green-300 text-xs">
                  {t('transports.earlyBird')}
                </span>
              )}
              {transport.altersermaessigung && (
                <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 rounded text-blue-300 text-xs">
                  {t('transports.ageDiscount')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="text-gray-400 hover:text-white text-sm"
            >
              {t('actions.edit')}
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="text-teal-400 hover:text-teal-300 text-sm"
              >
                {t('actions.save')}
              </button>
            </>
          )}
        </div>
      </div>

      {editMode && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {t('transports.type')}
            </label>
            <select
              value={formData.unterart}
              onChange={(e) => {
                const newUnterart = e.target.value as 'BUS' | 'PKW';
                setFormData({ ...formData, unterart: newUnterart });
                validatePrice(newUnterart, formData.preis);
              }}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            >
              <option value="BUS">{t('transports.bus')}</option>
              <option value="PKW">{t('transports.car')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {t('transports.date')}
            </label>
            <input
              type="date"
              value={formData.termin}
              onChange={(e) => setFormData({ ...formData, termin: e.target.value })}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {t('transports.price')}
              {formData.unterart === 'PKW' && (
                <span className="text-xs text-teal-400 ml-1">({t('transports.pkwPriceHint')})</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
              <input
                type="number"
                step="0.01"
                value={formData.preis}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className={`w-full pl-6 pr-2 py-1 bg-gray-600 border rounded text-white text-sm ${
                  priceError ? 'border-red-500' : 'border-gray-500'
                } ${formData.unterart === 'PKW' && formData.preis < 0 ? 'text-red-400' : ''}`}
              />
            </div>
            {priceError && (
              <p className="text-red-400 text-xs mt-1">{priceError}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {t('tripData.statusOutbound')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            >
              <option value="Frei">{t('status.frei')}</option>
              <option value="Offen">{t('status.offen')}</option>
              <option value="Geschlossen">{t('status.geschlossen')}</option>
              <option value="Bestätigt">{t('status.bestaetigt')}</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-2">
              {t('transports.discounts')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.fruehbucher}
                  onChange={(e) => setFormData({ ...formData, fruehbucher: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-teal-500 focus:ring-2 focus:ring-teal-500"
                />
                <span>{t('transports.earlyBird')}</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.altersermaessigung}
                  onChange={(e) => setFormData({ ...formData, altersermaessigung: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-teal-500 focus:ring-2 focus:ring-teal-500"
                />
                <span>{t('transports.ageDiscount')}</span>
              </label>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">
              {t('transports.internalNotes')}
            </label>
            <textarea
              value={formData.hinweis_stamm}
              onChange={(e) => setFormData({ ...formData, hinweis_stamm: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Calendar className="w-4 h-4" />
            {t('transports.date')}
          </div>
          <p className="text-white">
            {new Date(transport.termin).toLocaleDateString()} - {new Date(transport.bis).toLocaleDateString()}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <DollarSign className="w-4 h-4" />
            {t('transports.price')}
          </div>
          <p className={`font-semibold ${
            transport.unterart === 'PKW' && transport.preis < 0
              ? 'text-red-400'
              : transport.preis < 0
                ? 'text-red-400'
                : 'text-white'
          }`}>
            {transport.preis < 0 ? '-' : ''}€{Math.abs(transport.preis).toFixed(2)}
            {transport.unterart === 'PKW' && transport.preis < 0 && (
              <span className="text-xs text-teal-400 ml-2">({t('transports.discount')})</span>
            )}
          </p>
        </div>

        {transport.unterart !== 'PKW' && (
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <MapPin className="w-4 h-4" />
              {t('transports.boardingPoints')}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-white">
                {boardingPointsCount} {t('transports.assigned')}
              </p>
              <button
                onClick={() => onSelectTransport(transport.id)}
                className="text-teal-400 hover:text-teal-300 text-xs"
              >
                {t('actions.edit')}
              </button>
            </div>
          </div>
        )}

        {transport.unterart !== 'PKW' && (
          <div className="col-span-2">
            <label className="block text-gray-400 mb-1">
              {t('transports.seatMap')}
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={transport.seat_map_id || ''}
                onChange={(e) => linkSeatMapToTransport(transport.id, e.target.value || null)}
                className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
              >
                <option value="">{t('transports.noSeatMap')}</option>
                {seatMaps.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.bezeichnung}
                  </option>
                ))}
              </select>
              {transport.seat_map_id ? (
                <button
                  onClick={() => onOpenReassignment(transport)}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <Armchair className="w-4 h-4" />
                  Umbesetzung
                </button>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-600 text-gray-400 rounded text-sm flex items-center gap-2 whitespace-nowrap cursor-not-allowed"
                  title={t('seatmaps:reassignment.noSeatMap')}
                >
                  <Armchair className="w-4 h-4" />
                  Umbesetzung
                </button>
              )}
            </div>
            {transport.seat_map_id && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-600 rounded text-xs text-gray-300">
                  <Armchair className="w-3 h-3 text-teal-400" />
                  <span>
                    {seatMaps.find((sm) => sm.id === transport.seat_map_id)?.bezeichnung}
                  </span>
                </div>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.seat_plan_note}
                    onChange={(e) => setFormData({ ...formData, seat_plan_note: e.target.value })}
                    placeholder={t('seatmaps:seat.planNote')}
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                  />
                ) : (
                  transport.seat_plan_note && (
                    <p className="text-xs text-gray-400 italic">{transport.seat_plan_note}</p>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {(transport.seat_map_id || boardingPointsCount > 0 || onAddContinuationLeg) && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="flex items-center gap-3">
            {transport.seat_map_id && (
              <button
                onClick={handleGenerateSeatPlan}
                disabled={generatingSeatPlan}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingSeatPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('transports.generatingPDF')}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {t('transports.printSeatPlan')}
                  </>
                )}
              </button>
            )}

            {boardingPointsCount > 0 && (
              <button
                onClick={handleGenerateBoardingList}
                disabled={generatingBoardingList}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingBoardingList ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('transports.generatingPDF')}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    {t('transports.printBoardingList')}
                  </>
                )}
              </button>
            )}

            {onAddContinuationLeg && !isContinuationLeg && (
              <button
                onClick={() => onAddContinuationLeg(transport.id)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition-colors ml-auto"
              >
                <Plus className="w-4 h-4" />
                {t('transports.addContinuationLeg')}
              </button>
            )}
          </div>
        </div>
      )}

      {transport.hinweis_stamm && !editMode && (
        <div className="mt-3 p-2 bg-gray-600 rounded">
          <p className="text-xs text-gray-300">{transport.hinweis_stamm}</p>
        </div>
      )}
    </div>
  );
}
