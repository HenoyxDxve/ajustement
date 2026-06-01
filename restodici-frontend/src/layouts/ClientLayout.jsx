import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChefHat, Package, UtensilsCrossed } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

export default function ClientLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  let totalItems;
  try {
    const cart = useCart();
    totalItems = cart.items.reduce((sum, i) => sum + (i.quantite ?? i.quantity ?? 0), 0);
  } catch {
    totalItems = 0;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b shadow-sm" style={{ background: 'rgba(255,250,243,0.96)', backdropFilter: 'blur(16px)', borderColor: 'var(--color-line)' }}>
        {/* Kente strip */}
        <div style={{ display: 'flex', height: 3 }}>
          {['#FF8C00','#FFB800','#1A0C00','#E07A00'].map((c,i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition"
                style={{ background: 'linear-gradient(135deg,#FF8C00,#FFB800)' }}>
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-lg sm:text-xl font-bold leading-tight" style={{ color: 'var(--color-dark)', fontFamily: "'Playfair Display', serif" }}>Resto d'ici</div>
                <div className="text-[11px] font-semibold -mt-0.5" style={{ color: 'var(--color-muted)' }}>Table digitale • Mobile Money</div>
              </div>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium transition" style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color='#FF8C00'} onMouseLeave={e => e.currentTarget.style.color='var(--color-muted)'}>
                Accueil
              </Link>
              <Link to="/menu" className="text-sm font-medium transition" style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color='#FF8C00'} onMouseLeave={e => e.currentTarget.style.color='var(--color-muted)'}>
                Restaurants
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              {!user && (
                <Link to="/register?type=restaurant"
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition text-sm"
                  style={{ border: '2px solid #FF8C00', color: '#FF8C00', background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#FF8C00'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#FF8C00'; }}>
                  <ChefHat className="w-4 h-4" />
                  Inscrire un restaurant
                </Link>
              )}

              {user && (
                <button onClick={() => navigate('/cart')}
                  className="relative p-2 transition" style={{ color: 'var(--color-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color='#FF8C00'} onMouseLeave={e => e.currentTarget.style.color='var(--color-muted)'}>
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#FF8C00' }}>
                      {totalItems}
                    </span>
                  )}
                </button>
              )}

              {user && (
                <Link to={user?.role === 'B2B' ? '/b2b/orders' : '/mes-commandes'}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
                  style={{ border: '1px solid var(--color-line)', background: 'var(--color-bg-alt)', color: '#FF8C00' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#FF8C00'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-line)'}>
                  <Package className="w-4 h-4" />
                  Mes commandes
                </Link>
              )}

              <div className="flex items-center gap-2">
                <Link to={!user ? "/login" : user.role === 'B2B' ? "/b2b" : "/account"}
                  className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition sm:inline-flex"
                  style={{ border: '1px solid var(--color-line)', background: 'var(--color-bg-alt)', color: '#FF8C00' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#FF8C00'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-line)'}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#FF8C00,#E07A00)' }}>
                    {(user?.prenom?.charAt(0) || user?.nom?.charAt(0) || 'P').toUpperCase()}
                  </span>
                  <span>{user ? 'Profil' : 'Connexion'}</span>
                </Link>
                {user && (
                  <button onClick={() => setShowLogoutModal(true)}
                    className="hidden text-xs transition hover:text-red-600 sm:block" style={{ color: 'var(--color-muted)' }}>
                    Déconnexion
                  </button>
                )}
              </div>

              {/* Mobile toggle */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2" style={{ color: 'var(--color-muted)' }}>
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-line)' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}
              className="block py-2 font-medium" style={{ color: 'var(--color-dark)' }}>Accueil</Link>
            <Link to="/menu" onClick={() => setMobileMenuOpen(false)}
              className="block py-2 font-medium" style={{ color: 'var(--color-dark)' }}>Restaurants</Link>
            {!user && (
              <Link to="/register?type=restaurant" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 font-medium" style={{ color: '#FF8C00' }}>
                <ChefHat className="w-4 h-4" />
                Inscrire un restaurant
              </Link>
            )}
            {user && (
              <Link to={user?.role === 'B2B' ? '/b2b/orders' : '/mes-commandes'} onClick={() => setMobileMenuOpen(false)}
                className="block py-2 font-medium" style={{ color: 'var(--color-dark)' }}>Mes commandes</Link>
            )}
            <Link to={!user ? "/login" : user.role === 'B2B' ? "/b2b" : "/account"} onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 font-medium" style={{ color: 'var(--color-dark)' }}>
              👤 {user?.role === 'B2B' ? 'Espace Entreprise' : 'Mon Profil'}
            </Link>
            {user && (
              <button onClick={() => { setShowLogoutModal(true); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-red-600 font-medium">
                🚪 Déconnexion
              </button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-dark)' }}>Confirmer la déconnexion ?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>Vous serez redirigé vers la page de connexion.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium border"
                style={{ borderColor: 'var(--color-line)', color: 'var(--color-dark)' }}>
                Annuler
              </button>
              <button onClick={() => { logout(); navigate('/login'); setShowLogoutModal(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
