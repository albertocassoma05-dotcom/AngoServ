import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Clock, Headphones, Star, Search, MapPin } from 'lucide-react';
import { COMPANY_INFO } from '../data/mockData';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenTracker: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenTracker, onExploreServices }) => {
  return (
    <div className="relative bg-[#0F172A] text-white overflow-hidden w-full">
      {/* Background overlay with Luanda skyline aesthetic */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <img
          src="/assets/aistudio/Cat_logo_de_Servi_os_AngoServ_4fea0928.png"
          alt="AngoServ Banner"
          className="w-full h-full object-cover object-top filter brightness-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#0F172A]/95 to-[#0F172A]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-14 sm:pb-18 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6 text-center lg:text-left">
            {/* National Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-red-950/60 border border-red-700/50 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-md mx-auto lg:mx-0">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span>Empresa Angolana &bull; Todas as 18 Províncias</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Catálogo de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#FBBF24]">
                Serviços
              </span>
            </h1>

            <div className="text-lg sm:text-2xl font-bold text-slate-100 leading-snug">
              Escolha o serviço que precisa.{' '}
              <span className="text-[#F59E0B] block sm:inline">A AngoServ trata do resto!</span>
            </div>

            <div className="text-sm sm:text-base font-serif italic text-amber-300/95 tracking-wide">
              &ldquo;{COMPANY_INFO.slogan}&rdquo;
            </div>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Prestação profissional de serviços ao domicílio e empresariais em todo o território nacional.
              Contrate com a segurança jurídica e técnica de uma empresa responsável, sem prestadores avulsos e com
              pagamento validado por Multicaixa Express.
            </p>

            {/* Action CTAs: Full-width on mobile, auto on desktop */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 text-white font-black text-sm shadow-xl shadow-red-950/40 flex items-center justify-center gap-2 transition transform active:scale-95 border border-red-400/30"
              >
                <span>Solicitar um Serviço</span>
                <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
              </button>

              <button
                onClick={onExploreServices}
                className="w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 flex items-center justify-center transition"
              >
                <span>Ver Serviços Populares</span>
              </button>

              <button
                onClick={onOpenTracker}
                className="w-full sm:w-auto px-4 sm:px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-white/10 flex items-center justify-center gap-2 transition"
              >
                <Search className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>Acompanhar Pedido</span>
              </button>
            </div>

            {/* Fast Quality Bullet Points */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 sm:gap-6 text-[11px] sm:text-xs text-slate-400 font-medium flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>Garantia de Satisfação</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                <span>Multicaixa Express</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                <span>Orçamento Transparente</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Logo Showcase (Scales for phone / tablet / PC) */}
          <div className="lg:col-span-5 xl:col-span-4 flex justify-center">
            <div className="relative group p-1">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#111827] rounded-3xl blur-lg opacity-35 group-hover:opacity-60 transition duration-500" />
              <div className="relative rounded-3xl p-3 sm:p-5 bg-[#0B1120]/90 border border-amber-500/30 shadow-2xl flex flex-col items-center">
                <img
                  src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png"
                  alt="AngoServ Símbolo Oficial"
                  className="w-36 h-36 sm:w-52 sm:h-52 lg:w-60 lg:h-60 object-contain drop-shadow-xl"
                />
                <div className="mt-3 text-center">
                  <div className="text-sm font-black text-white tracking-wider flex items-center justify-center gap-1">
                    Ango<span className="text-[#F59E0B]">Serv</span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                    Prestação de Serviços em Angola
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust bar at bottom: Responsive 2x2 on mobile, 4 columns on tablet & desktop */}
      <div className="bg-[#090D16] border-t border-slate-800/80 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626]" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white leading-tight">Serviços de Confiança</div>
                <div className="text-[10px] sm:text-xs text-slate-400">Garantia pós-serviço</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white leading-tight">Todo o Território</div>
                <div className="text-[10px] sm:text-xs text-slate-400">18 províncias</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-[#DC2626]" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white leading-tight">Suporte Dedicado</div>
                <div className="text-[10px] sm:text-xs text-slate-400">Linha 930 051 440</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B] fill-[#F59E0B]" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white leading-tight">Clientes Satisfeitos</div>
                <div className="text-[10px] sm:text-xs text-slate-400">Pontualidade e rigor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
