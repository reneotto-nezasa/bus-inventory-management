import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2 } from 'lucide-react';
import type {
  Accommodation,
  AccommodationFormData,
  CompositeHotelFormData,
  RoomType,
  MealPlan,
  AccommodationStatus,
} from '../../types';
import { ROOM_TYPES, MEAL_PLANS, DECK_NAMES } from '../../types';
import { useAccommodations } from '../../hooks';

interface AccommodationFormProps {
  tripDepartureId: string;
  accommodation: Accommodation | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AccommodationForm({
  tripDepartureId,
  accommodation,
  onClose,
  onSuccess,
}: AccommodationFormProps) {
  const { t } = useTranslation('accommodations');
  const { createAccommodation, updateAccommodation } = useAccommodations();
  const [formData, setFormData] = useState<AccommodationFormData>({
    name: '',
    code: '',
    room_type: '',
    price: 0,
    currency: 'EUR',
    belegung_min: 1,
    belegung_max: 2,
    meal_plan: '',
    checkin_date: '',
    checkout_date: '',
    nights: null,
    status: 'Frei',
    is_composite: false,
    deck_name: '',
    amenities: '',
    description: '',
    sort_order: 0,
    composite_hotels: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accommodation) {
      setFormData({
        name: accommodation.name,
        code: accommodation.code || '',
        room_type: (accommodation.room_type || '') as RoomType | '',
        price: accommodation.price,
        currency: accommodation.currency,
        belegung_min: accommodation.belegung_min,
        belegung_max: accommodation.belegung_max,
        meal_plan: (accommodation.meal_plan || '') as MealPlan | '',
        checkin_date: accommodation.checkin_date || '',
        checkout_date: accommodation.checkout_date || '',
        nights: accommodation.nights,
        status: accommodation.status,
        is_composite: accommodation.is_composite,
        deck_name: accommodation.deck_name || '',
        amenities: accommodation.amenities || '',
        description: accommodation.description || '',
        sort_order: accommodation.sort_order,
        composite_hotels:
          accommodation.composite_hotels?.map((h) => ({
            hotel_partner_id: h.hotel_partner_id,
            hotel_name: h.hotel_name || '',
            checkin_date: h.checkin_date || '',
            checkout_date: h.checkout_date || '',
            nights: h.nights,
            meal_plan: (h.meal_plan || '') as MealPlan | '',
            sort_order: h.sort_order,
          })) || [],
      });
    }
  }, [accommodation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (accommodation) {
        await updateAccommodation(accommodation.id, formData);
      } else {
        await createAccommodation(tripDepartureId, formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save accommodation:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHotelComponent = () => {
    setFormData({
      ...formData,
      composite_hotels: [
        ...formData.composite_hotels,
        {
          hotel_partner_id: '',
          hotel_name: '',
          checkin_date: '',
          checkout_date: '',
          nights: null,
          meal_plan: '',
          sort_order: formData.composite_hotels.length,
        },
      ],
    });
  };

  const removeHotelComponent = (index: number) => {
    setFormData({
      ...formData,
      composite_hotels: formData.composite_hotels.filter((_, i) => i !== index),
    });
  };

  const updateHotelComponent = (
    index: number,
    updates: Partial<CompositeHotelFormData>
  ) => {
    setFormData({
      ...formData,
      composite_hotels: formData.composite_hotels.map((hotel, i) =>
        i === index ? { ...hotel, ...updates } : hotel
      ),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {accommodation ? t('form.editTitle') : t('form.createTitle')}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.code')}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.roomType')}
              </label>
              <select
                value={formData.room_type}
                onChange={(e) =>
                  setFormData({ ...formData, room_type: e.target.value as RoomType | '' })
                }
                className="select w-full"
              >
                <option value="">-</option>
                {ROOM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(`roomTypes.${type.value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.deckName')}
              </label>
              <select
                value={formData.deck_name}
                onChange={(e) => setFormData({ ...formData, deck_name: e.target.value })}
                className="select w-full"
              >
                <option value="">-</option>
                {DECK_NAMES.map((deck) => (
                  <option key={deck} value={deck}>
                    {t(`deck.${deck}`, deck)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.price')} * (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                className="input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.occupancy')} (Min)
              </label>
              <input
                type="number"
                value={formData.belegung_min}
                onChange={(e) =>
                  setFormData({ ...formData, belegung_min: parseInt(e.target.value) || 1 })
                }
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.occupancy')} (Max)
              </label>
              <input
                type="number"
                value={formData.belegung_max}
                onChange={(e) =>
                  setFormData({ ...formData, belegung_max: parseInt(e.target.value) || 2 })
                }
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.mealPlan')}
              </label>
              <select
                value={formData.meal_plan}
                onChange={(e) =>
                  setFormData({ ...formData, meal_plan: e.target.value as MealPlan | '' })
                }
                className="select w-full"
              >
                <option value="">-</option>
                {MEAL_PLANS.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {t(`mealPlans.${plan.value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as AccommodationStatus })
                }
                className="select w-full"
              >
                <option value="Frei">{t('statuses.Frei')}</option>
                <option value="Anfrage">{t('statuses.Anfrage')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.checkinDate')}
              </label>
              <input
                type="date"
                value={formData.checkin_date}
                onChange={(e) => setFormData({ ...formData, checkin_date: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.checkoutDate')}
              </label>
              <input
                type="date"
                value={formData.checkout_date}
                onChange={(e) => setFormData({ ...formData, checkout_date: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1 text-sm">
                {t('fields.nights')}
              </label>
              <input
                type="number"
                value={formData.nights || ''}
                onChange={(e) =>
                  setFormData({ ...formData, nights: parseInt(e.target.value) || null })
                }
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 text-sm">
              {t('fields.amenities')}
            </label>
            <input
              type="text"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              className="input w-full"
              placeholder="z.B. mit frz. Balkon"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1 text-sm">
              {t('fields.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="flex items-center gap-2 text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_composite}
                onChange={(e) =>
                  setFormData({ ...formData, is_composite: e.target.checked })
                }
                className="w-4 h-4 text-teal-500 bg-white border-slate-300 rounded"
              />
              <span className="text-sm">{t('form.compositeAccommodation')}</span>
            </label>
          </div>

          {formData.is_composite && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-900 font-semibold">{t('form.hotelComponents')}</h3>
                <button
                  type="button"
                  onClick={addHotelComponent}
                  className="btn-ghost text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('form.addHotel')}
                </button>
              </div>

              {formData.composite_hotels.map((hotel, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Hotel {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHotelComponent(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1 text-xs">
                        {t('composite.hotelName')}
                      </label>
                      <input
                        type="text"
                        value={hotel.hotel_name}
                        onChange={(e) =>
                          updateHotelComponent(index, { hotel_name: e.target.value })
                        }
                        className="input w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 text-xs">
                        {t('fields.mealPlan')}
                      </label>
                      <select
                        value={hotel.meal_plan}
                        onChange={(e) =>
                          updateHotelComponent(index, {
                            meal_plan: e.target.value as MealPlan | '',
                          })
                        }
                        className="select w-full text-sm"
                      >
                        <option value="">-</option>
                        {MEAL_PLANS.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {t(`mealPlans.${plan.value}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 text-xs">
                        {t('fields.checkinDate')}
                      </label>
                      <input
                        type="date"
                        value={hotel.checkin_date}
                        onChange={(e) =>
                          updateHotelComponent(index, { checkin_date: e.target.value })
                        }
                        className="input w-full text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 text-xs">
                        {t('fields.checkoutDate')}
                      </label>
                      <input
                        type="date"
                        value={hotel.checkout_date}
                        onChange={(e) =>
                          updateHotelComponent(index, { checkout_date: e.target.value })
                        }
                        className="input w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            {t('actions.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : t('actions.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
