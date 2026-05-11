import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  Building2,
  Users,
  Clock,
  Wallet,
  Truck,
  Shield,
  Package,
  BarChart3,
} from 'lucide-react';

const sections = [
  { label: 'Menu', href: '/menu' },
  { label: 'B2C', href: '#clients' },
  { label: 'B2B', href: '#b2b' },
  { label: 'Aide', href: '#faq' },
];


const stats = [
  { value: '340+', label: 'Restaurants partenaires' },
  { value: '12 000+', label: 'Commandes mensuelles' },
  { value: '98%', label: 'Clients satisfaits' },
  { value: '30 min', label: 'Livraison rapide' },
];

const features = [
  {
    icon: <Package className="w-6 h-6" />,
    title: 'Gestion des commandes',
    description: 'Recevez et traitez les commandes en temps réel avec un KDS moderne.',
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: 'Paiement intégré',
    description: 'Paiements Mobile Money sécurisés et suivi automatique.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Suivi des stocks',
    description: 'Alertes de rupture et inventaire simplifié pour chaque restaurant.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Rapports clairs',
    description: 'Analysez ventes, marges et performances en un seul tableau de bord.',
  },
];

const clientSteps = [
  {
    step: '01',
    title: 'Choisissez un restaurant',
    description: 'Parcourez les menus mis à jour en temps réel.',
  },
  {
    step: '02',
    title: 'Payez facilement',
    description: 'Mobile Money sécurisé en quelques clics.',
  },
  {
    step: '03',
    title: 'Suivez votre repas',
    description: 'Recevez chaque étape jusqu’à la livraison.',
  },
];

const b2bHighlights = [
  { icon: <Users className="w-5 h-5" />, label: 'Commandes groupées pour l’équipe' },
  { icon: <Wallet className="w-5 h-5" />, label: 'Facturation mensuelle SYSCOHADA' },
  { icon: <Shield className="w-5 h-5" />, label: 'Budget collaborateur maîtrisé' },
  { icon: <Clock className="w-5 h-5" />, label: 'Suivi des livraisons en temps réel' },
];

