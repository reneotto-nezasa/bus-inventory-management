import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Plus, Trash2, Save, Mail, Phone, MapPin, UserCircle } from 'lucide-react';
import type { TourGuideAssignment, BusTransport, Seat } from '../../types';
import { useTourGuides, useSeatMaps } from '../../hooks';

interface TourGuideManagementSectionProps {
  tripDepartureId: string;
  busTransports: BusTransport[];
  onUpdate?: () => void;
}

export function TourGuideManagementSection({
  tripDepartureId,
  busTransports,
  onUpdate,
}: TourGuideManagementSectionProps) {
  const { t } = useTranslation();
  const {
    fetchTourGuides,
    createTourGuide,
    updateTourGuide,
    deleteTourGuide,
    assignSeat,
  } = useTourGuides();

  const { seats, loadSeatMap } = useSeatMaps();
  const [tourGuides, setTourGuides] = useState<TourGuideAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTourGuides();
  }, [tripDepartureId]);

  useEffect(() => {
    const transportWithSeatMap = busTransports.find((t) => t.seat_map_id);
    if (transportWithSeatMap?.seat_map_id) {
      loadSeatMap(transportWithSeatMap.seat_map_id);
    }
  }, [busTransports]);

  const loadTourGuides = async () => {
    try {
      const guides = await fetchTourGuides(tripDepartureId);
      setTourGuides(guides);
    } catch (error) {
      console.error('Failed to load tour guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTourGuide = async () => {
    try {
      await createTourGuide(tripDepartureId, {
        name: 'New Guide',
        first_name: '',
      });
      await loadTourGuides();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to create tour guide:', error);
    }
  };

  const handleDeleteTourGuide = async (guideId: string) => {
    if (!window.confirm(t('tourGuide.confirmDelete'))) return;

    try {
      await deleteTourGuide(guideId);
      await loadTourGuides();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete tour guide:', error);
    }
  };

  const handleUpdateTourGuide = async (
    guideId: string,
    updates: Partial<TourGuideAssignment>
  ) => {
    try {
      await updateTourGuide(guideId, updates);
      await loadTourGuides();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update tour guide:', error);
    }
  };

  const handleAssignSeat = async (guideId: string, seatId: string | null) => {
    try {
      await assignSeat(guideId, seatId);
      await loadTourGuides();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to assign seat:', error);
    }
  };

  const availableSeats = seats.filter(
    (s) =>
      (s.seat_type === 'sitzplatz' ||
        s.seat_type === 'sitzplatz_fenster' ||
        s.seat_type === 'sitzplatz_gang' ||
        s.seat_type === 'sitzplatz_rueckwaerts') &&
      !s.is_blocked
  );

  const hasSeatPlan = busTransports.some((t) => t.seat_map_id);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          {t('tourGuide.title')}
        </h3>
        <button
          onClick={handleAddTourGuide}
          className="btn btn-secondary text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('tourGuide.add')}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-slate-500 text-sm">Loading...</p>
        ) : tourGuides.length === 0 ? (
          <p className="text-slate-500 text-sm">{t('tourGuide.noGuides')}</p>
        ) : (
          tourGuides.map((guide) => (
            <TourGuideCard
              key={guide.id}
              guide={guide}
              availableSeats={availableSeats}
              hasSeatPlan={hasSeatPlan}
              onUpdate={handleUpdateTourGuide}
              onDelete={handleDeleteTourGuide}
              onAssignSeat={handleAssignSeat}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TourGuideCardProps {
  guide: TourGuideAssignment;
  availableSeats: Seat[];
  hasSeatPlan: boolean;
  onUpdate: (id: string, updates: Partial<TourGuideAssignment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAssignSeat: (guideId: string, seatId: string | null) => Promise<void>;
}

function TourGuideCard({
  guide,
  availableSeats,
  hasSeatPlan,
  onUpdate,
  onDelete,
  onAssignSeat,
}: TourGuideCardProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: guide.name || '',
    first_name: guide.first_name || '',
    gender: guide.gender || 'male',
    code: guide.code || '',
    phone: guide.phone || '',
    email: guide.email || '',
  });

  const handleSave = async () => {
    await onUpdate(guide.id, formData);
    setEditMode(false);
  };

  const getGenderIcon = (gender: string | null) => {
    if (gender === 'female') return '\u2640';
    if (gender === 'male') return '\u2642';
    return '\u25CB';
  };

  const assignedSeat = availableSeats.find((s) => s.id === guide.assigned_seat_id);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircle className="w-6 h-6 text-teal-600" />
          {!editMode ? (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-medium">
                  {guide.first_name} {guide.name}
                </span>
                {guide.gender && (
                  <span className="text-slate-400 text-sm">
                    {getGenderIcon(guide.gender)}
                  </span>
                )}
                {guide.code && (
                  <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 rounded text-teal-700 text-xs">
                    {guide.code}
                  </span>
                )}
              </div>
              {(guide.phone || guide.email) && (
                <div className="flex items-center gap-3 mt-1">
                  {guide.phone && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Phone className="w-3 h-3" />
                      <span>{guide.phone}</span>
                    </div>
                  )}
                  {guide.email && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Mail className="w-3 h-3" />
                      <span>{guide.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-900 font-medium">
              {t('actions.edit')} {t('tourGuide.title')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                {t('actions.edit')}
              </button>
              <button
                onClick={() => onDelete(guide.id)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                {t('actions.save')}
              </button>
            </>
          )}
        </div>
      </div>

      {editMode && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('tourGuide.firstName')}
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('tourGuide.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('tourGuide.gender')}
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  gender: e.target.value as 'male' | 'female' | 'other',
                })
              }
              className="select text-sm w-full"
            >
              <option value="male">{t('tourGuide.male')}</option>
              <option value="female">{t('tourGuide.female')}</option>
              <option value="other">{t('tourGuide.other')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('tourGuide.code')}
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('tourGuide.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('tourGuide.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input text-sm"
            />
          </div>
        </div>
      )}

      {!editMode && hasSeatPlan && (
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4" />
              <span>{t('tourGuide.assignSeat')}</span>
            </div>
            <select
              value={guide.assigned_seat_id || ''}
              onChange={(e) => onAssignSeat(guide.id, e.target.value || null)}
              className="select text-sm py-1"
            >
              <option value="">{t('tourGuide.noSeat')}</option>
              {availableSeats.map((seat) => (
                <option key={seat.id} value={seat.id}>
                  {seat.label}
                </option>
              ))}
            </select>
          </div>
          {assignedSeat && (
            <p className="text-xs text-teal-600 mt-1">
              {t('tourGuide.seatAssigned', { seat: assignedSeat.label })}
            </p>
          )}
        </div>
      )}

      {!editMode && !hasSeatPlan && (
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-200">
          {t('tourGuide.noSeatPlan')}
        </p>
      )}
    </div>
  );
}
