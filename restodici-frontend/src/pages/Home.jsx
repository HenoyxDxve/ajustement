import { useState, useEffect, useRef } from 'react';
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
  Smartphone,
  QrCode,
  ArrowRight,
  Star
} from 'lucide-react';

// --- Composants UI ---

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
      className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#D94500]/10 text-[#D94500] border border-[#D94500]/20">
      {children}
    </span>
  );
}

// --- Sections ---

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[#2D2720] font-bold text-xl">
          <div className="w-10 h-10 rounded-xl bg-[#D94500] text-white grid place-items-center shadow-lg shadow-orange-500/30">
            <span className="font-serif italic">R</span>
          </div>
          <span className="hidden sm:block">Resto d&apos;ici</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8B7355]">
          <a href="#menu" className="hover:text-[#D94500] transition-colors">Menu</a>
          <a href="#fonctionnalites" className="hover:text-[#D94500] transition-colors">Fonctionnalités</a>
          <a href="#b2b" className="hover:text-[#D94500] transition-colors">Espace Pro</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-[#2D2720] hover:text-[#D94500] transition-colors">
            Connexion
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-[#D94500] text-white text-sm font-semibold hover:bg-[#B83A00] transition-all shadow-md hover:shadow-lg"
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#F9F7F5]">
      {/* Décoration de fond */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FFF5EB] rounded-l-[5rem] -z-0 hidden lg:block" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Texte Principal */}
          <Reveal>
            <div className="space-y-8">
              <Badge>La restauration digitale en Côte d'Ivoire</Badge>
              
              <h1 className="text-5xl lg:text-6xl font-serif font-bold text-[#2D2720] leading-[1.1]">
                Commandez vos plats <br/>
                préférés en <span className="text-[#D94500] italic">un clic</span>.
              </h1>
              
              <p className="text-lg text-[#8B7355] max-w-xl leading-relaxed">
                Que ce soit pour un déjeuner rapide ou des commandes groupées pour votre entreprise, 
                Resto d'ici simplifie tout : Menu, Paiement Mobile Money et Suivi temps réel.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#D94500] text-white font-bold hover:bg-[#B83A00] transition-all shadow-xl shadow-orange-500/20"
                >
                  <UtensilsCrossed className="w-5 h-5" /> Commander maintenant
                </Link>
                <Link
                  to="/register?type=b2b"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#2D2720] font-bold border border-[#E8E2D9] hover:border-[#D94500] transition-all"
                >
                  <Building2 className="w-5 h-5" /> Espace Entreprise
                </Link>
              </div>

              {/* Preuve Sociale / Stats rapides */}
              <div className="flex items-center gap-6 pt-4 border-t border-[#E8E2D9]">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={`https://i.pravatar.cc/100?img=${i + 20}`} 
                      alt="User" 
                      className="w-10 h-10 rounded-full border-2 border-[#F9F7F5]"
                    />
                  ))}
                </div>
                <div>
                  <p className="font-bold text-[#2D2720]">12 000+ clients</p>
                  <p className="text-xs text-[#8B7355]">Satisfaits ce mois-ci</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Image Hero (Contexte Africain/Restaurant) */}
          <Reveal delay={200}>
            <div className="relative">
              <div className="absolute inset-0 bg-[#D94500]/20 rounded-[3rem] rotate-3 transform" />
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop"
                alt="Table garnie restaurant africain"
                className="relative rounded-[3rem] shadow-2xl w-full object-cover h-[500px]"
              />
              
              {/* Carte flottante : Paiement Mobile */}
              <div className="absolute bottom-8 left-8 bg-white p-4 rounded-2xl shadow-xl border border-[#E8E2D9] flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 rounded-full bg-[#E6F7ED] flex items-center justify-center text-[#2ECC71]">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2D2720]">Paiement validé</p>
                  <p className="text-xs text-[#8B7355]">Mobile Money • 3 500 FCFA</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: <QrCode className="w-7 h-7 text-[#D94500]" />,
      title: "Commande en Table",
      desc: "Scannez le QR Code sur votre table et commandez directement depuis votre téléphone. Fini l'attente."
    },
    {
      icon: <Smartphone className="w-7 h-7 text-[#D94500]" />,
      title: "Paiement Mobile Money",
      desc: "Payez en toute sécurité via Orange Money, MTN MoMo ou Wave grâce à Novasend."
    },
    {
      icon: <Truck className="w-7 h-7 text-[#D94500]" />,
      title: "Suivi Temps Réel",
      desc: "Recevez des notifications à chaque étape : Reçue, En cuisine, En livraison."
    },
    {
      icon: <BarChart3 className="w-7 h-7 text-[#D94500]" />,
      title: "Gestion Intelligente",
      desc: "Suivi des stocks et tableau de bord financier pour les gérants et la direction."
    }
  ];

  return (
    <section className="py-24 bg-white" id="fonctionnalites">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center mb-16">
            <Badge>Pourquoi nous choisir ?</Badge>
            <h2 className="mt-6 text-3xl md:text-4xl font-serif font-bold text-[#2D2720]">
              Une expérience pensée pour l'Afrique
            </h2>
            <p className="mt-4 text-lg text-[#8B7355] max-w-2xl mx-auto">
              Nous combinons technologie de pointe et réalités locales pour offrir le meilleur service possible.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feat, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <div className="group p-8 rounded-3xl bg-[#F9F7F5] border border-[#E8E2D9] hover:bg-white hover:shadow-xl hover:border-[#D94500]/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-[#FFF5EB] transition-colors">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-[#2D2720] mb-3">{feat.title}</h3>
                <p className="text-[#8B7355] leading-relaxed">{feat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function B2C_VS_B2B() {
  return (
    <section className="py-24 bg-[#2D2720] text-white relative overflow-hidden" id="b2b">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-[#D94500] font-bold uppercase tracking-widest text-sm">Deux mondes, une solution</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-serif font-bold">Particuliers & Entreprises</h2>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Carte B2C */}
          <Reveal>
            <div className="bg-[#1A1410] rounded-[2rem] p-2 border border-white/10 hover:border-[#D94500]/50 transition-all">
              <div className="bg-[#F9F7F5] text-[#2D2720] rounded-[1.7rem] overflow-hidden h-full">
                <div className="p-8 lg:p-10 flex flex-col h-full">
                  <div className="mb-8">
                    <Badge>Grand Public</Badge>
                    <h3 className="mt-6 text-3xl font-serif font-bold text-[#2D2720]">Commande en famille</h3>
                    <p className="mt-4 text-[#8B7355] text-lg">Retrouvez les saveurs d'Abidjan et payez facilement via Mobile Money.</p>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      "Menu dynamique & QR Code Table",
                      "Paiement Orange / MTN / Wave",
                      "Suivi de livraison en temps réel"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#2D2720]">
                        <div className="w-6 h-6 rounded-full bg-[#D94500] text-white flex items-center justify-center text-xs font-bold">✓</div>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link to="/menu" className="block w-full py-4 text-center rounded-xl bg-[#D94500] text-white font-bold hover:bg-[#B83A00] transition">
                    Voir le Menu
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Carte B2B */}
          <Reveal delay={200}>
            <div className="bg-[#1A1410] rounded-[2rem] p-2 border border-white/10 hover:border-[#2ECC71]/50 transition-all">
              <div className="bg-white text-[#2D2720] rounded-[1.7rem] overflow-hidden h-full">
                <div className="p-8 lg:p-10 flex flex-col h-full">
                  <div className="mb-8">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/20">
                      Professionnels
                    </span>
                    <h3 className="mt-6 text-3xl font-serif font-bold text-[#2D2720]">Commandes groupées</h3>
                    <p className="mt-4 text-[#8B7355] text-lg">Gérez les repas de vos équipes et centralisez la facturation.</p>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      "Facturation mensuelle consolidée",
                      "Gestion des budgets collaborateurs",
                      "Conformité SYSCOHADA (TVA/NIF)"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#2D2720]">
                        <div className="w-6 h-6 rounded-full bg-[#2ECC71] text-white flex items-center justify-center text-xs font-bold">✓</div>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link to="/register?type=b2b" className="block w-full py-4 text-center rounded-xl bg-[#2ECC71] text-white font-bold hover:bg-[#27AE60] transition">
                    Créer un compte Pro
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-24 bg-[#F9F7F5]">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2D2720] text-center mb-16">
            Ils nous font confiance
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              text: "La commande via QR code a révolutionné le service dans notre restaurant. Moins d'erreurs, clients plus satisfaits !",
              author: "Koffi Jean-Claude",
              role: "Gérant - Le Wôrôwôrô",
              img: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=200&q=80"
            },
            {
              text: "Le module B2B nous permet de gérer les repas de nos 50 employés facilement. La facture mensuelle est un vrai gain de temps.",
              author: "Aminata Touré",
              role: "Responsable RH - TechCI",
              img: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=200&q=80"
            },
            {
              text: "J'adore payer avec Wave et suivre ma commande en temps réel. C'est simple et rapide.",
              author: "Marc Kouassi",
              role: "Client Fidèle",
              img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
            }
          ].map((item, i) => (
            <Reveal key={i} delay={i * 150}>
              <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm hover:shadow-md transition">
                <div className="flex text-[#D94500] mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-[#2D2720] mb-6 leading-relaxed italic">"{item.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={item.img} alt={item.author} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-[#2D2720]">{item.author}</p>
                    <p className="text-xs text-[#8B7355]">{item.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto rounded-[3rem] bg-[#D94500] p-12 md:p-20 text-center relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#B83A00] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        
        <div className="relative z-10 text-white">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Prêt à commander ?</h2>
          <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers de clients et de restaurateurs sur la plateforme de restauration n°1 en Côte d'Ivoire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="px-8 py-4 bg-white text-[#D94500] font-bold rounded-xl hover:bg-[#FFF5EB] transition shadow-lg">
              Explorer le Menu
            </Link>
            <Link to="/register" className="px-8 py-4 bg-[#D94500] border border-white/30 text-white font-bold rounded-xl hover:bg-[#B83A00] transition">
              Devenir Partenaire
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1A1410] text-[#BFA38D] py-16 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-2xl mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#D94500] grid place-items-center text-white">R</div>
            Resto d&apos;ici
          </Link>
          <p className="max-w-sm mb-6">
            La plateforme digitale qui modernise la restauration en Afrique. Commandez, gérez et payez en toute simplicité.
          </p>
          <div className="flex gap-4">
             {/* Social Icons Placeholder */}
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D94500] transition cursor-pointer">F</div>
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D94500] transition cursor-pointer">In</div>
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D94500] transition cursor-pointer">X</div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Liens Rapides</h4>
          <ul className="space-y-4">
            <li><Link to="/menu" className="hover:text-white transition">Menu</Link></li>
            <li><Link to="/login" className="hover:text-white transition">Connexion</Link></li>
            <li><a href="#b2b" className="hover:text-white transition">Espace B2B</a></li>
            <li><Link to="/register?type=restaurant" className="hover:text-white transition">Inscription Restaurateur</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Contact</h4>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">📍 Abidjan, Cocody Riviera</li>
            <li className="flex items-center gap-3">📞 +225 07 00 00 00 00</li>
            <li className="flex items-center gap-3">✉️ contact@restodici.ci</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-sm">
        <p>© 2026 Resto d&apos;ici. Tous droits réservés. Développé par Sankofa-Lab.</p>
      </div>
    </footer>
  );
}

// --- Main Page ---

export default function Home() {
  return (
    <div className="bg-[#F9F7F5] min-h-screen text-[#2D2720] font-sans selection:bg-[#D94500] selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <B2C_VS_B2B />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}