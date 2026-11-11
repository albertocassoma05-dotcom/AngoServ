import React, { useState } from 'react';
import { ServiceItem } from '../types';
import { ArrowUpRight, ArrowRight, Search, Clock, X, ShieldCheck } from 'lucide-react';

interface ServiceCatalogProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  onOpenDetails: (service: ServiceItem) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ services, onSelectService, onOpenDetails }) => {
  const [query, setQuery] = useState('');
  const [popularOnly, setPopularOnly] = useState(false);
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = services.filter(service => (!popularOnly || service.popular) && normalize(`${service.title} ${service.category} ${service.subtitle}`).includes(normalize(query.trim())));
  return (
    <section id="servicos" className="catalog-section">
      <div className="page-width">
        <div className="catalog-heading"><div><div className="eyebrow">O QUE PODEMOS FAZER POR SI</div><h2>O serviço certo.<br /><em>Para o seu espaço.</em></h2></div><p>Serviços para o dia a dia, com a atenção que o seu espaço merece. Escolha o que precisa e deixe o resto connosco.</p></div>
        <div className="catalog-toolbar"><div className="catalog-tabs" role="group" aria-label="Filtrar serviços"><button aria-pressed={!popularOnly} className={!popularOnly ? 'active' : ''} onClick={() => setPopularOnly(false)}>Todos os serviços <span>{services.length.toString().padStart(2, '0')}</span></button><button aria-pressed={popularOnly} className={popularOnly ? 'active' : ''} onClick={() => setPopularOnly(true)}>Mais procurados</button></div><label className="catalog-search"><Search size={17} /><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Que serviço procura?" aria-label="Pesquisar serviços" /></label></div>
        <div className="service-grid">
          {filtered.map((service, index) => <article key={service.id} className="service-card">
            <button className="service-image" onClick={() => onOpenDetails(service)} aria-label={`Ver detalhes: ${service.title}`}><img src={service.image} alt={service.title} loading="lazy" width="600" height="400" />{service.popular && <span className="popular-label">Mais procurado</span>}<span className="image-arrow"><ArrowUpRight size={20} /></span></button>
            <div className="service-body"><div className="service-category"><span>{service.category}</span><span>{(index + 1).toString().padStart(2, '0')}</span></div><h3><button onClick={() => onOpenDetails(service)}>{service.title}</button></h3><p>{service.subtitle}</p><div className="service-duration"><Clock size={13} />{service.estimatedDuration}</div><div className="service-bottom"><div className="service-price"><small>{service.priceType === 'FIXO' ? 'Preço do serviço' : 'À medida do seu projeto'}</small><strong>{service.priceType === 'FIXO' && service.basePriceKz ? <>{service.basePriceKz.toLocaleString('pt-AO')} <span>Kz</span></> : 'Sob orçamento'}</strong></div><button onClick={() => onSelectService(service)} aria-label={`Solicitar ${service.title}`}>Solicitar serviço <ArrowRight size={18} /></button><button className="service-details" onClick={() => onOpenDetails(service)}>Ver detalhes <ArrowUpRight size={15} /></button></div></div>
          </article>)}
        </div>
        {filtered.length === 0 && <div className="catalog-empty"><Search size={30} /><h3>Não encontrámos esse serviço.</h3><p>Experimente outra palavra ou consulte o catálogo completo.</p><button className="text-button" onClick={() => { setQuery(''); setPopularOnly(false); }}><X size={16} /> Limpar filtros</button></div>}
        <div className="catalog-note"><ShieldCheck aria-hidden="true" size={18} /> <span>Não sabe qual escolher? A nossa equipa ajuda a identificar o serviço certo.</span></div>
      </div>
    </section>
  );
};
