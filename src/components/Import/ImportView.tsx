import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCode, MapPin, Building2 } from 'lucide-react';
import { BusProXMLImport } from './BusProXMLImport';
import { BoardingPointsImport } from './BoardingPointsImport';
import { HotelPartnersImport } from './HotelPartnersImport';

type ImportTab = 'buspro' | 'boardingPoints' | 'hotelPartners';

export function ImportView() {
  const { t } = useTranslation('import');
  const [activeTab, setActiveTab] = useState<ImportTab>('buspro');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-gray-400">{t('subtitle')}</p>
      </div>

      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('buspro')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'buspro'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            {t('tabs.busproXML')}
          </button>
          <button
            onClick={() => setActiveTab('boardingPoints')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'boardingPoints'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t('tabs.boardingPoints')}
          </button>
          <button
            onClick={() => setActiveTab('hotelPartners')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'hotelPartners'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t('tabs.hotelPartners')}
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'buspro' && <BusProXMLImport />}
        {activeTab === 'boardingPoints' && <BoardingPointsImport />}
        {activeTab === 'hotelPartners' && <HotelPartnersImport />}
      </div>
    </div>
  );
}
