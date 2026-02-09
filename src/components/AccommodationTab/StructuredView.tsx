import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Edit, Trash2, Users, Utensils } from 'lucide-react';
import type { Accommodation } from '../../types';
import { useAccommodations } from '../../hooks';

interface StructuredViewProps {
  accommodations: Accommodation[];
  onEdit: (accommodation: Accommodation) => void;
  onDelete: (id: string) => void;
}

export function StructuredView({ accommodations, onEdit, onDelete }: StructuredViewProps) {
  const { t } = useTranslation('accommodations');
  const { deleteAccommodation } = useAccommodations();
  const [expandedDecks, setExpandedDecks] = useState<Set<string>>(new Set(['all']));

  const accommodationsByDeck = accommodations.reduce((acc, accommodation) => {
    const deck = accommodation.deck_name || 'Andere';
    if (!acc[deck]) {
      acc[deck] = [];
    }
    acc[deck].push(accommodation);
    return acc;
  }, {} as Record<string, Accommodation[]>);

  const toggleDeck = (deck: string) => {
    const newExpanded = new Set(expandedDecks);
    if (newExpanded.has(deck)) {
      newExpanded.delete(deck);
    } else {
      newExpanded.add(deck);
    }
    setExpandedDecks(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteAccommodation(id);
        onDelete(id);
      } catch (error) {
        console.error('Failed to delete accommodation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Frei':
        return 'bg-green-500';
      case 'Anfrage':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(accommodationsByDeck)
        .sort(([deckA], [deckB]) => {
          const deckOrder = ['Smaragddeck', 'Rubindeck', 'Diamantdeck', 'Hauptdeck', 'Oberdeck', 'Sonnendeck', 'Andere'];
          return deckOrder.indexOf(deckA) - deckOrder.indexOf(deckB);
        })
        .map(([deck, deckAccommodations]) => {
          const isExpanded = expandedDecks.has(deck) || expandedDecks.has('all');
          const totalAccommodations = deckAccommodations.length;
          const priceRange = deckAccommodations.length > 0
            ? {
                min: Math.min(...deckAccommodations.map((a) => a.price)),
                max: Math.max(...deckAccommodations.map((a) => a.price)),
              }
            : null;

          return (
            <div key={deck} className="card">
              <button
                onClick={() => toggleDeck(deck)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">
                      {deck === 'Andere' ? deck : t(`deck.${deck}`, deck)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {totalAccommodations} {t('summary.accommodations')}
                      {priceRange && (
                        <span className="ml-2">
                          • {t('summary.priceRange')}: €{priceRange.min.toFixed(2)} - €{priceRange.max.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deckAccommodations.map((accommodation) => (
                    <div
                      key={accommodation.id}
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{accommodation.name}</h4>
                          {accommodation.code && (
                            <p className="text-xs text-gray-400 mt-1">Code: {accommodation.code}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(accommodation)}
                            className="p-1.5 hover:bg-gray-500 rounded text-gray-300 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(accommodation.id)}
                            className="p-1.5 hover:bg-red-500 rounded text-gray-300 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {accommodation.room_type && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('fields.roomType')}:</span>
                            <span className="text-white">{t(`roomTypes.${accommodation.room_type}`)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{t('fields.price')}:</span>
                          <span className="text-white font-semibold">
                            €{accommodation.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {t('fields.occupancy')}:
                          </span>
                          <span className="text-white">
                            {accommodation.belegung_min}-{accommodation.belegung_max}
                          </span>
                        </div>

                        {accommodation.meal_plan && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Utensils className="w-3 h-3" />
                              {t('fields.mealPlan')}:
                            </span>
                            <span className="text-white">{t(`mealPlans.${accommodation.meal_plan}`)}</span>
                          </div>
                        )}

                        {accommodation.nights && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('fields.nights')}:</span>
                            <span className="text-white">{accommodation.nights}</span>
                          </div>
                        )}

                        {accommodation.amenities && (
                          <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
                            {accommodation.amenities}
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ${getStatusColor(
                              accommodation.status
                            )}`}
                          >
                            {t(`statuses.${accommodation.status}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
