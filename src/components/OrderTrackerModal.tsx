import React, { useState, useEffect } from 'react';
import { Order, ORDER_STATUS_MAP, OrderStatus } from '../types';
import {
  X,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Star,
  FileText,
  Mail,
  Send,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { getAccessToken, getOrderFromFirestore, updateOrderInFirestore } from '../lib/firebase';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderCode?: string | null;
  onOpenPayment: (order: Order) => void;
}

const TIMELINE_STEPS: OrderStatus[] = [
  'RECEBIDO',
  'EM_ANALISE',
  'ORCAMENTO_ENVIADO',
  'AGUARDANDO_PAGAMENTO',
  'PAGAMENTO_CONFIRMADO',
  'CONFIRMADO',
  'PROFISSIONAL_ATRIBUIDO',
  'EM_EXECUCAO',
  'CONCLUIDO',
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderCode,
  onOpenPayment,
}) => {
  const [searchCode, setSearchCode] = useState(initialOrderCode || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Rating State
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Email Notification State
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const fetchOrderByCode = async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    setActionSuccessMessage('');
    try {
      // 1. Try Firebase Firestore first
      const firestoreOrder = await getOrderFromFirestore(code.trim()).catch(() => null);
      if (firestoreOrder) {
        setOrder(firestoreOrder);
      }

      // 2. Also query local server API to ensure consistency
      const response = await fetch(`/api/orders/${encodeURIComponent(code.trim())}`);
      const data = await response.json();
      if (response.ok && data.success && data.order) {
        setOrder(data.order);
      } else if (!firestoreOrder) {
        throw new Error(data.error || 'Código de pedido não encontrado.');
      }
    } catch (err: any) {
      if (!order) {
        setOrder(null);
        setErrorMessage(err.message || 'Código não encontrado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderCode) {
      setSearchCode(initialOrderCode);
      fetchOrderByCode(initialOrderCode);
    }
  }, [initialOrderCode, isOpen]);

  if (!isOpen) return null;

  const handleQuoteAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!order) return;
    setIsLoading(true);
    try {
      const nextStatus: OrderStatus = action === 'APPROVE' ? 'AGUARDANDO_PAGAMENTO' : 'CANCELADO';
      const updatedQuote = order.quote
        ? { ...order.quote, status: action === 'APPROVE' ? ('APROVADO' as const) : ('REJEITADO' as const) }
        : undefined;

      // Update in Firebase Firestore
      await updateOrderInFirestore(order.id, {
        status: nextStatus,
        quote: updatedQuote,
      });

      // Sync with server API
      const response = await fetch(`/api/orders/${order.code}/quote-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.order) {
        setOrder(data.order);
      } else {
        setOrder({
          ...order,
          status: nextStatus,
          quote: updatedQuote,
          updatedAt: new Date().toISOString(),
        });
      }

      setActionSuccessMessage(
        action === 'APPROVE'
          ? 'Orçamento aprovado com sucesso! Pode agora efetuar o pagamento.'
          : 'Orçamento rejeitado.'
      );
    } catch (err: any) {
      console.error('Quote action error:', err);
      setErrorMessage(err.message || 'Erro ao processar ação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSubmittingRating(true);
    try {
      const ratingObj = {
        stars: ratingStars,
        comment: ratingComment.trim(),
        submittedAt: new Date().toISOString(),
      };

      // Update in Firebase Firestore
      await updateOrderInFirestore(order.id, {
        rating: ratingObj,
      });

      // Sync with server API
      await fetch(`/api/orders/${order.code}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars: ratingStars, comment: ratingComment }),
      }).catch((e) => console.warn('Rating sync note:', e));

      setOrder({ ...order, rating: ratingObj });
      setActionSuccessMessage('Agradecemos a sua avaliação com a AngoServ!');
    } catch (err: any) {
      console.error('Rating error:', err);
      setErrorMessage(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSendEmailNotification = async () => {
    if (!order || !order.customerEmail) return;
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #101D35;">AngoServ - Atualização do Pedido #${order.code}</h2>
          <p>Olá <strong>${order.customerName}</strong>,</p>
          <p>O estado do seu serviço de <strong>${order.serviceName}</strong> foi atualizado para: <span style="color: #1677E8; font-weight: bold;">${ORDER_STATUS_MAP[order.status].label}</span>.</p>
          <p><strong>Local:</strong> ${order.neighborhood}, ${order.municipality}, ${order.province}</p>
          ${order.quote ? `<p><strong>Valor do Orçamento:</strong> ${order.quote.totalAmount.toLocaleString('pt-AO')} Kz</p>` : ''}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">AngoServ - Serviços ao seu alcance.<br/>WhatsApp: 930 051 440 | Email: angoserv05@gmail.com</p>
        </div>
      `;

      const response = await fetch('/api/email/notify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: order.customerEmail,
          subject: `AngoServ: Atualização do Pedido ${order.code} - ${ORDER_STATUS_MAP[order.status].label}`,
          htmlContent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailStatus('Resumo enviado com sucesso para ' + order.customerEmail);
      } else {
        setEmailStatus('Não foi possível enviar o email no momento.');
      }
    } catch (err: any) {
      setEmailStatus('Erro ao comunicar com o servidor de correio.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const currentStatusInfo = order ? ORDER_STATUS_MAP[order.status] : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0F172A] px-6 py-5 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png"
              alt="AngoServ Logo"
              className="w-10 h-10 rounded-xl object-contain shadow"
            />
            <div>
              <h3 className="text-base font-bold">Acompanhar Estado do Pedido</h3>
              <p className="text-xs text-amber-300">Consulte orçamentos, técnicos e pagamentos em tempo real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input bar */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrderByCode(searchCode);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Insira o código do pedido (Ex: AS-2026-9041)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase bg-white focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#1677E8] hover:bg-blue-600 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Consultar</span>}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 flex-wrap">
            <span>Exemplos para teste:</span>
            {['AS-2026-9041', 'AS-2026-7842', 'AS-2026-6219', 'AS-2026-5120'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  setSearchCode(code);
                  fetchOrderByCode(code);
                }}
                className="underline hover:text-[#1677E8] font-mono"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-7 max-h-[70vh] overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {actionSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {order && currentStatusInfo ? (
            <div className="space-y-6">
              {/* Order Card Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#1677E8] bg-blue-50 px-2.5 py-1 rounded-md">
                      {order.code}
                    </span>
                    <h4 className="text-lg font-bold text-[#101D35] mt-1">{order.serviceName}</h4>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 self-start ${currentStatusInfo.bgColor} ${currentStatusInfo.color}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{currentStatusInfo.label}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {currentStatusInfo.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1677E8] shrink-0" />
                    <span>{order.neighborhood}, {order.municipality}, {order.province}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1677E8] shrink-0" />
                    <span>Agendado: {order.preferredDate} ({order.preferredTimeSlot})</span>
                  </div>
                </div>
              </div>

              {/* 10-State Visual Timeline */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h5 className="text-xs font-bold text-[#101D35] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1677E8]" />
                  <span>Progresso do Atendimento</span>
                </h5>

                <div className="space-y-3">
                  {TIMELINE_STEPS.map((statusKey, index) => {
                    const stepInfo = ORDER_STATUS_MAP[statusKey];
                    const isPassed = currentStatusInfo.step >= stepInfo.step;
                    const isCurrent = order.status === statusKey;

                    return (
                      <div key={statusKey} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                              isCurrent
                                ? 'bg-[#1677E8] text-white ring-4 ring-blue-100'
                                : isPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {isPassed ? <Check className="w-3.5 h-3.5" /> : index + 1}
                          </div>
                          {index < TIMELINE_STEPS.length - 1 && (
                            <div className={`w-0.5 h-5 my-0.5 ${isPassed ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                          )}
                        </div>
                        <div className="pb-1">
                          <div className={`text-xs font-bold ${isCurrent ? 'text-[#1677E8]' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                            {stepInfo.label}
                          </div>
                          {isCurrent && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{stepInfo.description}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quote Block (Orçamento) */}
              {order.quote && (
                <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h5 className="font-bold text-sm text-[#101D35]">Orçamento Detalhado AngoServ</h5>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        order.quote.status === 'APROVADO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.quote.status === 'REJEITADO'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {order.quote.status === 'APROVADO'
                        ? 'Aprovado'
                        : order.quote.status === 'REJEITADO'
                        ? 'Rejeitado'
                        : 'Aguardando sua aprovação'}
                    </span>
                  </div>

                  {/* Financial items */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Mão de obra especializada:</span>
                      <span className="font-semibold font-mono">{order.quote.laborFee.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Materiais e produtos aplicados:</span>
                      <span className="font-semibold font-mono">{order.quote.materialsFee.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Taxa de deslocação e transporte:</span>
                      <span className="font-semibold font-mono">{order.quote.travelFee.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    {order.quote.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Desconto comercial AngoServ:</span>
                        <span className="font-mono">-{order.quote.discount.toLocaleString('pt-AO')} Kz</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-[#101D35] border-t border-slate-200 pt-2">
                      <span>VALOR TOTAL A PAGAR:</span>
                      <span className="font-mono text-[#1677E8]">{order.quote.totalAmount.toLocaleString('pt-AO')} Kz</span>
                    </div>
                  </div>

                  {order.quote.notes && (
                    <p className="text-xs text-slate-500 italic bg-purple-50/50 p-2.5 rounded-lg">
                      Nota do perito: {order.quote.notes}
                    </p>
                  )}

                  {/* Customer quote approval buttons */}
                  {order.quote.status === 'PENDENTE' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleQuoteAction('APPROVE')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Aprovar Orçamento</span>
                      </button>
                      <button
                        onClick={() => handleQuoteAction('REJECT')}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 font-semibold text-xs rounded-xl transition flex items-center gap-1"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section / Action */}
              {order.status === 'AGUARDANDO_PAGAMENTO' && (
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-sm text-amber-900">Pagamento Multicaixa Express Disponível</h5>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Orçamento aprovado. Efetue a transferência para confirmar o agendamento da equipa técnica.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenPayment(order)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar / Enviar Comprovativo</span>
                  </button>
                </div>
              )}

              {/* Payment Proof Status if submitted */}
              {order.payment && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Comprovativo Multicaixa Express
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        order.payment.status === 'CONFIRMADO'
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.payment.status === 'REJEITADO'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.payment.status === 'CONFIRMADO'
                        ? 'Pagamento Validado'
                        : order.payment.status === 'REJEITADO'
                        ? 'Comprovativo Rejeitado'
                        : 'Aguardando Validação'}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Ref: <span className="font-mono font-semibold">{order.payment.referenceNumber}</span> | Valor: {order.payment.amountKz.toLocaleString('pt-AO')} Kz
                  </div>
                  {order.payment.status === 'PENDENTE' && (
                    <p className="text-[11px] text-slate-400">
                      O departamento financeiro da AngoServ está a validar este comprovativo no extrato bancário.
                    </p>
                  )}
                </div>
              )}

              {/* Assigned Team Notification (No professional profiles exposed!) */}
              {order.assignment && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 text-xs space-y-1.5">
                  <div className="font-bold text-[#101D35] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1677E8]" />
                    <span>Equipa Técnica AngoServ Atribuída</span>
                  </div>
                  <p className="text-slate-600">
                    A equipa técnica oficial credenciada pela AngoServ está destacada para comparecer no endereço em {order.assignment.scheduledTime}.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Garantia e supervisão 100% responsabilidade da AngoServ.
                  </p>
                </div>
              )}

              {/* Service Completion Rating Form */}
              {order.status === 'CONCLUIDO' && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                  <h5 className="text-xs font-bold text-[#101D35] uppercase tracking-wider flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Avaliação do Serviço AngoServ</span>
                  </h5>

                  {order.rating ? (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1 text-amber-500 font-bold mb-1">
                        {Array.from({ length: order.rating.stars }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p>&ldquo;{order.rating.comment}&rdquo;</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Avaliação registada. Obrigado!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleRatingSubmit} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">Sua nota:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setRatingStars(s)}
                              className={`p-1 ${ratingStars >= s ? 'text-amber-500' : 'text-slate-300'}`}
                            >
                              <Star className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Deixe um comentário sobre a pontualidade e acabamento..."
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingRating}
                        className="px-4 py-2 bg-[#1677E8] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition"
                      >
                        {isSubmittingRating ? 'A enviar...' : 'Enviar Avaliação'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Email Notification Option via Gmail */}
              {order.customerEmail && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email registado: {order.customerEmail}</span>
                  </div>
                  <button
                    onClick={handleSendEmailNotification}
                    disabled={isSendingEmail}
                    className="text-[#1677E8] hover:underline font-semibold flex items-center gap-1"
                  >
                    {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Enviar resumo por Email</span>
                  </button>
                </div>
              )}
              {emailStatus && (
                <div className="p-2 rounded-lg bg-blue-50 text-blue-800 text-xs text-center">{emailStatus}</div>
              )}
            </div>
          ) : (
            !isLoading && (
              <div className="py-12 text-center space-y-3">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">Nenhum Pedido Selecionado</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Insira o código gerado após o agendamento (ex: AS-2026-9041) para consultar o orçamento,
                  aprovação e estado da equipa técnica da AngoServ.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
