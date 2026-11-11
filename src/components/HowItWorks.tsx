import React from 'react';
import { ClipboardList, Calculator, ShieldCheck, CheckCircle2, ArrowRight, Star } from 'lucide-react';

interface HowItWorksProps {
  onOpenBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenBooking }) => {
  const steps = [
    {
      step: '01',
      title: 'Envie o seu Pedido',
      description: 'Selecione a categoria pretendida, indique a província e município em Angola e descreva detalhadamente a sua necessidade.',
      icon: ClipboardList,
    },
    {
      step: '02',
      title: 'Orçamento com Factura',
      description: 'A administração da AngoServ avalia o trabalho e emite um orçamento formal e discriminado, com mão de obra e deslocação em Kwanzas.',
      icon: Calculator,
    },
    {
      step: '03',
      title: 'Multicaixa Express',
      description: 'Validação simples e segura por transferência Multicaixa Express directamente para a conta da AngoServ, sem taxas ocultas.',
      icon: ShieldCheck,
    },
    {
      step: '04',
      title: 'Execução e Garantia',
      description: 'Técnicos credenciados, fardados e com ferramentas de precisão comparecem no local, com termo de garantia pós-serviço.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="sobre-nos" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-100/80 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 text-[#c6a364] fill-[#c6a364]" />
            <span>SIMPLES, DO PEDIDO À SOLUÇÃO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#292e28] tracking-tight">
            O próximo passo é simples.
          </h2>
          <p className="mt-2.5 text-xs sm:text-base text-slate-600">
            A AngoServ responde integralmente por cada serviço prestado. Não deixamos clientes desamparados com técnicos
            avulsos; nós gerimos as equipas, a garantia e a segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative bg-slate-50 p-5 sm:p-6 rounded-lg border border-slate-200/90 hover:shadow-md hover:border-amber-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#b94132] group-hover:bg-[#b94132] group-hover:text-white transition flex items-center justify-center font-bold shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-300 font-mono group-hover:text-[#c6a364] transition">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-[#292e28]">{item.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-[#b94132] flex items-center gap-1">
                  <span>Passo {idx + 1} de 4</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout box responsive */}
        <div className="mt-10 sm:mt-14 bg-gradient-to-r from-[#292e28] via-[#1E293B] to-[#991B1B] rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-amber-500/30">
          <div className="max-w-xl text-center md:text-left space-y-1.5">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Assistência Rápida</span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">
              Precisa de uma equipa técnica ainda hoje?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Piquetes operacionais ativos em Luanda, Benguela, Huambo, Lubango e demais províncias angolanas.
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="w-full md:w-auto px-7 py-3.5 bg-gradient-to-r from-[#b94132] to-[#9d3427] hover:from-red-600 hover:to-red-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition transform active:scale-95 shrink-0 flex items-center justify-center gap-2 border border-red-400/40"
          >
            <span>Pedir Orçamento Agora</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    </section>
  );
};
