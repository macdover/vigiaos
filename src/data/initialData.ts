import { Client, Technician, Product, Service, WorkOrder, Budget, CompanySettings, PlanLimits, TenantAccount } from '../types';

export const DEFAULT_MASTER_PASSWORD = 'master2026';

export const initialTenants: TenantAccount[] = [
  {
    id: 'tenant-mps-telefonia',
    name: 'MPS Telefonia & Segurança Eletrônica Ltda',
    tradeName: 'MPS Telefonia & Segurança',
    cnpj: '11.601.831/0001-35',
    ownerName: 'Administrador MPS',
    email: 'mpstelefonia@gmail.com',
    phone: '021 99723-2764',
    whatsapp: '021 99723-2764',
    address: 'Rio de Janeiro - RJ',
    plan: 'master',
    status: 'ativo',
    monthlyFee: 80.00,
    setupFeePaid: true,
    dueDateDay: 10,
    nextPaymentDate: '2026-10-10',
    subscriptionStartDate: '2026-09-14',
    adminLoginUser: 'mpstelefonia@gmail.com',
    techniciansCount: 0,
    clientsCount: 0,
    workOrdersCount: 0,
    createdAt: '2026-09-14T00:00:00.000Z',
  }
];

export const PLAN_SETUP_FEE = 150.00;

export const PLAN_CONFIGS: Record<'master' | 'pro' | 'full', PlanLimits> = {
  master: {
    tier: 'master',
    name: 'Plano Master',
    badgeColor: 'from-blue-600 to-cyan-600',
    priceMonthly: 80.00,
    setupFee: 150.00,
    maxTechnicians: 5,
    maxAdmins: 1,
    maxClients: 60,
    description: 'Ideal para pequenas empresas e instaladores autônomos com equipe de até 5 técnicos + 1 Administrador.',
    features: [
      'Até 05 Técnicos de Campo',
      '01 Administrador do Sistema',
      'Até 60 Clientes Cadastrados',
      'Abertura de O.S e Orçamentos Ilimitados',
      'Modo Técnico com Fotos e Assinatura no Dedo',
      'Logo e Dados da Empresa em Relatórios e PDF',
      'Envio de Propostas pelo WhatsApp',
      'Gestão de Produtos, Técnicos e O.S (Exclusivo ADM)'
    ]
  },
  pro: {
    tier: 'pro',
    name: 'Plano Pro',
    badgeColor: 'from-purple-600 to-indigo-600',
    priceMonthly: 180.00,
    setupFee: 150.00,
    maxTechnicians: 15,
    maxAdmins: 3,
    maxClients: 350,
    description: 'Para empresas em expansão que atendem condomínios, indústrias e comércio com frota de até 15 técnicos.',
    features: [
      'Até 15 Técnicos de Campo',
      'Até 03 Administradores',
      'Até 350 Clientes Cadastrados',
      'Tudo do Plano Master',
      'Controle de Estoque e Tabela de Serviços',
      'Laudos Técnicos e Garantias Customizadas',
      'Conversão de Orçamento em O.S com 1 Clique',
      'Suporte Prioritário via WhatsApp'
    ],
    recommended: true
  },
  full: {
    tier: 'full',
    name: 'Plano Full',
    badgeColor: 'from-emerald-500 to-teal-600',
    priceMonthly: 350.00,
    setupFee: 150.00,
    maxTechnicians: null, // Ilimitado
    maxAdmins: null,      // Ilimitado
    maxClients: null,     // Ilimitado
    description: 'Para grandes empresas de segurança e integradores com operação massiva e sem limites de técnicos ou clientes.',
    features: [
      'Funcionários / Técnicos ILIMITADOS',
      'Administradores ILIMITADOS',
      'Clientes ILIMITADOS',
      'Tudo dos Planos Anteriores',
      'White-Label Completo (Sua Marca 100%)',
      'Emissão Ilimitada de Comprovantes com Assinatura',
      'Exportação Completa de Dados',
      'Atendimento VIP Dedicado'
    ]
  }
};

export const initialCompanySettings: CompanySettings = {
  id: 'tenant-mps-telefonia',
  name: 'MPS Telefonia & Segurança Eletrônica Ltda',
  tradeName: 'MPS Telefonia & Segurança',
  cnpj: '11.601.831/0001-35',
  phone: '021 99723-2764',
  whatsapp: '021 99723-2764',
  email: 'mpstelefonia@gmail.com',
  address: 'Rio de Janeiro - RJ',
  warrantyTerms: 'Garantia de 12 meses para equipamentos novos e 90 dias para mão de obra especializada conforme CDC.',
  logoUrl: '',
  plan: 'master',
  planRenewalDate: '2026-10-10',
};

// All test data arrays initialized clean and empty
export const initialTechnicians: Technician[] = [];

export const initialClients: Client[] = [];

export const initialProducts: Product[] = [];

export const initialServices: Service[] = [];

export const initialWorkOrders: WorkOrder[] = [];

export const initialBudgets: Budget[] = [];
