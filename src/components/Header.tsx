import React, { useState } from 'react';
import { Home, Grid, Users, Mail, Phone, User, Shield, Menu, X, Search, Calendar } from 'lucide-react';
import { COMPANY_INFO } from '../data/mockData';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onOpenAccount: () => void;
  onSelectServiceTab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBooking,
  onOpenTracker,
  onOpenAdmin,
  onOpenAccount,
  onSelectServiceTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] text-white shadow-xl border-b border-slate-800/90 w-full">
      {/* Angolan Flag Accent Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#111827]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Logo & Brand Identity */}
          <div
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer select-none group shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png"
              alt="AngoServ Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shadow-md shadow-red-950/40 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center leading-tight">
                Ango<span className="text-[#F59E0B]">Serv</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 tracking-wide uppercase">
                {COMPANY_INFO.slogan}
              </span>
            </div>
          </div>

          {/* Tablet & Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-6 text-xs lg:text-sm font-medium">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition py-1.5 px-2 rounded-lg"
            >
              <Home className="w-4 h-4 text-[#F59E0B]" />
              <span>Início</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('servicos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                if (onSelectServiceTab) onSelectServiceTab();
              }}
              className="flex items-center gap-1.5 bg-red-950/50 text-amber-300 border border-red-800/40 px-3 py-1.5 rounded-lg hover:bg-red-900/60 transition"
            >
              <Grid className="w-4 h-4 text-[#F59E0B]" />
              <span>Serviços</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('sobre-nos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition py-1.5 px-2 rounded-lg"
            >
              <Users className="w-4 h-4 text-[#F59E0B]" />
              <span>Sobre Nós</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('contactos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition py-1.5 px-2 rounded-lg"
            >
              <Mail className="w-4 h-4 text-[#F59E0B]" />
              <span>Contactos</span>
            </button>
          </nav>

          {/* Right Action Buttons (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2.5 lg:gap-4">
            {/* WhatsApp Direct Phone (Desktop) */}
            <a
              href="https://wa.me/244930051440?text=Ol%C3%A1%20AngoServ,%20gostaria%20de%20solicitar%20informa%C3%A7%C3%B5es%20sobre%20os%20servi%C3%A7os."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold text-xs lg:text-sm tracking-wide transition group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                <Phone className="w-4 h-4 fill-current" />
              </div>
              <span className="font-mono">{COMPANY_INFO.whatsapp}</span>
            </a>

            {/* Track order quick button */}
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 transition"
              title="Acompanhar estado do seu pedido"
            >
              <Search className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="hidden lg:inline">Acompanhar Pedido</span>
            </button>

            {/* Minha Conta Button */}
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 text-white px-3.5 lg:px-4 py-2 rounded-full font-bold text-xs lg:text-sm shadow-md transition transform active:scale-95"
            >
              <User className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-300" />
              <span>Minha Conta</span>
            </button>

            {/* Admin shortcut */}
            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
              title="Acesso Administrativo"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Right Quick Action & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenTracker}
              className="p-2.5 text-slate-200 hover:text-white bg-slate-800/90 active:bg-slate-700 rounded-xl flex items-center justify-center"
              title="Acompanhar Pedido"
              aria-label="Acompanhar Pedido"
            >
              <Search className="w-4 h-4 text-[#F59E0B]" />
            </button>

            <button
              onClick={onOpenBooking}
              className="px-3 py-2 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white font-bold text-xs rounded-xl shadow active:scale-95 flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Pedir</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 focus:outline-none"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (High quality touch menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1120] border-t border-slate-800 px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/70 text-slate-100 text-xs font-semibold"
            >
              <Home className="w-4 h-4 text-[#F59E0B]" />
              <span>Início</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('servicos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-red-950/50 text-amber-300 text-xs font-semibold border border-red-900/40"
            >
              <Grid className="w-4 h-4" />
              <span>Serviços</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('sobre-nos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/70 text-slate-100 text-xs font-semibold"
            >
              <Users className="w-4 h-4 text-[#F59E0B]" />
              <span>Sobre Nós</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('contactos');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/70 text-slate-100 text-xs font-semibold"
            >
              <Mail className="w-4 h-4 text-[#F59E0B]" />
              <span>Contactos</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <a
              href="https://wa.me/244930051440?text=Ol%C3%A1%20AngoServ,%20gostaria%20de%20solicitar%20informa%C3%A7%C3%B5es."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl text-xs tracking-wide shadow"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>WhatsApp: {COMPANY_INFO.whatsapp}</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] active:from-red-700 active:to-red-800 text-white font-black rounded-xl text-xs shadow-md tracking-wide"
            >
              Solicitar um Serviço ao Domicílio
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-[#F59E0B]" />
                <span>Minha Conta</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="py-2.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
