// src/hooks/useRoleRedirect.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function useRoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      if (role === 'GERANT' || role === 'ADMIN') navigate('/gerant?tab=overview', { replace: true });
      else if (role === 'B2B') navigate('/b2b', { replace: true });
      else if (role === 'STAFF') navigate('/staff', { replace: true });
      else if (role === 'CLIENT') navigate('/menu', { replace: true });
      else navigate('/login', { replace: true });
    } catch {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return null;
}