import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, File } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes: string[];
  selectedFile: File | null;
}

export function FileUploadZone({ onFileSelect, acceptedTypes, selectedFile }: FileUploadZoneProps) {
  const { t } = useTranslation('import');

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer bg-gray-800"
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-white mb-2">{t('uploadZone.title')}</p>
          <p className="text-sm text-gray-400 mb-2">{t('uploadZone.dragDrop')}</p>
          <p className="text-xs text-gray-500">
            {t('uploadZone.acceptedTypes')}: {acceptedTypes.join(', ')}
          </p>
          <button className="mt-4 btn-primary">{t('uploadZone.selectFile')}</button>
        </label>
      </div>

      {selectedFile && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg flex items-center gap-3">
          <File className="w-5 h-5 text-teal-400" />
          <div className="flex-1">
            <p className="text-white font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
