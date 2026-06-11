import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaiementPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/cart', { replace: true }); }, [navigate]);
  return null;
}
