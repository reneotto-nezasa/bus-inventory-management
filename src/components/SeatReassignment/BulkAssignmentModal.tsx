import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import type { BulkAssignmentSuggestion } from '../../types';

interface BulkAssignmentModalProps {
  suggestions: BulkAssignmentSuggestion[];
  onApply: (selectedSuggestions: BulkAssignmentSuggestion[]) => void;
  onCancel: () => void;
}

export function BulkAssignmentModal({
  suggestions,
  onApply,
  onCancel,
}: BulkAssignmentModalProps) {
  const { t } = useTranslation('seatmaps');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(suggestions.map((s) => s.passenger_id))
  );

  const toggleSelection = (passengerId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(passengerId)) {
      newSet.delete(passengerId);
    } else {
      newSet.add(passengerId);
    }
    setSelectedIds(newSet);
  };

  const handleApply = () => {
    const selected = suggestions.filter((s) => selectedIds.has(s.passenger_id));
    onApply(selected);
  };

  const totalConflicts = suggestions.reduce(
    (sum, s) => sum + s.conflicts.length,
    0
  );

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-gray-400';
    }
  };

  const getConfidenceDot = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{t('bulk.preview')}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {t('bulk.assignmentCount', { count: suggestions.length })}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {totalConflicts > 0 && (
          <div className="p-3 bg-orange-500 bg-opacity-10 border-b border-orange-500 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-medium">
                {t('bulk.conflictWarning', { count: totalConflicts })}
              </p>
              {suggestions
                .filter((s) => s.conflicts.length > 0)
                .map((s) =>
                  s.conflicts.map((conflict, idx) => (
                    <p key={`${s.passenger_id}-${idx}`} className="text-orange-300 text-sm mt-1">
                      {conflict}
                    </p>
                  ))
                )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-400 w-12"></th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                  {t('preference.name')}
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                  {t('bulk.suggestedSeat')}
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-400">
                  {t('bulk.reason')}
                </th>
                <th className="text-left py-2 px-2 text-sm font-medium text-gray-400 w-28">
                  {t('bulk.confidence')}
                </th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => {
                const isSelected = selectedIds.has(suggestion.passenger_id);
                return (
                  <tr
                    key={suggestion.passenger_id}
                    className={`border-b border-gray-700 transition-colors ${
                      isSelected ? 'bg-gray-700' : 'hover:bg-gray-750'
                    }`}
                  >
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(suggestion.passenger_id)}
                        className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500"
                      />
                    </td>
                    <td className="py-2 px-2 text-white text-sm">
                      {suggestion.passenger_name}
                    </td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-1 bg-teal-500 bg-opacity-20 border border-teal-500 rounded text-teal-400 text-sm font-medium">
                        {suggestion.suggested_seat_label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-300 text-sm">
                      {suggestion.reason}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getConfidenceDot(
                            suggestion.confidence
                          )}`}
                        ></div>
                        <span
                          className={`text-sm ${getConfidenceColor(
                            suggestion.confidence
                          )}`}
                        >
                          {t(`bulk.${suggestion.confidence}`)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4" />
            <span>
              {selectedIds.size} / {suggestions.length} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={handleApply}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('bulk.applyAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
