export type UserRole = 'admin' | 'supervisor' | 'financial' | 'technician' | 'super_admin';

export interface SupervisorPermissions {
  canChangeTechInOS: boolean;       // Alterar técnico do chamado
  canCreateOS: boolean;             // Adicionar O.S para os técnicos
  canEnterTechnicianMode: boolean;  // Entrar no modo do técnico
  canCreateClient: boolean;         // Incluir cliente novo
  canEditClient: boolean;           // Editar cadastro de clientes
  canDeleteClient?: boolean;        // Excluir cadastro de clientes
  canCreateTechnician: boolean;     // Cadastrar técnico
  canEditTechnician?: boolean;      // Editar dados de técnicos
  // canDeleteTechnician é estritamente proibido para supervisores: exclusivo do Dono
  canDeleteTechnician?: false;
  canAddItemsToOS: boolean;         // Incluir material ou serviço nas O.S
  canManageInventory?: boolean;     // Cadastrar produtos e serviços
  canCreateBudgets?: boolean;       // Gerar e emitir orçamentos
  canExportReports?: boolean;       // Exportar relatórios em PDF
  canViewGPS?: boolean;             // Acompanhar técnicos no mapa GPS
  canAccessFinancial?: boolean;     // Acesso ao módulo financeiro (liberado pelo dono)
  canDownloadManual?: boolean;      // Permissão para baixar o manual de procedimentos
}

export interface Supervisor {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  active: boolean;
  avatarColor?: string;
  permissions: SupervisorPermissions;
  createdAt: string;
}

export interface FinancialOperator {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  active: boolean;
  avatarColor?: string;
  canManagePayables?: boolean;       // Gerenciar contas a pagar
  canManageReceivables?: boolean;    // Gerenciar contas a receber
  canIssueBoletosPix?: boolean;      // Emitir boletos e Pix
  canViewDRE?: boolean;              // Visualizar fluxo de caixa / DRE
  canManageCommissions?: boolean;    // Gerenciar comissões de técnicos
  canDownloadManual?: boolean;       // Permissão liberada pelo dono/administrador para baixar o manual
  createdAt: string;
}

export interface CurrentUser {
  role: UserRole;
  technicianId?: string;
  supervisorId?: string;
  supervisorName?: string;
  supervisorPermissions?: SupervisorPermissions;
  financialOperatorId?: string;
  financialOperatorName?: string;
  financialData?: FinancialOperator;
  isMasterAuth?: boolean;
}

export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type PaymentMethod = 'pix' | 'boleto' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'outro';
export type TransactionCategory = 
  | 'servico_os' 
  | 'visita_avulsa' 
  | 'venda_produtos' 
  | 'pecas_fornecedores' 
  | 'combustivel' 
  | 'ferramentas' 
  | 'comissao_tecnico' 
  | 'salario' 
  | 'aluguel_escritorio' 
  | 'impostos' 
  | 'internet_telefonia' 
  | 'outras_despesas' 
  | 'outras_receitas';

export interface FinancialTransaction {
  id: string;
  tenantId?: string;
  type: TransactionType;
  title: string;
  description?: string;
  category: TransactionCategory;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;

  // Origem do atendimento / Recebimento
  workOrderId?: string;
  workOrderNumber?: string;
  clientId?: string;
  clientName?: string;
  
  // Suporte a Atendimento ou Visita Avulsa (sem cliente cadastrado formalmente)
  isAvulso?: boolean;
  avulsoClientInfo?: {
    name: string;
    document?: string;
    phone?: string;
    address?: string;
  };

  // Fornecedor (para despesas)
  supplierName?: string;

  // Técnico associado (para comissão)
  technicianId?: string;
  technicianName?: string;
  commissionPercent?: number;
  commissionAmount?: number;

  // Cobrança Pix & Boleto
  pixCopiaECola?: string;
  pixQrCodeBase64?: string;
  boletoBarcode?: string;
  boletoDigitableLine?: string;
  boletoOurNumber?: string;
  receiptIssuedAt?: string;

  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  tenantId?: string;
  name: string;
  tradeName?: string; // Nome fantasia se PJ
  document: string; // CPF ou CNPJ
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  type: 'residencial' | 'comercial' | 'condominio' | 'industrial';
  notes?: string;
  createdAt: string;
}

