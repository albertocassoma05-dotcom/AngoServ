import React from 'react';
import { ServiceItem } from '../types';
import { X, CheckCircle, Clock, ShieldCheck, ArrowRight, Tag } from 'lucide-react';
import { COMPANY_INFO } from '../data/mockData';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onBook: (service: ServiceItem) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBook,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Image */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-black/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category Tag */}
          <div className="absolute top-4 left-4">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white text-xs font-black shadow border border-red-400/40">
              {service.category}
            </span>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">{service.title}</h3>
            <p className="text-sm text-slate-200 mt-1">{service.subtitle}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-300">
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                <Tag className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Preço Estimado</span>
              </div>
              <div className="text-base font-black text-[#0F172A] mt-1 font-mono">
                {service.priceType === 'FIXO' && service.basePriceKz
                  ? `${service.basePriceKz.toLocaleString('pt-AO')} Kz`
                  : 'Sob Orçamento'}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Duração Média</span>
              </div>
              <div className="text-base font-bold text-[#0F172A] mt-1">{service.estimatedDuration}</div>
            </div>

            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-200 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Garantia</span>
              </div>
              <div className="text-base font-bold text-red-900 mt-1">Garantia AngoServ</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2">
              Sobre o Serviço
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {service.description}
            </p>
          </div>

          {/* Inclusions */}
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              O que está incluído no serviço:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.includes.map((inc, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200"
                >
                  <CheckCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-[#0F172A]">Responsabilidade AngoServ: </span>
              Você contrata diretamente a nossa empresa. Não lidamos com técnicos informais. Todos os profissionais são
              fardados, identificados e supervisionados com seguro de qualidade.
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Dúvidas rápidas? Fale connosco no WhatsApp:{' '}
            <a
              href={COMPANY_INFO.whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-600 hover:underline"
            >
              {COMPANY_INFO.whatsapp}
            </a>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-100 transition"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onClose();
                onBook(service);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>Solicitar Este Serviço</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
