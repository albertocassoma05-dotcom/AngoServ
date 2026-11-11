import React, { useState, useEffect } from 'react';
import { Order, ORDER_STATUS_MAP } from '../types';
import {
  initAuth,
  googleSignIn,
  loginWithEmailPassword,
  registerWithEmailPassword,
  sendPhoneVerificationCode,
  confirmPhoneVerificationCode,
  logoutUser,
  subscribeToOrders,
} from '../lib/firebase';
import { ConfirmationResult } from 'firebase/auth';
import {
  X,
  Mail,
  Lock,
  Phone,
  User as UserIcon,
  ArrowRight,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { ANGOLA_PROVINCES } from '../data/mockData';

interface ClientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (orderCode: string) => void;
}

type AuthTab = 'EMAIL_PASSWORD' | 'PHONE' | 'GOOGLE';
type EmailMode = 'LOGIN' | 'REGISTER';

export const ClientAccountModal: React.FC<ClientAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authTab, setAuthTab] = useState<AuthTab>('EMAIL_PASSWORD');
  const [emailMode, setEmailMode] = useState<EmailMode>('LOGIN');

  // Form states - Email/Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('Luanda');

  // Form states - Phone auth
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneUserName, setPhoneUserName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Orders
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        setErrorMessage(null);
      },
      () => {
        setCurrentUser(null);
        setUserOrders([]);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to real-time orders in Firestore when user is authenticated
  useEffect(() => {
    if (!currentUser) return;
    setIsOrdersLoading(true);

    const unsubscribe = subscribeToOrders((allOrders) => {
      const filtered = allOrders.filter(
        (o) =>
          (currentUser.email && o.customerEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser.phoneNumber && o.customerPhone.includes(currentUser.phoneNumber.replace('+244', ''))) ||
          o.customerId === currentUser.uid
      );
      setUserOrders(filtered);
      setIsOrdersLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  if (!isOpen) return null;

  // 1. Email Login & Register
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (emailMode === 'LOGIN') {
        await loginWithEmailPassword(email, password);
        setSuccessMessage('Sessão iniciada com sucesso!');
      } else {
        if (!fullName.trim()) throw new Error('Por favor insira o seu nome completo.');
        if (password.length < 6) throw new Error('A palavra-passe deve conter pelo menos 6 caracteres.');
        await registerWithEmailPassword(fullName, email, password, regPhone, selectedProvince);
        setSuccessMessage('Conta criada com sucesso na AngoServ!');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Ocorreu um erro na autenticação.';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Email ou palavra-passe incorretos. Por favor verifique.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'Este email já está registado. Tente iniciar sessão.';
      } else if (msg.includes('weak-password')) {
        msg = 'A palavra-passe é fraca. Utilize pelo menos 6 caracteres.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google Login
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      await googleSignIn();
      setSuccessMessage('Sessão iniciada com a Conta Google!');
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setErrorMessage('Não foi possível autenticar com o Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Phone SMS Auth
  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!phoneNumber.trim()) {
      setErrorMessage('Por favor digite o seu número de telemóvel angolano (ex: 930 051 440).');
      return;
    }

    setIsLoading(true);
    try {
      const confirmation = await sendPhoneVerificationCode(phoneNumber, 'recaptcha-container');
      setConfirmationResult(confirmation);
      if ((confirmation as any).demoCode) {
        setVerificationCode((confirmation as any).demoCode);
        setSuccessMessage(`Código SMS gerado: ${(confirmation as any).demoCode} (já preenchido para confirmar com 1 clique).`);
      } else {
        setSuccessMessage('Código SMS enviado com sucesso para o seu telemóvel!');
      }
    } catch (err: any) {
      console.error('Phone SMS send error:', err);
      setErrorMessage(err.message || 'Erro ao enviar código SMS. Verifique o número digitado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !verificationCode.trim()) return;

    setErrorMessage(null);
    setIsLoading(true);
    try {
      await confirmPhoneVerificationCode(confirmationResult, verificationCode, phoneUserName || 'Cliente AngoServ');
      setSuccessMessage('Número validado e sessão iniciada com sucesso!');
      setConfirmationResult(null);
    } catch (err: any) {
      console.error('Phone code confirm error:', err);
      setErrorMessage('Código de verificação incorreto ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserOrders([]);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Invisible container for phone Recaptcha */}
      <div id="recaptcha-container"></div>

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
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Área do Cliente Ango<span className="text-[#F59E0B]">Serv</span></span>
                <span className="text-[10px] bg-red-950 text-amber-300 border border-red-800 px-2 py-0.5 rounded-full font-bold">
                  Firebase
                </span>
              </h3>
              <p className="text-xs text-slate-300">Autenticação segura e acompanhamento em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-6">
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Utilizador'}
                      className="w-12 h-12 rounded-2xl border-2 border-amber-400 shadow object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DC2626] to-[#0F172A] text-white flex items-center justify-center font-bold text-lg shadow">
                      {(currentUser.displayName || currentUser.email || 'C')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <span>{currentUser.displayName || 'Cliente Registado'}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        Autenticado
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {currentUser.email || currentUser.phoneNumber || 'Conta AngoServ'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>

              {/* User orders section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Os Seus Pedidos na Base de Dados</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full">
                    {userOrders.length} {userOrders.length === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </div>

                {isOrdersLoading ? (
                  <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                    <span>A carregar pedidos do Firebase Firestore...</span>
                  </div>
                ) : userOrders.length > 0 ? (
                  <div className="space-y-2.5">
                    {userOrders.map((ord) => {
                      const statusInfo = ORDER_STATUS_MAP[ord.status] || {
                        label: ord.status,
                        color: 'text-slate-700',
                        bgColor: 'bg-slate-100 border-slate-200',
                      };
                      return (
                        <div
                          key={ord.id}
                          onClick={() => {
                            onClose();
                            onSelectOrder(ord.code);
                          }}
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition flex items-center justify-between group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                {ord.code}
                              </span>
                              <span className="text-sm font-bold text-[#0F172A]">{ord.serviceName}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {ord.neighborhood}, {ord.municipality} &bull; {ord.preferredDate}
                            </div>
                            {ord.quote && (
                              <div className="text-xs font-mono font-bold text-amber-700">
                                Orçamento: {ord.quote.totalAmount.toLocaleString('pt-AO')} Kz
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bgColor} ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-3xl p-5 border border-dashed border-slate-300">
                    Ainda não possui nenhum pedido associado a este utilizador.
                    <div className="mt-2 text-slate-400 text-[11px]">
                      Quando solicitar um serviço com o seu email ou telefone, ele aparecerá aqui automaticamente.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Unauthenticated state: Authentication Tabs */
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('EMAIL_PASSWORD');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    authTab === 'EMAIL_PASSWORD'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Email & Senha</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('PHONE');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    authTab === 'PHONE'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Número de Telefone</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('GOOGLE');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    authTab === 'GOOGLE'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              {/* Tab 1: Email & Password */}
              {authTab === 'EMAIL_PASSWORD' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-[#0F172A] uppercase">
                      {emailMode === 'LOGIN' ? 'Entrar com Email e Senha' : 'Criar Nova Conta AngoServ'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode(emailMode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                        setErrorMessage(null);
                      }}
                      className="text-xs font-bold text-[#DC2626] hover:underline"
                    >
                      {emailMode === 'LOGIN' ? 'Não tem conta? Registar-se' : 'Já tem conta? Entrar'}
                    </button>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-3.5">
                    {emailMode === 'REGISTER' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Ex: Alberto Cassoma"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                          />
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Endereço de Email (Gmail/Outro) *</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="exemplo@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        />
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Palavra-passe (Senha) *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {emailMode === 'REGISTER' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Angolano</label>
                          <input
                            type="tel"
                            placeholder="930 051 440"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Província</label>
                          <select
                            value={selectedProvince}
                            onChange={(e) => setSelectedProvince(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                          >
                            {ANGOLA_PROVINCES.map((p) => (
                              <option key={p.province} value={p.province}>
                                {p.province}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>A processar no Firebase...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4 text-amber-300" />
                          <span>{emailMode === 'LOGIN' ? 'Entrar com Senha' : 'Criar Conta no Firebase'}</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Phone Authentication */}
              {authTab === 'PHONE' && (
                <div className="space-y-4">
                  <div className="pb-1 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-[#0F172A] uppercase">
                      Autenticação por Número de Telefone
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Receba um código de confirmação por SMS no seu telemóvel angolano.
                    </p>
                  </div>

                  {!confirmationResult ? (
                    <form onSubmit={handleSendPhoneCode} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Alberto Cassoma"
                          value={phoneUserName}
                          onChange={(e) => setPhoneUserName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Número de Telemóvel Angolano *
                        </label>
                        <div className="flex gap-2">
                          <span className="px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 flex items-center">
                            +244
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="930 051 440"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Formatos suportados: 930051440 ou 923 000 000
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>A enviar código SMS...</span>
                          </>
                        ) : (
                          <>
                            <Phone className="w-4 h-4 text-slate-950" />
                            <span>Enviar Código por SMS</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Step 2: Code confirmation */
                    <form onSubmit={handleConfirmPhoneCode} className="space-y-3.5">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                        Código enviado para <strong className="font-mono">{phoneNumber}</strong>. Insira os 6 dígitos recebidos:
                      </div>

                      {confirmationResult?.demoCode && (
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-emerald-900">Código de Verificação SMS:</div>
                            <span className="font-mono font-black text-base text-emerald-800 tracking-wider">
                              {confirmationResult.demoCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVerificationCode(confirmationResult.demoCode)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                          >
                            Preenchido
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código de Verificação (6 dígitos) *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full text-center text-lg tracking-widest px-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmationResult(null)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Trocar Número
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || verificationCode.length < 6}
                          className="flex-2 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-amber-300" />
                          )}
                          <span>Confirmar Código</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 3: Google Login */}
              {authTab === 'GOOGLE' && (
                <div className="space-y-4 text-center">
                  <div className="pb-1 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-[#0F172A] uppercase">
                      Continuar com a sua Conta Google
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Acesso imediato com um clique via popup autenticado pelo Firebase.
                    </p>
                  </div>

                  <div className="py-4">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-amber-400 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                      <span>Entrar com a Conta Google</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Seus dados de sessão ficam guardados com segurança no Firebase Authentication.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Segurança garantida com Firebase Auth</span>
          </div>
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
