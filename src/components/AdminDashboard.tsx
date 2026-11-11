import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, ORDER_STATUS_MAP, Technician, ZoneConfig, AdminStats } from '../types';
import { updateOrderInFirestore } from '../lib/firebase';
import {
  X,
  Shield,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Filter,
  FileText,
  UserCheck,
  CreditCard,
  MapPin,
  Plus,
  Lock,
  ChevronDown,
  AlertCircle,
  Eye,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'PEDIDOS' | 'PAGAMENTOS' | 'PROFISSIONAIS' | 'ZONAS' | 'FINANCAS'>('PEDIDOS');

  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [zones, setZones] = useState<ZoneConfig[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Admin Action
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalAction, setModalAction] = useState<'QUOTE' | 'ASSIGN' | 'STATUS' | 'DETAILS' | null>(null);

  // Quote Form State
  const [quoteLabor, setQuoteLabor] = useState<number>(20000);
  const [quoteMaterials, setQuoteMaterials] = useState<number>(5000);
  const [quoteTravel, setQuoteTravel] = useState<number>(3500);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Assign Form State
  const [assignTechId, setAssignTechId] = useState('');
  const [assignSchedule, setAssignSchedule] = useState('');
  const [assignPayoutKz, setAssignPayoutKz] = useState<number>(15000);
  const [assignNotes, setAssignNotes] = useState('');

  // New Technician Form State
  const [newTechModal, setNewTechModal] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechSpecialty, setNewTechSpecialty] = useState('Electricidade');
  const [newTechProvince, setNewTechProvince] = useState('Luanda');

  // Feedback Message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, techsRes, statsRes, zonesRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/technicians'),
        fetch('/api/admin/stats'),
        fetch('/api/zones'),
      ]);

      const ordersData = await ordersRes.json();
      const techsData = await techsRes.json();
      const statsData = await statsRes.json();
      const zonesData = await zonesRes.json();

      if (ordersData.success) setOrders(ordersData.orders);
      if (techsData.success) setTechnicians(techsData.technicians);
      if (statsData.success) setStats(statsData.stats);
      if (zonesData.success) setZones(zonesData.zones);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchAdminData();
    }
  }, [isAuthenticated, isOpen]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Acesso negado.');
      }
    } catch (err: any) {
      setAuthError('Falha ao autenticar.');
    }
  };

  // Admin: Update Status
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // 1. Sync with Firebase Firestore
      await updateOrderInFirestore(orderId, { status: newStatus }).catch((e) =>
        console.warn('Firestore admin status sync note:', e)
      );

      // 2. Sync with local server
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Estado alterado para "${ORDER_STATUS_MAP[newStatus].label}" no Firebase e sistema.` });
        fetchAdminData();
        setModalAction(null);
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao alterar estado.' });
    }
  };

  // Admin: Save Quote
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const quoteObj = {
        id: `quo-${Date.now()}`,
        laborFee: quoteLabor,
        materialsFee: quoteMaterials,
        travelFee: quoteTravel,
        discount: quoteDiscount,
        totalAmount: quoteLabor + quoteMaterials + quoteTravel - quoteDiscount,
        notes: quoteNotes,
        status: 'PENDENTE' as const,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      };

      // 1. Sync with Firebase Firestore
      await updateOrderInFirestore(selectedOrder.id, {
        quote: quoteObj,
        status: 'ORCAMENTO_ENVIADO',
      }).catch((e) => console.warn('Firestore admin quote sync note:', e));

      // 2. Sync with local server
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laborFee: quoteLabor,
          materialsFee: quoteMaterials,
          travelFee: quoteTravel,
          discount: quoteDiscount,
          notes: quoteNotes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Orçamento emitido e registado no Firebase Firestore.' });
        fetchAdminData();
        setModalAction(null);
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao emitir orçamento.' });
    }
  };

  // Admin: Assign Tech
  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !assignTechId) {
      alert('Selecione um profissional.');
      return;
    }
    const tech = technicians.find((t) => t.id === assignTechId);
    try {
      const assignObj = {
        technicianId: assignTechId,
        technicianName: tech?.name || 'Técnico Especialista',
        assignedAt: new Date().toISOString(),
        scheduledTime: assignSchedule || '09:00',
        laborPayoutKz: assignPayoutKz,
        notes: assignNotes,
      };

      // 1. Sync with Firebase Firestore
      await updateOrderInFirestore(selectedOrder.id, {
        assignment: assignObj,
        status: 'PROFISSIONAL_ATRIBUIDO',
      }).catch((e) => console.warn('Firestore admin assign sync note:', e));

      // 2. Sync with local server
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: assignTechId,
          scheduledTime: assignSchedule,
          laborPayoutKz: assignPayoutKz,
          notes: assignNotes,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Profissional atribuído e atualizado no Firebase.' });
        fetchAdminData();
        setModalAction(null);
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao atribuir profissional.' });
    }
  };

  // Admin: Verify Payment
  const handleVerifyPayment = async (orderId: string, verified: boolean) => {
    try {
      // 1. Sync with Firebase Firestore
      await updateOrderInFirestore(orderId, {
        status: verified ? 'PAGAMENTO_CONFIRMADO' : 'AGUARDANDO_PAGAMENTO',
      }).catch((e) => console.warn('Firestore admin payment sync note:', e));

      // 2. Sync with local server
      const response = await fetch(`/api/admin/payments/${orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: verified ? 'Pagamento Multicaixa validado no Firebase!' : 'Pagamento rejeitado.',
        });
        fetchAdminData();
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao verificar pagamento.' });
    }
  };

  // Admin: Create Technician
  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTechName,
          phone: newTechPhone,
          specialty: newTechSpecialty,
          province: newTechProvince,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Profissional cadastrado internamente!' });
        setNewTechModal(false);
        setNewTechName('');
        setNewTechPhone('');
        fetchAdminData();
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao cadastrar profissional.' });
    }
  };

  // Admin: Payout Tech
  const handlePayoutTech = async (techId: string) => {
    if (!confirm('Confirmar registo de liquidação/pagamento a este profissional?')) return;
    try {
      const response = await fetch(`/api/admin/technicians/${techId}/payout`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        fetchAdminData();
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Erro ao liquidar pagamento.' });
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'TODOS' || o.status === statusFilter;
    const matchesSearch =
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-[#F3F6FA] rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl border border-slate-300 min-h-[85vh] flex flex-col">
        {/* Top Bar */}
        <div className="bg-[#0F172A] px-6 py-4 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png"
              alt="AngoServ Logo"
              className="w-10 h-10 rounded-xl object-contain shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Painel de Gestão Ango<span className="text-[#F59E0B]">Serv</span></h3>
                <span className="text-[10px] bg-red-950 text-amber-300 border border-red-800 px-2 py-0.5 rounded-full font-mono font-bold">
                  ADMINISTRADOR
                </span>
              </div>
              <p className="text-xs text-amber-200/80">Controlo centralizado de pedidos, orçamentos, equipas e finanças</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate if not logged in */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-100">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1677E8] mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xl font-black text-[#101D35]">Acesso Restrito</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Introduza a palavra-passe administrativa para aceder à gestão dos serviços.
                </p>
              </div>

              {authError && <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs">{authError}</div>}

              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="password"
                  required
                  placeholder="Palavra-passe (ex: angoserv2026)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8] bg-white text-center font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#1677E8] hover:bg-blue-600 text-white font-bold text-sm shadow transition"
                >
                  Entrar no Painel
                </button>
              </form>
              <p className="text-[11px] text-slate-400">Dica: Utilize &ldquo;angoserv2026&rdquo; ou &ldquo;admin123&rdquo;</p>
            </div>
          </div>
        ) : (
          /* Main Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Feedback notification toast */}
            {feedback && (
              <div
                className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
                  feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                <span>{feedback.message}</span>
                <button onClick={() => setFeedback(null)} className="font-bold underline text-[10px]">
                  Fechar
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('PEDIDOS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'PEDIDOS'
                      ? 'bg-[#101D35] text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pedidos ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('PAGAMENTOS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'PAGAMENTOS'
                      ? 'bg-[#101D35] text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Multicaixa Express</span>
                </button>

                <button
                  onClick={() => setActiveTab('PROFISSIONAIS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'PROFISSIONAIS'
                      ? 'bg-[#101D35] text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Profissionais ({technicians.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('ZONAS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'ZONAS'
                      ? 'bg-[#101D35] text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Zonas & Deslocação</span>
                </button>

                <button
                  onClick={() => setActiveTab('FINANCAS')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'FINANCAS'
                      ? 'bg-[#101D35] text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>Finanças & Relatórios</span>
                </button>
              </div>

              <button
                onClick={fetchAdminData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Sub-Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Analytics Cards */}
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                      <span>Pedidos Pendentes</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-[#101D35] mt-1">{stats.pendingOrders}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Aguardam análise/orçamento</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                      <span>Receita Validada</span>
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                      {stats.totalRevenueKz.toLocaleString('pt-AO')} Kz
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Pagamentos confirmados</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                      <span>Serviços Concluídos</span>
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-[#101D35] mt-1">{stats.completedOrders}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Garantia ativa</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                      <span>Valores a Pagar a Técnicos</span>
                      <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-black text-purple-700 mt-1 font-mono">
                      {stats.pendingPayoutsKz.toLocaleString('pt-AO')} Kz
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Mão de obra a liquidar</div>
                  </div>
                </div>
              )}

              {/* TAB 1: ORDERS MANAGEMENT */}
              {activeTab === 'PEDIDOS' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Pesquisar por código, cliente ou telefone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium"
                      >
                        <option value="TODOS">Todos os Estados</option>
                        {Object.keys(ORDER_STATUS_MAP).map((k) => (
                          <option key={k} value={k}>
                            {ORDER_STATUS_MAP[k as OrderStatus].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-800 uppercase tracking-wider text-[10px] font-bold border-y border-slate-200">
                        <tr>
                          <th className="py-3 px-3">Código</th>
                          <th className="py-3 px-3">Cliente / Telefone</th>
                          <th className="py-3 px-3">Serviço / Província</th>
                          <th className="py-3 px-3">Estado</th>
                          <th className="py-3 px-3">Orçamento</th>
                          <th className="py-3 px-3">Profissional</th>
                          <th className="py-3 px-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">
                              Nenhum pedido encontrado.
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((o) => {
                            const statusInfo = ORDER_STATUS_MAP[o.status];
                            return (
                              <tr key={o.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3.5 px-3 font-mono font-bold text-[#101D35]">{o.code}</td>
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-slate-900">{o.customerName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">{o.customerPhone}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="font-semibold text-slate-800">{o.serviceName}</div>
                                  <div className="text-[11px] text-slate-500">{o.municipality}, {o.province}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bgColor} ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                                  {o.quote ? `${o.quote.totalAmount.toLocaleString('pt-AO')} Kz` : <span className="text-slate-400 font-normal">Pendente</span>}
                                </td>
                                <td className="py-3.5 px-3">
                                  {o.assignment ? (
                                    <div className="text-indigo-700 font-semibold">{o.assignment.technicianName}</div>
                                  ) : (
                                    <span className="text-slate-400">Não atribuído</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Quote button */}
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(o);
                                        setQuoteLabor(o.quote ? o.quote.laborFee : 20000);
                                        setQuoteMaterials(o.quote ? o.quote.materialsFee : 5000);
                                        setQuoteTravel(o.quote ? o.quote.travelFee : 3500);
                                        setQuoteDiscount(o.quote ? o.quote.discount : 0);
                                        setQuoteNotes(o.quote ? o.quote.notes || '' : '');
                                        setModalAction('QUOTE');
                                      }}
                                      className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                                      title="Criar / Alterar Orçamento"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Assign technician */}
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(o);
                                        setAssignTechId(technicians[0]?.id || '');
                                        setAssignSchedule(`${o.preferredDate} (${o.preferredTimeSlot})`);
                                        setModalAction('ASSIGN');
                                      }}
                                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                                      title="Atribuir Profissional da Equipa"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Change status */}
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(o);
                                        setModalAction('STATUS');
                                      }}
                                      className="p-1.5 rounded-lg bg-blue-50 text-[#1677E8] hover:bg-blue-100 transition"
                                      title="Mudar Estado"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Details */}
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(o);
                                        setModalAction('DETAILS');
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                                      title="Ver Detalhes Completos"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: MULTICAIXA PAYMENTS */}
              {activeTab === 'PAGAMENTOS' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#101D35]">Registo de Pagamentos Multicaixa Express</h4>
                      <p className="text-xs text-slate-500">Validação manual dos comprovativos recebidos</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {orders
                      .filter((o) => o.payment)
                      .map((o) => (
                        <div key={o.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                                {o.code}
                              </span>
                              <span className="text-sm font-bold text-slate-900">{o.customerName}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  o.payment?.status === 'CONFIRMADO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.payment?.status === 'REJEITADO'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.payment?.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Ref: <span className="font-mono font-bold text-slate-700">{o.payment?.referenceNumber}</span> | Valor: {o.payment?.amountKz.toLocaleString('pt-AO')} Kz | Tel:{' '}
                              {o.payment?.senderPhone || o.customerPhone}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {o.payment?.status === 'PENDENTE' && (
                              <>
                                <button
                                  onClick={() => handleVerifyPayment(o.id, true)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                                >
                                  Validar Pagamento
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(o.id, false)}
                                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition"
                                >
                                  Rejeitar
                                </button>
                              </>
                            )}
                            {o.payment?.proofUrl && (
                              <a
                                href={o.payment.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                              >
                                Ver Anexo
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 3: INTERNAL TECHNICIANS */}
              {activeTab === 'PROFISSIONAIS' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#101D35]">Equipa Técnica Interna AngoServ</h4>
                      <p className="text-xs text-slate-500">Cadastro e gestão de profissionais da empresa</p>
                    </div>
                    <button
                      onClick={() => setNewTechModal(true)}
                      className="px-4 py-2 bg-[#1677E8] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar Profissional</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {technicians.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{t.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'DISPONIVEL'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'EM_SERVICO'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>Especialidade: <span className="font-semibold">{t.specialty}</span></div>
                          <div>Província: <span className="font-semibold">{t.province}</span></div>
                          <div>Contacto: <span className="font-mono">{t.phone}</span></div>
                          <div>Serviços Realizados: <span className="font-bold">{t.totalCompletedJobs}</span></div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-slate-400">A Liquidar:</div>
                            <div className="text-xs font-bold text-purple-700 font-mono">
                              {t.pendingPayoutKz.toLocaleString('pt-AO')} Kz
                            </div>
                          </div>
                          {t.pendingPayoutKz > 0 && (
                            <button
                              onClick={() => handlePayoutTech(t.id)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold"
                            >
                              Liquidar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ZONES & COVERAGE */}
              {activeTab === 'ZONAS' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#101D35]">Taxas de Deslocação e Zonas de Atendimento</h4>
                    <p className="text-xs text-slate-500">Configuração das 18 províncias e municípios de Angola</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {zones.map((z) => (
                      <div key={z.province} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#101D35]">{z.province}</span>
                          <span className="text-xs font-mono font-bold text-blue-600">
                            Base: {z.baseTravelFeeKz.toLocaleString('pt-AO')} Kz
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Municípios atendidos: {z.municipalities.map((m) => m.name.split(' ')[0]).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: FINANCES & REPORTS */}
              {activeTab === 'FINANCAS' && stats && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
                  <div>
                    <h4 className="text-base font-bold text-[#101D35]">Relatório Financeiro & Desempenho</h4>
                    <p className="text-xs text-slate-500">Balanço das receitas e despesas operacionais da AngoServ</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-xs text-emerald-800 font-bold uppercase">Receitas Brutas (Kz)</div>
                      <div className="text-3xl font-black text-emerald-900 mt-2 font-mono">
                        {stats.totalRevenueKz.toLocaleString('pt-AO')} Kz
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">Transações confirmadas por Multicaixa</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
                      <div className="text-xs text-purple-800 font-bold uppercase">Pagamentos a Técnicos (Kz)</div>
                      <div className="text-3xl font-black text-purple-900 mt-2 font-mono">
                        {stats.pendingPayoutsKz.toLocaleString('pt-AO')} Kz
                      </div>
                      <p className="text-xs text-purple-700 mt-1">Mão de obra contratada da equipa</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                      <div className="text-xs text-blue-800 font-bold uppercase">Margem Operacional Líquida</div>
                      <div className="text-3xl font-black text-[#1677E8] mt-2 font-mono">
                        {Math.max(0, stats.totalRevenueKz - stats.pendingPayoutsKz).toLocaleString('pt-AO')} Kz
                      </div>
                      <p className="text-xs text-blue-700 mt-1">Saldo retido da empresa AngoServ</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: CREATE / EDIT QUOTE */}
        {modalAction === 'QUOTE' && selectedOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#101D35]">Emitir Orçamento: {selectedOrder.code}</h4>
                <button onClick={() => setModalAction(null)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuote} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mão de Obra (Kz)</label>
                  <input
                    type="number"
                    value={quoteLabor}
                    onChange={(e) => setQuoteLabor(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Materiais / Insumos (Kz)</label>
                  <input
                    type="number"
                    value={quoteMaterials}
                    onChange={(e) => setQuoteMaterials(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taxa de Deslocação (Kz)</label>
                  <input
                    type="number"
                    value={quoteTravel}
                    onChange={(e) => setQuoteTravel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desconto Comercial (Kz)</label>
                  <input
                    type="number"
                    value={quoteDiscount}
                    onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between font-bold text-sm">
                  <span>TOTAL FINAL:</span>
                  <span className="font-mono text-[#1677E8]">
                    {(quoteLabor + quoteMaterials + quoteTravel - quoteDiscount).toLocaleString('pt-AO')} Kz
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notas / Observações do Perito</label>
                  <input
                    type="text"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Ex: Inclui primário anti-humidade..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1677E8] text-white font-bold"
                  >
                    Enviar Orçamento ao Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGN TECHNICIAN */}
        {modalAction === 'ASSIGN' && selectedOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#101D35]">Atribuir Profissional: {selectedOrder.code}</h4>
                <button onClick={() => setModalAction(null)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAssign} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profissional da Equipa AngoServ</label>
                  <select
                    value={assignTechId}
                    onChange={(e) => setAssignTechId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.specialty} ({t.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Marcado</label>
                  <input
                    type="text"
                    value={assignSchedule}
                    onChange={(e) => setAssignSchedule(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Remuneração do Profissional (Kz)</label>
                  <input
                    type="number"
                    value={assignPayoutKz}
                    onChange={(e) => setAssignPayoutKz(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                  >
                    Confirmar Atribuição
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHANGE STATUS */}
        {modalAction === 'STATUS' && selectedOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#101D35]">Alterar Estado: {selectedOrder.code}</h4>
                <button onClick={() => setModalAction(null)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {Object.keys(ORDER_STATUS_MAP).map((k) => {
                  const info = ORDER_STATUS_MAP[k as OrderStatus];
                  const isCurrent = selectedOrder.status === k;
                  return (
                    <button
                      key={k}
                      onClick={() => handleUpdateStatus(selectedOrder.id, k as OrderStatus)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                        isCurrent
                          ? 'bg-[#101D35] text-white'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span>{info.label}</span>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ORDER FULL DETAILS */}
        {modalAction === 'DETAILS' && selectedOrder && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-base text-[#101D35]">Detalhes do Pedido {selectedOrder.code}</h4>
                <button onClick={() => setModalAction(null)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div><span className="font-bold text-slate-700">Cliente:</span> {selectedOrder.customerName}</div>
                <div><span className="font-bold text-slate-700">Telefone:</span> {selectedOrder.customerPhone}</div>
                <div><span className="font-bold text-slate-700">Email:</span> {selectedOrder.customerEmail || 'Não informado'}</div>
                <div><span className="font-bold text-slate-700">Serviço:</span> {selectedOrder.serviceName}</div>
                <div><span className="font-bold text-slate-700">Localização:</span> {selectedOrder.address}, {selectedOrder.neighborhood}, {selectedOrder.municipality}, {selectedOrder.province}</div>
                <div><span className="font-bold text-slate-700">Data Preferencial:</span> {selectedOrder.preferredDate} ({selectedOrder.preferredTimeSlot})</div>
                <div className="bg-slate-50 p-3 rounded-xl border"><span className="font-bold text-slate-700">Descrição do Trabalho:</span><p className="mt-1">{selectedOrder.description}</p></div>
                {selectedOrder.observations && (
                  <div><span className="font-bold text-slate-700">Observações:</span> {selectedOrder.observations}</div>
                )}
                {selectedOrder.photos && selectedOrder.photos.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700">Fotos anexadas ({selectedOrder.photos.length}):</span>
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {selectedOrder.photos.map((p, i) => (
                        <img key={i} src={p} alt="Anexo" className="w-20 h-20 object-cover rounded-lg border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NEW TECHNICIAN */}
        {newTechModal && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-[#101D35]">Cadastrar Profissional Interno</h4>
                <button onClick={() => setNewTechModal(false)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTechnician} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone (Angola)</label>
                  <input
                    type="tel"
                    required
                    value={newTechPhone}
                    onChange={(e) => setNewTechPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Especialidade Principal</label>
                  <input
                    type="text"
                    required
                    value={newTechSpecialty}
                    onChange={(e) => setNewTechSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Província de Atuação</label>
                  <select
                    value={newTechProvince}
                    onChange={(e) => setNewTechProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Luanda">Luanda</option>
                    <option value="Benguela">Benguela</option>
                    <option value="Huambo">Huambo</option>
                    <option value="Huíla">Huíla</option>
                    <option value="Cabinda">Cabinda</option>
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTechModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1677E8] text-white font-bold"
                  >
                    Gravar Profissional
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
