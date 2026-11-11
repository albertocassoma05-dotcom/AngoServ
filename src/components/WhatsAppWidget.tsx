import React, { useState } from 'react';
import { MessageSquare, Phone, X, Search, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import { COMPANY_INFO } from '../data/mockData';

interface WhatsAppWidgetProps {
  onOpenTracker?: () => void;
  onOpenBooking?: () => void;
}

export const WhatsAppWidget: React.FC<WhatsAppWidgetProps> = ({ onOpenTracker, onOpenBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [trackingCodeInput, setTrackingCodeInput] = useState('');

  const sendWhatsAppMessage = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/244930051440?text=${encoded}`, '_blank');
    setIsOpen(false);
  };

  const handleConsultOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCodeInput.trim()) return;
    const msg = `Olá AngoServ, gostaria de saber o estado do meu pedido com o código ${trackingCodeInput.trim().toUpperCase()}.`;
    sendWhatsAppMessage(msg);
  };

  return (
    <>
      {/* Floating Green WhatsApp Button (from screenshot!) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 group focus:outline-none"
        title="Falar no WhatsApp: 930 051 440"
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.531 3.657 1.447 5.165L2 22l4.98-1.397C8.423 21.492 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.062c-1.636 0-3.155-.49-4.437-1.332l-.318-.21-2.964.832.846-2.873-.231-.334A8.006 8.006 0 014 12c0-4.411 3.589-8.062 8-8.062s8 3.651 8 8.062c0 4.412-3.589 8.062-8 8.062z" />
          </svg>
        )}
      </button>

      {/* WhatsApp Quick Menu Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#128C7E] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Atendimento WhatsApp AngoServ</h4>
                <p className="text-xs text-white/80">{COMPANY_INFO.whatsapp}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 bg-slate-50">
            <p className="text-xs text-slate-600 font-medium">
              Escolha uma opção para iniciar conversa imediata:
            </p>

            {/* Option 1: Solicitar Informações */}
            <button
              onClick={() =>
                sendWhatsAppMessage('Olá AngoServ, gostaria de solicitar informações sobre os vossos serviços ao domicílio.')
              }
              className="w-full p-3 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800">Solicitar Informações</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>

            {/* Option 2: Pedir Orçamento */}
            <button
              onClick={() =>
                sendWhatsAppMessage('Olá AngoServ, gostaria de pedir um orçamento para a minha residência/empresa.')
              }
              className="w-full p-3 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800">Pedir Orçamento</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>

            {/* Option 3: Falar com o Atendimento */}
            <button
              onClick={() =>
                sendWhatsAppMessage('Olá AngoServ, preciso falar com um assistente do atendimento ao cliente.')
              }
              className="w-full p-3 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-800">Falar com o Atendimento</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>

            {/* Option 4: Consultar Pedido */}
            <form onSubmit={handleConsultOrder} className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Consultar Pedido Existente
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Código (Ex: AS-2026-9041)"
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 uppercase font-mono bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
