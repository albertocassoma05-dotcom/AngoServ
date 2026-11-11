import React from 'react';
import { COMPANY_INFO } from '../data/mockData';
import { Phone, Mail, MapPin, Shield, ArrowUp } from 'lucide-react';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onExploreServices: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenBooking,
  onOpenTracker,
  onOpenAdmin,
  onExploreServices,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contactos" className="bg-[#0F172A] text-white border-t border-slate-800 relative">
      {/* Angolan Flag Accent Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#111827]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png"
                alt="AngoServ Logo"
                className="w-12 h-12 rounded-xl object-contain shadow-md"
              />
              <span className="text-2xl font-black tracking-tight text-white">
                Ango<span className="text-[#F59E0B]">Serv</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-serif italic">
              &ldquo;{COMPANY_INFO.slogan}&rdquo;
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empresa angolana de referência em serviços ao domicílio e empresariais. Centralizamos orçamentos, equipas
              técnicas e garantia de qualidade em todo o território nacional.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              <span>Cobertura em todas as 18 províncias de Angola</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F59E0B]">Navegação Rápida</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button onClick={scrollToTop} className="hover:text-white transition">
                  Página Inicial
                </button>
              </li>
              <li>
                <button onClick={onExploreServices} className="hover:text-white transition">
                  Catálogo de Serviços Populares
                </button>
              </li>
              <li>
                <button onClick={onOpenBooking} className="hover:text-white transition">
                  Solicitar um Serviço ao Domicílio
                </button>
              </li>
              <li>
                <button onClick={onOpenTracker} className="hover:text-white transition">
                  Acompanhar Estado do Pedido
                </button>
              </li>
              <li>
                <button onClick={onOpenAdmin} className="hover:text-white transition flex items-center gap-1.5 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Painel Administrativo AngoServ</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Services list */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F59E0B]">Serviços Populares</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Lavagem de Sofás, Cadeirões e Tapetes</li>
              <li>Pintura Residencial e Comercial</li>
              <li>Canalização e Reparação Hidráulica</li>
              <li>Electricidade e Quadros de Energia</li>
              <li>Montagem de Móveis e Salas</li>
              <li>Assistência Técnica e Hardware</li>
              <li>Barbearia ao Domicílio</li>
              <li>Manicure, Pedicure e Estética</li>
            </ul>
          </div>

          {/* Official Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F59E0B]">Contactos Oficiais</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={COMPANY_INFO.whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono font-bold text-white"
                >
                  {COMPANY_INFO.whatsapp}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <a href={`mailto:${COMPANY_INFO.email}`} className="hover:underline">
                  {COMPANY_INFO.email}
                </a>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <span>{COMPANY_INFO.officeAddress}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1 mt-4">
              <div className="text-amber-300 font-semibold">Pagamentos Seguros</div>
              <p>Multicaixa Express oficial: {COMPANY_INFO.multicaixaExpressNumber}</p>
              <p className="text-[10px] text-slate-400">Nunca partilhe o seu PIN com ninguém.</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} AngoServ. Todos os direitos reservados. República de Angola.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Voltar ao topo</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
