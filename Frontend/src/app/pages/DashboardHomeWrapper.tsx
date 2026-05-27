import React, { useState, useEffect } from 'react';
import DashboardHome from './DashboardHome';
import DashboardHomeCoordinator from './DashboardHomeCoordinator';

export default function DashboardHomeWrapper() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setRole(user.role);
    }
  }, []);

  if (role === 'Coordinator') {
    return <DashboardHomeCoordinator />;
  }
  
  return <DashboardHome />;
}