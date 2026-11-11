import React, { useState } from 'react';
import { Order, PaymentDetails } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { updateOrderInFirestore } from '../lib/firebase';
import {
  X,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Upload,
  CheckCircle,
  Copy,
  Loader2,
  FileText,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentSubmitted: (updatedOrder: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentSubmitted,
}) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [senderPhone, setSenderPhone] = useState(order?.customerPhone || '');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const totalAmountKz = order.quote ? order.quote.totalAmount : 0;

  const copyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('O comprovativo deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setProofUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!referenceNumber.trim()) {
      setErrorMessage('Por favor introduza o número da transação / referência do Multicaixa Express.');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentDetails: PaymentDetails = {
        method: 'MULTICAIXA_EXPRESS',
        amountKz: totalAmountKz,
        referenceNumber: referenceNumber.trim(),
        senderPhone: senderPhone.trim() || undefined,
        proofUrl: proofUrl || undefined,
        proofFilename: proofUrl ? 'comprovativo_multicaixa.png' : undefined,
        status: 'PENDENTE',
        submittedAt: new Date().toISOString(),
      };

      // 1. Update in Firebase Firestore
      await updateOrderInFirestore(order.id, {
        payment: paymentDetails,
        status: 'PAGAMENTO_CONFIRMADO', // Or awaiting verification
      });

      // 2. Sync with local server API
      const response = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: order.code,
          amountKz: totalAmountKz,
          referenceNumber,
          senderPhone,
          proofUrl,
        }),
      });

      const data = await response.json();
      const updatedOrder = data.order || {
        ...order,
        payment: paymentDetails,
        updatedAt: new Date().toISOString(),
      };

      setSuccessMessage('Comprovativo submetido com sucesso! O pagamento aguarda validação pelo departamento financeiro da AngoServ.');
      onPaymentSubmitted(updatedOrder);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Payment submit error:', err);
      setErrorMessage(err.message || 'Erro ao submeter o pagamento no Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0F172A] px-6 py-5 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png"
              alt="AngoServ Logo"
              className="w-10 h-10 rounded-xl object-contain shadow"
            />
            <div>
              <h3 className="text-base font-bold">Pagamento por Multicaixa Express</h3>
              <p className="text-xs text-amber-300">Pedido: {order.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Security Alert - Explicit Requirement */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">AVISO DE SEGURANÇA MULTICAIXA EXPRESS: </span>
              A AngoServ <span className="underline font-bold">NUNCA</span> solicita o seu PIN, código secreto ou dados de acesso do cartão Multicaixa. Efetue apenas a transferência pelo canal oficial da sua aplicação bancária.
            </div>
          </div>

          {/* Amount to pay */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <div className="text-xs text-slate-500 uppercase font-semibold">Valor Total do Serviço</div>
            <div className="text-3xl font-black text-[#101D35] mt-1 font-mono">
              {totalAmountKz.toLocaleString('pt-AO')} Kz
            </div>
            <div className="text-xs text-slate-500 mt-1">Serviço: {order.serviceName}</div>
          </div>

          {/* Official AngoServ Payment Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#101D35] uppercase tracking-wider">
              Dados Oficiais da Empresa AngoServ
            </h4>

            {/* Multicaixa Express Phone */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Número Multicaixa Express (Empresa)</div>
                <div className="text-sm font-bold text-slate-900 font-mono">{COMPANY_INFO.multicaixaExpressNumber}</div>
              </div>
              <button
                type="button"
                onClick={() => copyText(COMPANY_INFO.multicaixaExpressNumber, 'phone')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedField === 'phone' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* IBAN */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <div className="pr-2">
                <div className="text-[11px] text-slate-500 font-medium">IBAN (Banco Angolano de Investimentos - BAI)</div>
                <div className="text-xs font-bold text-slate-900 font-mono break-all">{COMPANY_INFO.ibanAngola}</div>
              </div>
              <button
                type="button"
                onClick={() => copyText(COMPANY_INFO.ibanAngola, 'iban')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedField === 'iban' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-[#101D35] uppercase tracking-wider">
              Registar Comprovativo da Transação
            </h4>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{errorMessage}</div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Transação / ID do Comprovativo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: MCX-998812 ou Código de Operação ATM"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Telefone que Realizou o Pagamento
              </label>
              <input
                type="tel"
                placeholder="Ex: 923 000 000"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anexo do Comprovativo (Foto / Screenshot / PDF)
              </label>
              <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-2 transition w-full justify-center">
                <Upload className="w-4 h-4 text-[#1677E8]" />
                <span>{proofUrl ? 'Comprovativo Anexado (Clique para alterar)' : 'Carregar Imagem do Comprovativo'}</span>
                <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {proofUrl && (
              <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200 mt-2">
                <img src={proofUrl} alt="Comprovativo" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs hover:bg-slate-200 transition"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Submeter Comprovativo</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