const testimonials = [
  {
    quote: 'Notre restaurant a gagné en réactivité et les clients reconnaissent la fluidité du service.',
    name: 'Jean-Claude, restaurateur',
  },
  {
    quote: 'Les commandes d’équipe se font maintenant en quelques minutes avec une facture claire.',
    name: 'Aminata, responsable RH',
  },
];

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('opacity-100', 'translate-y-0');
          node.classList.remove('opacity-0', 'translate-y-8');
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-8 transition-all duration-700"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-[#2D2720] font-semibold">
          <div className="w-10 h-10 rounded-xl bg-[#D94500] text-white grid place-items-center">R</div>
          <span>Resto d&apos;ici</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-[#8B7355]">
          {sections.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#D94500] transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl border border-[#D94500] text-[#D94500] hover:bg-[#D94500]/10 transition"
          >
            Connexion
          </Link>
          <Link
            to="/register?type=restaurant"
            className="px-4 py-2 rounded-xl bg-[#D94500] text-white hover:bg-[#B83A00] transition"
          >
            Restaurateur
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="bg-[#FFF5EB] py-20 px-6">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
        <Reveal>
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#D94500] border border-[#D94500]/20">
              Plateforme tout-en-un pour restaurants et clients
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#2D2720] leading-tight">
              Commandez, gérez et suivez vos repas avec <span className="text-[#D94500] italic">Resto d&apos;ici</span>
            </h1>
            <p className="max-w-xl text-[#8B7355] leading-relaxed">
              Simplifiez la vie des restaurateurs, des clients et des entreprises avec une expérience claire,
              rapide et entièrement adaptée aux besoins ivoiriens.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D94500] px-6 py-3 text-white font-semibold hover:bg-[#B83A00] transition"
              >
                <UtensilsCrossed className="w-4 h-4" /> Commander
              </Link>
              <Link
                to="/register?type=restaurant"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D94500] px-6 py-3 text-[#D94500] font-semibold hover:bg-[#D94500]/10 transition"
              >
                <ChefHat className="w-4 h-4" /> Restaurateur
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="rounded-[2rem] bg-white p-8 shadow-xl border border-[#E8E2D9]">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-[#FFF5EB] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#D94500] mb-3">Client</p>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-[#2D2720]">Poulet Yassa</p>
                    <p className="text-xs text-[#8B7355]">3 500 FCFA</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-[#2D2720]">Attiéké Poisson</p>
                    <p className="text-xs text-[#8B7355]">Livraison 30 min</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-[#E6F7ED] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#2ECC71] mb-3">Restaurant</p>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-[#2D2720]">Commandes actives</p>
                    <p className="text-xs text-[#8B7355]">124</p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold text-[#2D2720]">CA du jour</p>
                    <p className="text-xs text-[#8B7355]">450 000 FCFA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-7xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-[#E8E2D9] bg-[#FFF5EB] p-6 text-center">
            <p className="text-3xl font-bold text-[#2D2720]">{item.value}</p>
            <p className="mt-2 text-sm text-[#8B7355]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="bg-[#F9F7F5] py-20 px-6" id="restaurants">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D94500]">Pour les restaurateurs</p>
          <h2 className="mt-4 text-3xl md:text-4xl font-serif font-bold text-[#2D2720]">Tout ce dont votre restaurant a besoin</h2>
          <p className="mt-4 mx-auto max-w-2xl text-[#8B7355]">Un seul outil pour gérer les commandes, les paiements et les stocks sans perdre de temps.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-[#E8E2D9] bg-white p-6 hover:shadow-lg transition">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF5EB] text-[#D94500]">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg text-[#2D2720] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#8B7355] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientSection() {
  return (
    <section className="bg-white py-20 px-6" id="clients">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2ECC71]">Pour les clients</p>
          <h2 className="mt-4 text-3xl md:text-4xl font-serif font-bold text-[#2D2720]">Commandez en quelques minutes</h2>
          <p className="mt-4 max-w-xl text-[#8B7355] leading-relaxed">Trouvez votre restaurant préféré, payez par Mobile Money et suivez votre commande de l’écran de la cuisine à la livraison.</p>

          <div className="mt-8 space-y-4">
            {clientSteps.map((step) => (
              <div key={step.step} className="flex gap-4 rounded-3xl border border-[#E8E2D9] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2ECC71] text-white font-bold">{step.step}</div>
                <div>
                  <h3 className="font-semibold text-[#2D2720]">{step.title}</h3>
                  <p className="text-sm text-[#8B7355]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] px-6 py-3 text-white font-semibold hover:bg-[#27AE60] transition"
            >
              <UtensilsCrossed className="w-4 h-4" /> Explorer les menus
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#F9F7F5] p-8 shadow-lg border border-[#E8E2D9]">
          <div className="grid gap-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-2xl bg-[#E6F7ED] p-3 text-[#2ECC71]"><Clock className="w-5 h-5" /></span>
                <div>
                  <p className="font-semibold text-[#2D2720]">Suivi en direct</p>
                  <p className="text-sm text-[#8B7355]">Toutes les étapes visibles sur votre smartphone.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-2xl bg-[#E6F7ED] p-3 text-[#2ECC71]"><Wallet className="w-5 h-5" /></span>
                <div>
                  <p className="font-semibold text-[#2D2720]">Paiement fiable</p>
                  <p className="text-sm text-[#8B7355]">MTN MoMo, Orange Money et Wave supportés.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-2xl bg-[#E6F7ED] p-3 text-[#2ECC71]"><Truck className="w-5 h-5" /></span>
                <div>
                  <p className="font-semibold text-[#2D2720]">Livraison rapide</p>
                  <p className="text-sm text-[#8B7355]">Recevez votre repas en moins de 30 minutes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function B2BSection() {
  return (
    <section className="bg-[#F9F7F5] py-20 px-6" id="b2b">
      <div className="max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2ECC71]">Entreprises</p>
          <h2 className="mt-4 text-3xl md:text-4xl font-serif font-bold text-[#2D2720]">Simplifiez les commandes d’équipe</h2>
          <p className="mt-4 max-w-xl text-[#8B7355] leading-relaxed">Commandes groupées, budgets par collaborateur et facturation mensuelle claire pour les RH et la finance.</p>

          <div className="mt-8 space-y-4">
            {b2bHighlights.map((item) => (
              <div key={item.label} className="flex gap-4 rounded-3xl border border-[#E8E2D9] bg-white p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7ED] text-[#2ECC71]">{item.icon}</div>
                <p className="text-sm text-[#2D2720]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/register?type=b2b"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2ECC71] px-6 py-3 text-white font-semibold hover:bg-[#27AE60] transition"
            >
              <Building2 className="w-4 h-4" /> Ouvrir un compte<br/>entreprise
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-lg border border-[#E8E2D9]">
          <div className="grid gap-6">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-3xl border border-[#E8E2D9] p-6">
                <p className="text-[#2D2720] leading-relaxed">“{item.quote}”</p>
                <p className="mt-4 font-semibold text-[#D94500]">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-[#2D2720] py-20 px-6">
      <div className="max-w-5xl mx-auto text-center text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-[#D94500]">Prêt à démarrer</p>
        <h2 className="mt-4 text-3xl md:text-4xl font-serif font-bold">Votre restaurant, vos clients et vos équipes réunis</h2>
        <p className="mt-4 text-[#E8D7C7] max-w-2xl mx-auto leading-relaxed">Resto d&apos;ici simplifie les commandes, les paiements et les opérations pour tous les acteurs du marché.</p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/register?type=restaurant"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D94500] px-6 py-3 font-semibold text-white hover:bg-[#B83A00] transition"
          >
            <ChefHat className="w-4 h-4" /> Restaurateur
          </Link>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20 transition"
          >
            <UtensilsCrossed className="w-4 h-4" /> Commander
          </Link>
          <Link
            to="/register?type=b2b"
            className="inline-flex items-center gap-2 rounded-xl border border-[#2ECC71]/40 bg-[#2ECC71]/10 px-6 py-3 font-semibold text-[#2ECC71] hover:bg-[#2ECC71]/20 transition"
          >
            <Building2 className="w-4 h-4" /> Entreprise
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1A1410] text-white py-12 px-6">
      <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#D94500] grid place-items-center">R</div>
            <span className="font-semibold text-lg">Resto d&apos;ici</span>
          </div>
          <p className="text-sm text-[#BFA38D]">La plateforme qui simplifie la restauration en Côte d&apos;Ivoire.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D94500] mb-4">Liens</h3>
          <div className="space-y-2 text-sm text-[#BFA38D]">
            <Link to="/menu" className="block hover:text-white transition">Commander</Link>
            <Link to="/register?type=restaurant" className="block hover:text-white transition">Restaurateur</Link>
            <Link to="/register?type=b2b" className="block hover:text-white transition">Entreprise</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D94500] mb-4">Contact</h3>
          <p className="text-sm text-[#BFA38D]">Abidjan, Côte d&apos;Ivoire</p>
          <p className="text-sm text-[#BFA38D]">support@restodici.ci</p>
        </div>
      </div>
      <div className="mt-10 border-t border-white/10 pt-6 text-center text-[#BFA38D] text-sm">2026 • Resto d&apos;ici</div>
    </footer>
  );
}

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-[#F9F7F5] text-[#2D2720]">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <ClientSection />
      <B2BSection />
      <CTA />
      <Footer />
    </div>
  );
}
