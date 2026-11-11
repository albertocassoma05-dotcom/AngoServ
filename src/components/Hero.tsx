import React from 'react';
import { ArrowRight, ArrowUpRight, ShieldCheck, MapPin, Check, Search, Wallet, Headphones } from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenTracker: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenTracker, onExploreServices }) => (
  <section className="hero" aria-labelledby="hero-title">
    <div className="page-width hero-layout">
      <div className="hero-copy">
        <div className="eyebrow"><span className="status-dot" /> CUIDAMOS DO QUE É SEU</div>
        <h1 id="hero-title">A sua casa merece<br />estar em <em>boas mãos.</em></h1>
        <p>Da pequena reparação à renovação do seu espaço. Encontre na AngoServ uma equipa para cuidar da sua casa ou empresa, em Angola.</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onOpenBooking}>Solicitar um serviço <ArrowUpRight size={19} /></button>
          <button className="text-button" onClick={onExploreServices}>Explorar serviços <ArrowRight size={17} /></button>
        </div>
        <div className="hero-assurance"><span><Check size={15} /> Orçamento transparente</span><span><Check size={15} /> Garantia pós-serviço</span></div>
        <button className="hero-tracker" onClick={onOpenTracker}><Search size={14} /> Já fez um pedido? <span>Acompanhe aqui</span><ArrowUpRight size={14} /></button>
      </div>
      <div className="hero-visual">
        <img className="hero-photo" src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1100&q=85" alt="Profissional a realizar uma instalação elétrica" fetchPriority="high" width="1100" height="1200" />
        <div className="photo-shade" />
        <div className="photo-location"><MapPin size={14} /> AO · ANGOLA</div>
        <div className="photo-caption"><span>O detalhe faz a diferença.</span><strong>Profissionalismo em<br />cada intervenção.</strong></div>
        <div className="assurance-card"><div className="assurance-icon"><ShieldCheck size={26} /></div><div><strong>Confiança, do início ao fim.</strong><span>Uma equipa. Um compromisso consigo.</span></div></div>
        <span className="visual-index">01 / AO</span>
      </div>
    </div>
    <div className="trust-strip"><div className="page-width trust-grid">
      <div><ShieldCheck /><span><strong>Qualidade com garantia</strong><small>Acompanhamento pós-serviço</small></span></div>
      <div><MapPin /><span><strong>Perto de si</strong><small>Atendimento em Angola</small></span></div>
      <div><Wallet /><span><strong>Pagamento simples</strong><small>Multicaixa Express</small></span></div>
      <div><Headphones /><span><strong>Apoio dedicado</strong><small>Fale com a nossa equipa</small></span></div>
    </div></div>
  </section>
);
