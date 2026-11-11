import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../lib/mapsConfig';
import { MapPin, ShieldCheck, Clock, Phone, ChevronRight, Star } from 'lucide-react';

interface HubLocation {
  id: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  address: string;
  responseTime: string;
  activeTeams: number;
  phone: string;
  description: string;
}

const ANGOLA_HUBS: HubLocation[] = [
  {
    id: 'luanda-hq',
    name: 'Central Geral & Operacional de Luanda',
    province: 'Luanda',
    lat: -8.8390,
    lng: 13.2894,
    address: 'Rua Rainha Ginga, Edifício Kilamba, Luanda',
    responseTime: '30 a 60 min',
    activeTeams: 18,
    phone: '930 051 440',
    description: 'Sede central com piquetes de intervenção para Talatona, Maianga, Belas, Viana, Cazenga, Cacuaco, Kilamba e arredores.',
  },
  {
    id: 'benguela-hub',
    name: 'Delegação Regional de Benguela & Lobito',
    province: 'Benguela',
    lat: -12.5763,
    lng: 13.4055,
    address: 'Av. Governador Silva Carvalho, Benguela',
    responseTime: '45 a 90 min',
    activeTeams: 8,
    phone: '930 051 440',
    description: 'Equipas técnicas destacadas para residências e empresas em Benguela, Lobito, Catumbela e Baía Farta.',
  },
  {
    id: 'huambo-hub',
    name: 'Delegação do Planalto Central',
    province: 'Huambo',
    lat: -12.7761,
    lng: 15.7392,
    address: 'Av. da Independência, Cidade Alta, Huambo',
    responseTime: '45 a 90 min',
    activeTeams: 6,
    phone: '930 051 440',
    description: 'Atendimento operacional em Huambo, Caála, Bailundo, Ekunha e Longonjo com viaturas equipadas.',
  },
  {
    id: 'lubango-hub',
    name: 'Delegação Regional da Huíla',
    province: 'Huíla',
    lat: -14.9172,
    lng: 13.4925,
    address: 'Rua Dr. António Agostinho Neto, Lubango',
    responseTime: '1 a 2 horas',
    activeTeams: 5,
    phone: '930 051 440',
    description: 'Assistência técnica para Lubango, Humpata, Chibia, Matala e complexos agro-industriais.',
  },
  {
    id: 'cabinda-hub',
    name: 'Delegação Regional de Cabinda',
    province: 'Cabinda',
    lat: -5.5500,
    lng: 12.2000,
    address: 'Av. Duque de Chiazi, Cabinda',
    responseTime: '1 a 2 horas',
    activeTeams: 4,
    phone: '930 051 440',
    description: 'Atendimento técnico em Cabinda, Cacongo, Buco-Zau e Belize para habitações e estaleiros.',
  },
  {
    id: 'sumbe-hub',
    name: 'Posto Operacional Cuanza Sul',
    province: 'Cuanza Sul',
    lat: -11.2061,
    lng: 13.8437,
    address: 'Rua da Marginal, Sumbe',
    responseTime: '1 a 2 horas',
    activeTeams: 4,
    phone: '930 051 440',
    description: 'Suporte hidráulico, elétrico e obras em Sumbe, Porto Amboim e Waku Kungo.',
  },
  {
    id: 'malanje-hub',
    name: 'Posto Operacional de Malanje',
    province: 'Malanje',
    lat: -9.5400,
    lng: 16.3400,
    address: 'Rua Direita de Malanje, Centro',
    responseTime: '1 a 2 horas',
    activeTeams: 3,
    phone: '930 051 440',
    description: 'Serviços de manutenção e higienização para clientes particulares e instituições públicas.',
  },
];

interface AngolaMapSectionProps {
  onSelectProvince?: (province: string) => void;
  onOpenBooking?: (province?: string) => void;
}