export interface TechnicianLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string; // ISO string
  speed?: number | null;
  heading?: number | null;
  isOnline: boolean;
  address?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string; // Senha individual do técnico
  tenantId?: string; // Empresa do técnico
  specialty: string;
  avatarColor: string;
  active: boolean;
  canCreateBudgets?: boolean; // Permissão específica de orçamento
  canDownloadManual?: boolean; // Permissão liberada pelo Dono/ADM para baixar o manual técnico
  lastLocation?: TechnicianLocation; // Última localização de GPS registrada pelo celular
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'CFTV' | 'Alarmes' | 'Controle de Acesso' | 'Cerca Elétrica' | 'Redes e Cabos' | 'Acessórios' | 'Interfonia' | 'Motores';
  unit: string; // un, m, kit, rolo
  costPrice: number;
  sellPrice: number;
  stockQuantity: number;
  minStock: number;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  category: 'CFTV' | 'Alarmes' | 'Controle de Acesso' | 'Cerca Elétrica' | 'Redes' | 'Geral';
  defaultPrice: number;
  estimatedMinutes: number;
  description: string;
}

export interface OrderItem {
  id: string;
  type: 'product' | 'service';
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OSPhoto {
  id: string;
  dataUrl: string;
  caption: string;
  timestamp: string;
  stage: 'antes' | 'durante' | 'depois' | 'equipamento';
}

export interface OSSignature {
  dataUrl: string;
  signedBy: string;
  signerDocument: string;
  signedAt: string;
}

export type OSStatus = 
  | 'aberta' 
  | 'em_deslocamento' 
  | 'em_andamento' 
  | 'aguardando_peca' 
  | 'concluida' 
  | 'cancelada';

export type OSPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type OSType = 
  | 'instalacao' 
  | 'manutencao_preventiva' 
  | 'manutencao_corretiva' 
  | 'chamado_emergencial' 
  | 'vistoria';

export interface WorkOrder {
  id: string;
  tenantId?: string;
  osNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  type: OSType;
  priority: OSPriority;
  status: OSStatus;
  assignedTechnicianIds: string[];
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  description: string;
  technicalReport?: string;
  items: OrderItem[];
  laborValue: number;
  partsValue: number;
  discountValue: number;
  totalValue: number;
  photos: OSPhoto[];
  signature?: OSSignature;
  budgetIdRef?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type BudgetStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'convertido_em_os';

export interface Budget {
  id: string;
  tenantId?: string;
  budgetNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  title: string;
  items: OrderItem[];
  laborValue: number;
  partsValue: number;
  discountValue: number;
  totalValue: number;
  paymentTerms: string;
  validityDays: number;
  notes?: string;
  status: BudgetStatus;
  convertedOSId?: string;
  createdAt: string;
}

export type PlanTier = 'master' | 'pro' | 'full';

export interface PlanLimits {
  tier: PlanTier;
  name: string;
  badgeColor: string;
  priceMonthly: number;
  setupFee: number;
  maxTechnicians: number | null; // null = ilimitado
  maxAdmins: number | null;
  maxClients: number | null; // null = ilimitado
  description: string;
  features: string[];
  recommended?: boolean;
}

export type TenantStatus = 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado';

export interface TenantAccount {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address?: string;
  plan: PlanTier;
  status: TenantStatus;
  paymentCycle?: string;
  monthlyFee: number;
  setupFeePaid: boolean;
  dueDateDay: number; // Dia de vencimento (ex: dia 10)
  nextPaymentDate: string; // YYYY-MM-DD
  subscriptionStartDate: string;
  adminLoginUser?: string; // Login de acesso do ADM da empresa
  adminPassword?: string;  // Senha do ADM da empresa
  techniciansCount: number;
  clientsCount: number;
  workOrdersCount: number;
  blockedReason?: string;
  createdAt: string;
}

export interface CompanySettings {
  id?: string;
  name: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  warrantyTerms: string;
  logoUrl?: string; // Data URL / Base64 da logo
  plan: PlanTier;
  planRenewalDate?: string;
  status?: TenantStatus;
  blockedReason?: string;
  allowTechnicianBudgets?: boolean; // Habilitado pelo dono: técnicos podem emitir orçamentos
  enableGpsTracking?: boolean; // Habilitado pelo dono: monitoramento de GPS dos técnicos em campo
  // Configurações de Cobrança Pix & Boleto & Financeiro
  pixKeyType?: 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria';
  pixKey?: string;
  pixBeneficiaryName?: string;
  pixCity?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  defaultTechnicianCommissionRate?: number; // % padrão (ex: 15 ou 20%)
  defaultBoletoInstructions?: string;
}

