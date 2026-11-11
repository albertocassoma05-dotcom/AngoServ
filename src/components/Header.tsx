import React, { useState } from 'react';
import { ArrowUpRight, Menu, X, Search, User, Shield, Phone } from 'lucide-react';
import { COMPANY_INFO } from '../data/mockData';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onOpenAccount: () => void;
  onSelectServiceTab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBooking, onOpenTracker, onOpenAdmin, onOpenAccount, onSelectServiceTab }) => {
  const [open, setOpen] = useState(false);
  const goTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const action = (callback: () => void) => { setOpen(false); callback(); };
  return (
    <header className="site-header">
      <div className="utility-bar"><div className="page-width"><span>De Angola, para a sua casa e empresa.</span><a href={COMPANY_INFO.whatsappDirectUrl} target="_blank" rel="noopener noreferrer"><Phone size={12} /> +244 {COMPANY_INFO.whatsapp}</a></div></div>
      <div className="page-width navigation">
        <button className="brand" aria-label="AngoServ — início" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/assets/aistudio/5e3cceaa-1bcf-475e-847a-d14e7146e1ac_4101ccb8.png" alt="" width="42" height="42" />
          <span>Ango<span className="brand-accent">Serv</span><small>Serviços ao seu alcance.</small></span>
        </button>
        <nav className="desktop-navigation" aria-label="Navegação principal">
          <button onClick={() => { goTo('servicos'); onSelectServiceTab?.(); }}>Serviços</button>
          <button onClick={() => goTo('sobre-nos')}>Como funciona</button>
          <button onClick={() => goTo('contactos')}>Contactos</button>
        </nav>
        <div className="navigation-actions">
          <button className="tracker-link" onClick={onOpenTracker}><Search size={16} /><span>Acompanhar pedido</span></button>
          <button className="account-link" onClick={onOpenAccount} aria-label="Minha conta" title="Minha conta"><User size={19} /></button>
          <button className="primary-button header-booking" onClick={onOpenBooking}>Pedir serviço <ArrowUpRight size={16} /></button>
          <button className="mobile-toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navegação móvel">
        <button onClick={() => goTo('servicos')}>Explorar serviços <ArrowUpRight size={16} /></button>
        <button onClick={() => goTo('sobre-nos')}>Como funciona</button>
        <button onClick={() => goTo('contactos')}>Contactos</button>
        <button onClick={() => action(onOpenTracker)}><Search size={16} /> Acompanhar pedido</button>
        <button onClick={() => action(onOpenAccount)}><User size={16} /> Minha conta</button>
        <button onClick={() => action(onOpenAdmin)}><Shield size={16} /> Administração</button>
        <button className="primary-button" onClick={() => action(onOpenBooking)}>Solicitar um serviço <ArrowUpRight size={16} /></button>
      </nav>}
    </header>
  );
};