export const AngolaMapSection: React.FC<AngolaMapSectionProps> = ({ onOpenBooking }) => {
  const [selectedHub, setSelectedHub] = useState<HubLocation | null>(ANGOLA_HUBS[0]);
  const [activeProvinceFilter, setActiveProvinceFilter] = useState<string>('Todas');

  const filteredHubs =
    activeProvinceFilter === 'Todas'
      ? ANGOLA_HUBS
      : ANGOLA_HUBS.filter((h) => h.province === activeProvinceFilter);

  return (
    <section id="cobertura" className="py-14 sm:py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/90 text-red-700 border border-red-200 text-xs font-bold mb-3 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Presença Nacional em Angola</span>
            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
            Cobertura Operacional em Angola
          </h2>
          <p className="mt-2.5 text-xs sm:text-base text-slate-600">
            A AngoServ dispõe de piquetes de intervenção e técnicos credenciados prontos para prestar assistência
            na sua residência, loja ou escritório em todas as capitais provinciais e municípios.
          </p>
        </div>

        {/* Province Quick Filter Pills: Touch-friendly horizontal scroll on mobile */}
        <div className="flex items-center sm:justify-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 no-scrollbar px-1">
          <button
            onClick={() => {
              setActiveProvinceFilter('Todas');
              setSelectedHub(ANGOLA_HUBS[0]);
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeProvinceFilter === 'Todas'
                ? 'bg-[#0F172A] text-white shadow-md border border-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas as Províncias (18)
          </button>
          {['Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Cuanza Sul', 'Malanje'].map((prov) => (
            <button
              key={prov}
              onClick={() => {
                setActiveProvinceFilter(prov);
                const found = ANGOLA_HUBS.find((h) => h.province === prov);
                if (found) setSelectedHub(found);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeProvinceFilter === prov
                  ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Interactive Map: cooperative touch scrolling on mobile */}
          <div className="lg:col-span-8 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition border border-slate-200 flex flex-col">
            <div className="p-3 bg-[#0F172A] text-white flex items-center justify-between text-xs px-4 border-b border-slate-800">
              <span className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                <span>Bases de Atendimento AngoServ</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">Google Maps Platform</span>
            </div>

            <div className="w-full h-[360px] sm:h-[460px] relative">
              {GOOGLE_MAPS_API_KEY ? (
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                  <Map
                    mapId="DEMO_MAP_ID"
                    defaultCenter={{ lat: -11.2027, lng: 17.8739 }}
                    defaultZoom={6}
                    gestureHandling="cooperative"
                    disableDefaultUI={false}
                    className="w-full h-full"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  >
                    {filteredHubs.map((hub) => (
                      <AdvancedMarker
                        key={hub.id}
                        position={{ lat: hub.lat, lng: hub.lng }}
                        onClick={() => setSelectedHub(hub)}
                        title={hub.name}
                      >
                        <Pin
                          background={selectedHub?.id === hub.id ? '#DC2626' : '#0F172A'}
                          glyphColor="#F59E0B"
                          borderColor="#FFFFFF"
                          scale={selectedHub?.id === hub.id ? 1.25 : 1.0}
                        />
                      </AdvancedMarker>
                    ))}

                    {selectedHub && (
                      <InfoWindow
                        position={{ lat: selectedHub.lat, lng: selectedHub.lng }}
                        onCloseClick={() => setSelectedHub(null)}
                      >
                        <div className="p-2 text-slate-800 max-w-xs font-sans">
                          <h4 className="font-bold text-sm text-[#0F172A]">{selectedHub.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{selectedHub.address}</p>
                          <div className="mt-2 text-xs flex items-center justify-between font-bold border-t pt-1 border-slate-100">
                            <span className="text-[#DC2626]">{selectedHub.activeTeams} equipas</span>
                            <span className="text-slate-700">{selectedHub.responseTime}</span>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
                  <MapPin className="w-12 h-12 text-[#DC2626] mb-3 animate-bounce" />
                  <h3 className="font-bold text-[#0F172A] text-lg">Mapa de Operações de Angola</h3>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">
                    Bases ativas da AngoServ em Luanda, Benguela, Huambo, Lubango e demais províncias.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            {selectedHub ? (
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#DC2626] uppercase tracking-wider mb-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Província de {selectedHub.province}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">{selectedHub.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedHub.address}</p>

                <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {selectedHub.description}
                </p>

                <div className="grid grid-cols-2 gap-3 my-4 sm:my-5">
                  <div className="bg-amber-500/10 border border-amber-300 p-3 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] text-amber-900 font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Tempo de Resposta</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-[#0F172A] mt-1 font-mono">{selectedHub.responseTime}</div>
                  </div>

                  <div className="bg-red-50 border border-red-200 p-3 rounded-2xl">
                    <div className="flex items-center gap-1 text-[11px] text-red-900 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>Equipas Prontas</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-red-900 mt-1 font-mono">{selectedHub.activeTeams} equipas</div>
                  </div>
                </div>

                <div className="space-y-2 mt-auto pt-2">
                  <button
                    onClick={() => onOpenBooking && onOpenBooking(selectedHub.province)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-red-600 hover:to-red-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <span>Solicitar Serviço em {selectedHub.province}</span>
                    <ChevronRight className="w-4 h-4 text-amber-300" />
                  </button>

                  <a
                    href={`https://wa.me/244930051440?text=Ol%C3%A1%20AngoServ,%20gostaria%20de%20solicitar%20atendimento%20na%20prov%C3%ADncia%20de%20${encodeURIComponent(selectedHub.province)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Linha Direta: 930 051 440</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-full">
                <MapPin className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-700">Selecione uma província no mapa</p>
                <p className="text-xs text-slate-500 mt-1">Toque num marcador para ver a base operacional.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
