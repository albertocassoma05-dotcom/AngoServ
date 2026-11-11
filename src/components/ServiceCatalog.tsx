import React from 'react';
import { ServiceItem } from '../types';
import {
  Armchair,
  Paintbrush,
  Droplet,
  Zap,
  Wrench,
  Monitor,
  Scissors,
  Sparkles,
  ArrowRight,
  Info,
  Star,
} from 'lucide-react';

interface ServiceCatalogProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  onOpenDetails: (service: ServiceItem) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  services,
  onSelectService,
  onOpenDetails,
}) => {
  // Map icon names to Lucide icon components
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-5 h-5 text-white" />;
      case 'Paintbrush':
        return <Paintbrush className="w-5 h-5 text-white" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-white" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-white" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-white" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-white" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5 text-white" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-white" />;
      default:
        return <Wrench className="w-5 h-5 text-white" />;
    }
  };

  return (
    <section id="servicos" className="py-16 bg-[#F3F6FA] relative">
      {/* Decorative subtle national flag gradient accent at top */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#111827] absolute top-0 left-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Angolan flag theme badge */}
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700 bg-red-100/90 border border-red-200 px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span>Cores Nacionais &bull; Excelência AngoServ</span>
            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
          </div>

          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            Catálogo de Serviços Populares
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Técnicos certificados, ferramentas de topo e compromisso total com o cliente angolano.
            Selecione o serviço que procura e a AngoServ trata do resto!
          </p>
        </div>

        {/* 4x2 Grid styled with Angolan Flag colors (Red, Gold/Yellow, Black) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-amber-400 transition-all duration-300 border border-slate-200 flex flex-col group relative"
            >
              {/* Card Image Container with national flag colored circular badge */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Circular Icon Badge: Red base with Golden yellow ring & gear accent */}
                <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#DC2626] to-[#991B1B] border-4 border-white flex items-center justify-center shadow-lg ring-2 ring-amber-400">
                  {renderIcon(service.iconName)}
                </div>

                {/* Price tag: Golden Yellow with Black text (Angolan Flag Theme) */}
                <div className="absolute top-3 right-3 bg-[#F59E0B] text-[#0F172A] font-black text-xs px-3 py-1 rounded-full shadow-md border border-amber-300 flex items-center gap-1 font-mono">
                  <span>
                    {service.priceType === 'FIXO' && service.basePriceKz
                      ? `${service.basePriceKz.toLocaleString('pt-AO')} Kz`
                      : 'Sob Orçamento'}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 pt-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626] mb-1">
                    {service.category}
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] leading-snug group-hover:text-[#DC2626] transition-colors">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {service.subtitle}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  {/* Primary CTA Button: Angolan Flag Red with Gold Arrow */}
                  <button
                    onClick={() => onSelectService(service)}
                    className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 active:from-red-800 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 transition transform active:scale-98"
                  >
                    <span>Solicitar Serviço</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>

                  {/* Secondary Details Trigger */}
                  <button
                    onClick={() => onOpenDetails(service)}
                    className="w-full py-1.5 text-slate-500 hover:text-[#DC2626] font-semibold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <Info className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Ver detalhes e o que inclui</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
