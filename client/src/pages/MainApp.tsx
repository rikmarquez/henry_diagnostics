import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Dashboard } from './Dashboard';
import { Vehicles } from './Vehicles';
import { Customers } from './Customers';
import { Opportunities } from './Opportunities';
import { Reminders } from './Reminders';

export const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const handleNavigate = (event: any) => {
      setCurrentPage(event.detail);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'vehicles':
        return <Vehicles />;
      case 'customers':
        return <Customers />;
      case 'opportunities':
        return <Opportunities />;
      case 'reminders':
        return <Reminders />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderPage()}
    </div>
  );
};