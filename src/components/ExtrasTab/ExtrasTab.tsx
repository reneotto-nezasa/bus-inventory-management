import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Plus } from 'lucide-react';
import type { Trip, TripExtra, EarlyBirdDiscount, ExtraType } from '../../types';
import { useExtras } from '../../hooks';
import { ExcursionsSection } from './ExcursionsSection';
import { DiningSection } from './DiningSection';
import { EarlyBirdSection } from './EarlyBirdSection';
import { ExtrasForm } from './ExtrasForm';
import { EarlyBirdDiscountForm } from './EarlyBirdDiscountForm';

interface ExtrasTabProps {
  trip: Trip;
}

type SubSection = 'excursions' | 'dining' | 'earlyBird';

export function ExtrasTab({ trip }: ExtrasTabProps) {
  const { t } = useTranslation('extras');
  const { fetchExtrasForDeparture, fetchEarlyBirdDiscounts } = useExtras();
  const [activeSection, setActiveSection] = useState<SubSection>('excursions');
  const [extras, setExtras] = useState<TripExtra[]>([]);
  const [discounts, setDiscounts] = useState<EarlyBirdDiscount[]>([]);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState<TripExtra | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<EarlyBirdDiscount | null>(null);
  const [defaultExtraType, setDefaultExtraType] = useState<ExtraType>('excursion');
  const [loading, setLoading] = useState(true);

  const selectedDeparture = trip.trip_departures?.[0];

  useEffect(() => {
    const loadData = async () => {
      if (!selectedDeparture) {
        setLoading(false);
        return;
      }

      try {
        const [extrasData, discountsData] = await Promise.all([
          fetchExtrasForDeparture(selectedDeparture.id),
          fetchEarlyBirdDiscounts(selectedDeparture.id),
        ]);
        setExtras(extrasData);
        setDiscounts(discountsData);
      } catch (error) {
        console.error('Failed to load extras data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDeparture, fetchExtrasForDeparture, fetchEarlyBirdDiscounts]);

  const handleAddExtra = (type: ExtraType) => {
    setDefaultExtraType(type);
    setEditingExtra(null);
    setShowExtraForm(true);
  };

  const handleEditExtra = (extra: TripExtra) => {
    setEditingExtra(extra);
    setShowExtraForm(true);
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setShowDiscountForm(true);
  };

  const handleEditDiscount = (discount: EarlyBirdDiscount) => {
    setEditingDiscount(discount);
    setShowDiscountForm(true);
  };

  const handleExtraFormClose = () => {
    setShowExtraForm(false);
    setEditingExtra(null);
  };

  const handleDiscountFormClose = () => {
    setShowDiscountForm(false);
    setEditingDiscount(null);
  };

  const handleExtraFormSuccess = async () => {
    setShowExtraForm(false);
    setEditingExtra(null);
    if (selectedDeparture) {
      const data = await fetchExtrasForDeparture(selectedDeparture.id);
      setExtras(data);
    }
  };

  const handleDiscountFormSuccess = async () => {
    setShowDiscountForm(false);
    setEditingDiscount(null);
    if (selectedDeparture) {
      const data = await fetchEarlyBirdDiscounts(selectedDeparture.id);
      setDiscounts(data);
    }
  };

  const handleDeleteExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDeleteDiscount = (id: string) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  if (!selectedDeparture) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-500 py-8">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No departure selected</p>
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'excursions' as SubSection, label: t('sections.excursions') },
    { key: 'dining' as SubSection, label: t('sections.dining') },
    { key: 'earlyBird' as SubSection, label: t('sections.earlyBird') },
  ];

  const totalExtras = extras.length;
  const priceRange =
    extras.length > 0
      ? {
          min: Math.min(...extras.map((e) => e.price)),
          max: Math.max(...extras.map((e) => e.price)),
        }
      : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-teal-600" />
            {t('title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {trip.text} - {new Date(selectedDeparture.termin).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeSection === 'earlyBird' ? (
            <button onClick={handleAddDiscount} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('actions.addDiscount')}
            </button>
          ) : (
            <button
              onClick={() =>
                handleAddExtra(activeSection === 'excursions' ? 'excursion' : 'dining')
              }
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('actions.addExtra')}
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex space-x-1">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`
                px-6 py-3 font-medium text-sm border-b-2 transition-colors
                ${
                  activeSection === section.key
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }
              `}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-8">
          <p className="text-sm">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSection === 'excursions' && (
            <ExcursionsSection
              extras={extras}
              onEdit={handleEditExtra}
              onDelete={handleDeleteExtra}
            />
          )}
          {activeSection === 'dining' && (
            <DiningSection
              extras={extras}
              onEdit={handleEditExtra}
              onDelete={handleDeleteExtra}
            />
          )}
          {activeSection === 'earlyBird' && (
            <EarlyBirdSection
              discounts={discounts}
              onEdit={handleEditDiscount}
              onDelete={handleDeleteDiscount}
            />
          )}
        </div>
      )}

      {activeSection !== 'earlyBird' && totalExtras > 0 && (
        <div className="card bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('summary.total')} {t('summary.extras')}</p>
              <p className="text-2xl font-bold text-slate-900">{totalExtras}</p>
            </div>
            {priceRange && (
              <div className="text-right">
                <p className="text-sm text-slate-500">{t('summary.priceRange')}</p>
                <p className="text-lg font-semibold text-teal-600">
                  €{priceRange.min.toFixed(2)} - €{priceRange.max.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'earlyBird' && discounts.length > 0 && (
        <div className="card bg-slate-50 border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('summary.total')} {t('summary.discounts')}</p>
              <p className="text-2xl font-bold text-slate-900">{discounts.length}</p>
            </div>
          </div>
        </div>
      )}

      {showExtraForm && selectedDeparture && (
        <ExtrasForm
          tripDepartureId={selectedDeparture.id}
          extra={editingExtra}
          defaultType={defaultExtraType}
          onClose={handleExtraFormClose}
          onSuccess={handleExtraFormSuccess}
        />
      )}

      {showDiscountForm && selectedDeparture && (
        <EarlyBirdDiscountForm
          tripDepartureId={selectedDeparture.id}
          discount={editingDiscount}
          onClose={handleDiscountFormClose}
          onSuccess={handleDiscountFormSuccess}
        />
      )}
    </div>
  );
}
