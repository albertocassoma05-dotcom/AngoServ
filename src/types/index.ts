export type OrderStatus =
  | 'RECEBIDO'
  | 'EM_ANALISE'
  | 'ORCAMENTO_ENVIADO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PAGAMENTO_CONFIRMADO'
  | 'CONFIRMADO'
  | 'PROFISSIONAL_ATRIBUIDO'
  | 'EM_EXECUCAO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export interface OrderStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  step: number;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusInfo> = {
  RECEBIDO: {
    label: 'Pedido recebido',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'O seu pedido foi recebido pelo sistema e aguarda triagem da nossa equipa.',
    step: 1,
  },
  EM_ANALISE: {
    label: 'Em análise',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'A equipa técnica da AngoServ está a avaliar os requisitos e a disponibilidade do serviço.',
    step: 2,
  },
  ORCAMENTO_ENVIADO: {
    label: 'Orçamento enviado',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'O orçamento formal foi emitido e aguarda a sua aprovação.',
    step: 3,
  },
  AGUARDANDO_PAGAMENTO: {
    label: 'Aguardando pagamento',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Aguardamos a confirmação do pagamento via Multicaixa Express ou transferência bancária.',
    step: 4,
  },
  PAGAMENTO_CONFIRMADO: {
    label: 'Pagamento confirmado',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    description: 'O pagamento foi validado pelo departamento financeiro da AngoServ.',
    step: 5,
  },
  CONFIRMADO: {
    label: 'Pedido confirmado',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
    description: 'O agendamento do serviço está confirmado com data e hora reservadas.',
    step: 6,
  },
  PROFISSIONAL_ATRIBUIDO: {
    label: 'Profissional atribuído',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    description: 'A equipa técnica destacada da AngoServ foi designada para o seu local.',
    step: 7,
  },
  EM_EXECUCAO: {
    label: 'Serviço em execução',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 border-blue-300',
    description: 'O serviço está a ser executado no local sob supervisão de qualidade da AngoServ.',
    step: 8,
  },
  CONCLUIDO: {
    label: 'Serviço concluído',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Serviço finalizado com sucesso com garantia de qualidade AngoServ.',
    step: 9,
  },
  CANCELADO: {
    label: 'Pedido cancelado',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    description: 'O pedido foi cancelado pelo cliente ou pela administração.',
    step: 0,
  },
};

export interface Quote {
  id: string;
  laborFee: number;
  materialsFee: number;
  travelFee: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  createdAt: string;
  validUntil: string;
}

export interface Assignment {
  technicianId: string;
  technicianName: string;
  assignedAt: string;
  scheduledTime: string;
  notes?: string;
  laborPayoutKz: number;
}

export interface PaymentDetails {
  method: 'MULTICAIXA_EXPRESS' | 'TRANSFERENCIA_BANCARIA';
  amountKz: number;
  referenceNumber: string;
  senderPhone?: string;
  proofUrl?: string;
  proofFilename?: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface Order {
  id: string;
  code: string; // Ex: AS-2026-7842
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerId?: string;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  serviceId: string;
  serviceName: string;
  description: string;
  preferredDate: string;
  preferredTimeSlot: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'SABADO';
  photos: string[];
  observations?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  quote?: Quote;
  assignment?: Assignment;
  payment?: PaymentDetails;
  rating?: {
    stars: number;
    comment: string;
    submittedAt: string;
  };
}

export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  iconName: string;
  image: string;
  priceType: 'FIXO' | 'ORCAMENTO';
  basePriceKz?: number;
  estimatedDuration: string;
  includes: string[];
  description: string;
  popular?: boolean;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  province: string;
  status: 'DISPONIVEL' | 'EM_SERVICO' | 'INATIVO';
  rating: number;
  totalCompletedJobs: number;
  pendingPayoutKz: number;
  hiredDate: string;
}

export interface ZoneConfig {
  province: string;
  active: boolean;
  baseTravelFeeKz: number;
  municipalities: {
    name: string;
    active: boolean;
    extraFeeKz: number;
  }[];
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalRevenueKz: number;
  pendingPaymentsKz: number;
  pendingPayoutsKz: number;
  activeTechnicians: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  province?: string;
  role: 'cliente' | 'admin';
  createdAt: string;
}
