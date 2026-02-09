import { useState, useCallback } from 'react';
import { AppLayout, type PageId } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SeatMapEditor } from './components/SeatMapEditor';
import { SeatMapLibrary, type Template } from './components/SeatMapLibrary';
import { BoardingPointsView } from './components/BoardingPoints';
import { TripView } from './components/TripView';
import { ImportView } from './components/Import';
import { useSeatMaps, useBoardingPoints, useTrips } from './hooks';
import type { SeatMap, Seat, SeatType, SeatStatus } from './types';

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [view, setView] = useState<'library' | 'editor'>('library');

  const {
    seatMaps,
    currentSeatMap,
    seats,
    loading: seatMapsLoading,
    createSeatMap,
    updateSeatMap,
    deleteSeatMap,
    changeSeatType,
    changeSeatStatus,
    updateSeat,
    loadSeatMap,
    setCurrentSeatMap,
  } = useSeatMaps();

  const {
    boardingPoints,
    transferCostCategories,
    loading: boardingLoading,
    createBoardingPoint,
    updateBoardingPoint,
    deleteBoardingPoint,
  } = useBoardingPoints();

  const {
    trips,
    loading: tripsLoading,
    linkSeatMapToTransport,
  } = useTrips();

  const handleCreateNew = useCallback(async () => {
    await createSeatMap({
      bezeichnung: 'New Seat Map',
      art: 'BUS',
      rows_count: 10,
      cols_count: 5,
    });
    setView('editor');
    setActivePage('seatmaps');
  }, [createSeatMap]);

  const handleCreateFromTemplate = useCallback(async (template: Template) => {
    await createSeatMap({
      bezeichnung: template.bezeichnung,
      art: template.art,
      rows_count: template.rows_count,
      cols_count: template.cols_count,
    });
    setView('editor');
  }, [createSeatMap]);

  const handleSelectSeatMap = useCallback(async (seatMap: SeatMap) => {
    await loadSeatMap(seatMap.id);
    setView('editor');
  }, [loadSeatMap]);

  const handleUpdateSeatMap = useCallback((updates: Partial<SeatMap>) => {
    if (currentSeatMap) {
      updateSeatMap(currentSeatMap.id, updates);
    }
  }, [currentSeatMap, updateSeatMap]);

  const handleChangeSeatType = useCallback((row: number, col: number, type: SeatType, label?: string) => {
    if (currentSeatMap) {
      changeSeatType(currentSeatMap.id, row, col, type, label);
    }
  }, [currentSeatMap, changeSeatType]);

  const handleChangeSeatStatus = useCallback((row: number, col: number, status: SeatStatus) => {
    if (currentSeatMap) {
      changeSeatStatus(currentSeatMap.id, row, col, status);
    }
  }, [currentSeatMap, changeSeatStatus]);

  const handleUpdateSeat = useCallback((row: number, col: number, updates: Partial<Seat>) => {
    if (currentSeatMap) {
      updateSeat(currentSeatMap.id, row, col, updates);
    }
  }, [currentSeatMap, updateSeat]);

  const handleSave = useCallback(() => {
    if (currentSeatMap) {
      updateSeatMap(currentSeatMap.id, { updated_at: new Date().toISOString() });
    }
  }, [currentSeatMap, updateSeatMap]);

  const handleDelete = useCallback(async () => {
    if (currentSeatMap && window.confirm('Are you sure you want to delete this seat map?')) {
      await deleteSeatMap(currentSeatMap.id);
      setView('library');
    }
  }, [currentSeatMap, deleteSeatMap]);

  const handleDeleteFromLibrary = useCallback(async (seatMap: SeatMap) => {
    await deleteSeatMap(seatMap.id);
  }, [deleteSeatMap]);

  const handleBack = useCallback(() => {
    setCurrentSeatMap(null);
    setView('library');
  }, [setCurrentSeatMap]);

  const handleNavigate = useCallback((page: 'seatmaps' | 'boarding' | 'trips') => {
    setActivePage(page);
    if (page === 'seatmaps') {
      setView('library');
    }
  }, []);

  const loading = seatMapsLoading || boardingLoading || tripsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            seatMaps={seatMaps}
            boardingPoints={boardingPoints}
            trips={trips}
            onNavigate={handleNavigate}
            onCreateSeatMap={handleCreateNew}
          />
        );

      case 'seatmaps':
        if (view === 'editor' && currentSeatMap) {
          return (
            <SeatMapEditor
              seatMap={currentSeatMap}
              seats={seats}
              onUpdateSeatMap={handleUpdateSeatMap}
              onChangeSeatType={handleChangeSeatType}
              onChangeSeatStatus={handleChangeSeatStatus}
              onUpdateSeat={handleUpdateSeat}
              onSave={handleSave}
              onDelete={handleDelete}
              onBack={handleBack}
            />
          );
        }
        return (
          <SeatMapLibrary
            seatMaps={seatMaps}
            onSelectSeatMap={handleSelectSeatMap}
            onCreateFromTemplate={handleCreateFromTemplate}
            onCreateNew={handleCreateNew}
            onDelete={handleDeleteFromLibrary}
          />
        );

      case 'boarding':
        return (
          <BoardingPointsView
            boardingPoints={boardingPoints}
            transferCostCategories={transferCostCategories}
            onUpdateBoardingPoint={updateBoardingPoint}
            onCreateBoardingPoint={createBoardingPoint}
            onDeleteBoardingPoint={deleteBoardingPoint}
          />
        );

      case 'trips':
        return (
          <TripView
            trips={trips}
          />
        );

      case 'import':
        return <ImportView />;

      default:
        return null;
    }
  };

  return (
    <AppLayout
      activePage={activePage}
      onPageChange={setActivePage}
      collapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default App;
