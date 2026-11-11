import React from 'react';
import { TESTIMONIALS } from '../data/mockData';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-[#f8f7f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <Star className="w-3.5 h-3.5 text-[#c6a364] fill-[#c6a364]" />
            <span>Depoimentos Reais de Clientes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#292e28] tracking-tight">
            Experiências com a AngoServ
          </h2>
          <p className="mt-2.5 text-xs sm:text-base text-slate-600">
            A satisfação dos nossos clientes residenciais e condomínios em Luanda, Benguela e Huambo comprova a nossa
            dedicação e pontualidade técnica.
          </p>
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-200/90 hover:border-amber-400 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#c6a364]">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-7 h-7 text-red-200" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">&ldquo;{t.comment}&rdquo;</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#292e28] flex items-center gap-1.5">
                    <span>{t.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#b94132]" />
                  </h4>
                  <p className="text-[11px] text-slate-500">{t.role} &bull; {t.location}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
