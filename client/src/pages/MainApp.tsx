import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Dashboard } from './Dashboard';
import { Appointments } from './Appointments';
import { Vehicles } from './Vehicles';
import { Customers } from './Customers';
import { Opportunities } from './Opportunities';
import { Reminders } from './Reminders';
import Users from './Users';
import Reception from './Reception';

export const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handleNavigate = (event: any) => {
      setCurrentPage(event.detail);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  // Estado para controlar si queremos crear un vehículo directamente
  const [shouldCreateVehicle, setShouldCreateVehicle] = useState(false);

  const navigateToVehicleForm = () => {
    console.log('🎯 MainApp: Navigating to vehicle creation form');
    setShouldCreateVehicle(true);
    setCurrentPage('vehicles');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'appointments':
        return <Appointments />;
      case 'vehicles':
        return <Vehicles initialMode={shouldCreateVehicle ? 'create' : 'search'} onModeUsed={() => setShouldCreateVehicle(false)} />;
      case 'customers':
        return <Customers />;
      case 'opportunities':
        return <Opportunities />;
      case 'reminders':
        return <Reminders />;
      case 'reception':
        return <Reception />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard onNavigate={setCurrentPage} onNavigateToVehicleForm={navigateToVehicleForm} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderPage()}
    </div>
  );
};