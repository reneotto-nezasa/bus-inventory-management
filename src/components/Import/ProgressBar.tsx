import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  message?: string;
}

export function ProgressBar({ progress, message }: ProgressBarProps) {
  const { t } = useTranslation('import');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{message || t('progress.importing')}</span>
        <span className="text-teal-400 font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-300 flex items-center justify-center"
          style={{ width: `${progress}%` }}
        >
          {progress > 0 && progress < 100 && (
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
