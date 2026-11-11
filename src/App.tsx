import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServiceCatalog } from './components/ServiceCatalog';
import { AngolaMapSection } from './components/AngolaMapSection';
import { HowItWorks } from './components/HowItWorks';
import { Testimonials } from './components/Testimonials';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { PaymentModal } from './components/PaymentModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientAccountModal } from './components/ClientAccountModal';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { ChatbotWidget } from './components/ChatbotWidget';
import { ServiceItem, Order } from './types';
import { SERVICES, INITIAL_ORDERS, INITIAL_TECHNICIANS, ANGOLA_PROVINCES } from './data/mockData';
import { seedFirestoreIfEmpty } from './lib/firebase';

export default function App() {
  // Modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ServiceItem | null>(null);
  const [preselectedProvince, setPreselectedProvince] = useState<string>('Luanda');

  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceItem | null>(null);

  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackingOrderCode, setTrackingOrderCode] = useState<string | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Google Maps Quota state
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    // Seed initial Firestore collections if empty
    seedFirestoreIfEmpty(INITIAL_ORDERS, INITIAL_TECHNICIANS, ANGOLA_PROVINCES).catch(() => {});

    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Service Selection Handlers
  const handleSelectService = (service: ServiceItem) => {
    setSelectedServiceForBooking(service);
    setIsBookingOpen(true);
  };

  const handleOpenDetails = (service: ServiceItem) => {
    setSelectedServiceDetail(service);
  };

  const handleBookFromDetails = (service: ServiceItem) => {
    setSelectedServiceDetail(null);
    setSelectedServiceForBooking(service);
    setIsBookingOpen(true);
  };

  // Open booking from map section for a specific province
  const handleOpenBookingWithProvince = (provinceName?: string) => {
    if (provinceName) setPreselectedProvince(provinceName);
    setIsBookingOpen(true);
  };

  // Order created callback
  const handleOrderCreated = (code: string) => {
    setTrackingOrderCode(code);
  };

  // Track order callback
  const handleTrackOrder = (code: string) => {
    setTrackingOrderCode(code);
    setIsTrackerOpen(true);
  };

  // Open payment modal
  const handleOpenPayment = (order: Order) => {
    setPaymentOrder(order);
    setIsPaymentOpen(true);
  };

  const handlePaymentSubmitted = (updatedOrder: Order) => {
    setPaymentOrder(updatedOrder);
    setTrackingOrderCode(updatedOrder.code);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Google Maps Platform Quota Banner (Case A Demo Key requirement) */}
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        onOpenBooking={() => {
          setSelectedServiceForBooking(null);
          setIsBookingOpen(true);
        }}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onSelectServiceTab={() => {
          const el = document.getElementById('servicos');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Hero Section */}
      <Hero
        onOpenBooking={() => {
          setSelectedServiceForBooking(null);
          setIsBookingOpen(true);
        }}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onExploreServices={() => {
          const el = document.getElementById('servicos');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Popular Services 8-Card Catalog */}
        <ServiceCatalog
          services={SERVICES}
          onSelectService={handleSelectService}
          onOpenDetails={handleOpenDetails}
        />

        {/* How it Works Section */}
        <HowItWorks
          onOpenBooking={() => {
            setSelectedServiceForBooking(null);
            setIsBookingOpen(true);
          }}
        />

        {/* Angola Google Maps Platform Interactive Coverage */}
        <AngolaMapSection onOpenBooking={handleOpenBookingWithProvince} />

        {/* Customer Testimonials */}
        <Testimonials />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Corporate Footer */}
      <Footer
        onOpenBooking={() => {
          setSelectedServiceForBooking(null);
          setIsBookingOpen(true);
        }}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onExploreServices={() => {
          const el = document.getElementById('servicos');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Floating Gemini AI Chatbot */}
      <ChatbotWidget />

      {/* Floating WhatsApp Widget */}
      <WhatsAppWidget
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenBooking={() => setIsBookingOpen(true)}
      />

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedService={selectedServiceForBooking}
        services={SERVICES}
        preselectedProvince={preselectedProvince}
        onOrderCreated={handleOrderCreated}
        onTrackOrder={handleTrackOrder}
      />

      <ServiceDetailModal
        service={selectedServiceDetail}
        onClose={() => setSelectedServiceDetail(null)}
        onBook={handleBookFromDetails}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialOrderCode={trackingOrderCode}
        onOpenPayment={handleOpenPayment}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        order={paymentOrder}
        onPaymentSubmitted={handlePaymentSubmitted}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <ClientAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onSelectOrder={(code) => {
          setIsAccountOpen(false);
          handleTrackOrder(code);
        }}
      />
    </div>
  );
}
