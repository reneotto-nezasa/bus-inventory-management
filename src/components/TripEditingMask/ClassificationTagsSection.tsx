import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tags, Plus, X } from 'lucide-react';
import type { TripTag } from '../../types';
import { supabase } from '../../lib/supabase';

interface ClassificationTagsSectionProps {
  tripId: string;
  tags: TripTag[];
  onTagsUpdate: () => void;
}

const TAG_DIMENSIONS = {
  trip_type: ['Bus', 'Schiff_Fluss', 'Schiff_Meer', 'Flugreise'],
  category: ['Premium', 'Stadt', 'Kunst/Kultur', 'Natur', 'Aktiv'],
  region: ['Inland', 'EU-Ausland', 'Fernreise'],
  media_partner: ['NOZ', 'WA', 'BadZ'],
  responsible_pm: ['Ronja Buecker', 'Sabrina Wiedl'],
  risk: ['Low', 'Medium', 'High'],
};

export function ClassificationTagsSection({ tripId, tags, onTagsUpdate }: ClassificationTagsSectionProps) {
  const { t } = useTranslation('trips');
  const [addingDimension, setAddingDimension] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState('');

  const getTagsForDimension = (dimension: string) => {
    return tags.filter(tag => tag.dimension === dimension);
  };

  const addTag = async (dimension: string, value: string) => {
    try {
      await supabase
        .from('trip_tags')
        .insert({
          trip_id: tripId,
          dimension,
          value,
        });
      onTagsUpdate();
      setAddingDimension(null);
      setCustomValue('');
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      await supabase
        .from('trip_tags')
        .delete()
        .eq('id', tagId);
      onTagsUpdate();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Tags className="w-5 h-5 text-teal-600" />
        <h3 className="text-base font-semibold text-slate-900">
          {t('tripData.classificationTags')}
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(TAG_DIMENSIONS).map(([dimension, predefinedValues]) => (
          <div key={dimension}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-600">
                {t(`tripData.tagDimension.${dimension}`)}
              </label>
              <button
                onClick={() => setAddingDimension(dimension)}
                className="text-teal-600 hover:text-teal-700 text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {t('actions.add')}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {getTagsForDimension(dimension).map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-teal-700 text-sm"
                >
                  {tag.value}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="hover:text-teal-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {addingDimension === dimension && (
                <div className="flex items-center gap-2">
                  {dimension === 'media_partner' || dimension === 'responsible_pm' ? (
                    <>
                      <select
                        className="select text-sm py-1"
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setCustomValue('');
                          } else if (e.target.value) {
                            addTag(dimension, e.target.value);
                          }
                        }}
                      >
                        <option value="">{t('actions.select')}</option>
                        {predefinedValues.map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                        <option value="custom">{t('tripData.customValue')}</option>
                      </select>
                      <input
                        type="text"
                        placeholder={t('tripData.enterCustomValue')}
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="input text-sm py-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customValue.trim()) {
                            addTag(dimension, customValue.trim());
                          }
                        }}
                      />
                    </>
                  ) : (
                    <select
                      className="select text-sm py-1"
                      onChange={(e) => {
                        if (e.target.value) {
                          addTag(dimension, e.target.value);
                        }
                      }}
                    >
                      <option value="">{t('actions.select')}</option>
                      {predefinedValues.map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => {
                      setAddingDimension(null);
                      setCustomValue('');
                    }}
                    className="text-slate-500 hover:text-slate-700 text-sm"
                  >
                    {t('actions.cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
