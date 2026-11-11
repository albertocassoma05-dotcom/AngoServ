import React, { useState, useEffect } from 'react';
import { ServiceItem, ZoneConfig, Order } from '../types';
import { ANGOLA_PROVINCES, COMPANY_INFO } from '../data/mockData';
import { auth, createOrderInFirestore } from '../lib/firebase';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Upload,
  AlertCircle,
  CheckCircle2,
  Copy,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService?: ServiceItem | null;
  services: ServiceItem[];
  preselectedProvince?: string;
  onOrderCreated?: (orderCode: string) => void;
  onTrackOrder?: (orderCode: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedService,
  services,
  preselectedProvince,
  onOrderCreated,
  onTrackOrder,
}) => {
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [province, setProvince] = useState(preselectedProvince || 'Luanda');
  const [municipality, setMunicipality] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [serviceId, setServiceId] = useState(selectedService ? selectedService.id : services[0]?.id || '');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'MANHA' | 'TARDE' | 'INTEGRAL' | 'SABADO'>('MANHA');
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync selected service if changed
  useEffect(() => {
    if (selectedService) {
      setServiceId(selectedService.id);
    }
  }, [selectedService]);

  // Sync preselected province
  useEffect(() => {
    if (preselectedProvince) {
      setProvince(preselectedProvince);
    }
  }, [preselectedProvince]);

  // Set default municipality when province changes
  const currentProvinceConfig: ZoneConfig | undefined = ANGOLA_PROVINCES.find(
    (p) => p.province.toLowerCase() === province.toLowerCase()
  );

  useEffect(() => {
    if (currentProvinceConfig && currentProvinceConfig.municipalities.length > 0) {
      setMunicipality(currentProvinceConfig.municipalities[0].name);
    } else {
      setMunicipality('');
    }
  }, [province]);

  // Set default preferred date (tomorrow)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPreferredDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  // Handle Photo upload preview (in base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Por favor introduza o seu nome completo.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) {
      setErrorMessage('Por favor introduza um número de telefone angolano válido (ex: 923 000 000).');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Por favor descreva o problema ou o serviço que necessita.');
      return;
    }

    const selectedServiceObj = services.find((s) => s.id === serviceId);

    setIsSubmitting(true);
    try {
      // 1. Generate unique identifiers
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const uniqueCode = `AS-2026-${randomSuffix}`;
      const uniqueId = `ord-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newOrderPayload: Order = {
        id: uniqueId,
        code: uniqueCode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail ? customerEmail.trim() : undefined,
        customerId: auth.currentUser?.uid,
        province,
        municipality,
        neighborhood: neighborhood.trim() || 'Centro',
        address: address.trim(),
        serviceId,
        serviceName: selectedServiceObj?.title || 'Serviço AngoServ',
        description: description.trim(),
        preferredDate,
        preferredTimeSlot,
        photos,
        observations: observations.trim(),
        status: 'RECEBIDO',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // 2. Persist to Firebase Firestore
      await createOrderInFirestore(newOrderPayload);

      // 3. Sync with local server API for email dispatch & admin dashboard
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderPayload),
      }).catch((e) => console.warn('Server sync note:', e));

      setCreatedOrderCode(uniqueCode);
      if (onOrderCreated) onOrderCreated(uniqueCode);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#F59E0B', '#111827', '#FFFFFF'],
        });
      } catch (e) {
        // Safe confetti fallback
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao registar o pedido no Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (createdOrderCode) {
      navigator.clipboard.writeText(createdOrderCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const resetForm = () => {
    setCreatedOrderCode(null);
    setDescription('');
    setObservations('');
    setPhotos([]);
    onClose();
  };

  const currentServiceItem = services.find((s) => s.id === serviceId);

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
              <h3 className="text-lg font-bold">Solicitar Serviço AngoServ</h3>
              <p className="text-xs text-amber-300">Preencha os dados. Analisamos e respondemos de imediato.</p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {createdOrderCode ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner border-2 border-amber-300">
              <CheckCircle2 className="w-10 h-10 text-[#DC2626]" />
            </div>

            <div>
              <span className="text-xs font-black text-white bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                Pedido Registado com Sucesso!
              </span>
              <h4 className="text-2xl font-black text-[#0F172A] mt-3">Obrigado pela sua preferência</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                A equipa técnica da AngoServ já recebeu a sua solicitação. Vamos analisar os detalhes e emitir o seu
                orçamento formal.
              </p>
            </div>

            {/* Unique Code Card */}
            <div className="bg-slate-50 border-2 border-dashed border-[#DC2626]/40 rounded-2xl p-6 max-w-sm mx-auto">
              <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                Código Único do Seu Pedido
              </div>
              <div className="text-3xl font-black text-[#0F172A] tracking-wider my-2 font-mono">
                {createdOrderCode}
              </div>
              <button
                onClick={copyToClipboard}
                className="mt-2 text-xs font-bold text-[#DC2626] hover:text-red-700 flex items-center justify-center gap-1.5 mx-auto transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
              <button
                onClick={() => {
                  const code = createdOrderCode;
                  resetForm();
                  if (onTrackOrder) onTrackOrder(code);
                }}
                className="py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-900 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition"
              >
                <span>Acompanhar Estado do Pedido</span>
              </button>

              <a
                href={`https://wa.me/244930051440?text=Ol%C3%A1%20AngoServ,%20acabei%20de%20registar%20o%20pedido%20${createdOrderCode}%20e%20gostaria%20de%20acompanhar.`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notificar via WhatsApp</span>
              </a>
            </div>

            <p className="text-xs text-slate-400">
              Guarde este código para consultar orçamentos, aprovar serviços e anexar o comprovativo Multicaixa Express.
            </p>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Serviço Pretendido *
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm font-medium bg-white text-slate-800"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — ({s.priceType === 'FIXO' ? `a partir de ${s.basePriceKz?.toLocaleString('pt-AO')} Kz` : 'Sob Orçamento'})
                  </option>
                ))}
              </select>
              {currentServiceItem && (
                <p className="text-xs text-slate-500 mt-1 italic">{currentServiceItem.subtitle}</p>
              )}
            </div>

            {/* Client Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Baptista"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Número de Telefone (Angola) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 923 000 000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Email (Opcional para envio de orçamentos)
              </label>
              <input
                type="email"
                placeholder="Ex: joao.baptista@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm bg-white"
              />
            </div>

            {/* Location Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-[#DC2626]" />
                <span>Localização do Atendimento em Angola</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Província *</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    {ANGOLA_PROVINCES.map((p) => (
                      <option key={p.province} value={p.province}>
                        {p.province} {p.active ? '' : '(Indisponível)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Município *</label>
                  <select
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                  >
                    {currentProvinceConfig?.municipalities.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro / Zona</label>
                  <input
                    type="text"
                    placeholder="Ex: Morro Bento, Alvalade, Praia Morena..."
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço / Ponto de Referência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rua Direita, junto à Farmácia..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Description of problem */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Descrição do Problema ou Trabalho Desejado *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Descreva detalhadamente o que precisa: tamanho do sofá, quantidade de paredes, falha elétrica, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm bg-white"
              />
            </div>

            {/* Scheduling preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Data Pretendida *
                </label>
                <input
                  type="date"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                  Período Preferencial *
                </label>
                <select
                  value={preferredTimeSlot}
                  onChange={(e) => setPreferredTimeSlot(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#DC2626] text-sm bg-white text-slate-800"
                >
                  <option value="MANHA">Manhã (08h00 - 12h00)</option>
                  <option value="TARDE">Tarde (13h00 - 17h00)</option>
                  <option value="INTEGRAL">Dia Inteiro (Obras / Reformas)</option>
                  <option value="SABADO">Sábado (Horário Especial)</option>
                </select>
              </div>
            </div>

            {/* Photos upload (optional) */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Enviar Fotografias do Local / Móvel (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-dashed border-[#DC2626] bg-red-50/50 hover:bg-red-50 text-[#DC2626] font-semibold text-xs flex items-center gap-2 transition">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Fotos (Máx 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">
                  {photos.length === 0 ? 'Nenhuma foto selecionada' : `${photos.length} foto(s) anexada(s)`}
                </span>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                      <img src={p} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-bl-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observations */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Observações Adicionais
              </label>
              <input
                type="text"
                placeholder="Ex: Cão de guarda no quintal, condomínio exige autorização prévia..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            {/* Policy Reminder */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <span>
                A AngoServ garante orçamentos transparentes, emissão de faturas e profissionais com supervisão. O pagamento
                é realizado diretamente à empresa por Multicaixa Express após a aprovação do orçamento.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>A enviar pedido...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>Confirmar e Enviar Pedido</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
