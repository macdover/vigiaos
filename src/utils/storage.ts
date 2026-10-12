import { 
  Client, 
  Technician, 
  Supervisor,
  SupervisorPermissions,
  FinancialOperator,
  FinancialTransaction,
  Product, 
  Service, 
  WorkOrder, 
  Budget, 
  CompanySettings, 
  CurrentUser, 
  TenantAccount 
} from '../types';
import { 
  initialClients, 
  initialTechnicians, 
  initialProducts, 
  initialServices, 
  initialWorkOrders, 
  initialBudgets, 
  initialCompanySettings 
} from '../data/initialData';

export const STORAGE_KEYS = {
  CLIENTS: 'seguros_clients',
  TECHNICIANS: 'seguros_technicians',
  PRODUCTS: 'seguros_products',
  SERVICES: 'seguros_services',
  WORK_ORDERS: 'seguros_work_orders',
  BUDGETS: 'seguros_budgets',
  COMPANY: 'seguros_company',
  CURRENT_USER: 'seguros_current_user',
};

const CLEAN_V4_KEY = 'seguros_clean_mps_real_v4';

export function purgeTestMockRecords(): void {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(CLEAN_V4_KEY) === 'done') return;

    const MOCK_TENANT_IDS = new Set([
      'tenant-1', 
      'tenant-2', 
      'tenant-3', 
      'tenant-4', 
      'tenant-talento',
      'tenant-1789359078083',
      'tenant-default'
    ]);
    const MOCK_TECH_IDS = new Set(['tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-talento-1']);
    const MOCK_CLIENT_IDS = new Set(['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5', 'cli-6', 'cli-7', 'cli-8']);

    // Clean mock tenants
    const storedTenants = localStorage.getItem('seguros_tenants');
    if (storedTenants) {
      try {
        const parsed = JSON.parse(storedTenants);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((t: any) => 
            !MOCK_TENANT_IDS.has(t.id) && 
            !t.name?.toLowerCase().includes('talento') && 
            !t.tradeName?.toLowerCase().includes('talento') &&
            !t.email?.toLowerCase().includes('talento')
          );
          localStorage.setItem('seguros_tenants', JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // Clean current tenant if pointing to a mock or missing
    const curTenant = localStorage.getItem('seguros_current_tenant_id');
    if (!curTenant || MOCK_TENANT_IDS.has(curTenant) || curTenant === 'tenant-default') {
      localStorage.setItem('seguros_current_tenant_id', 'tenant-mps-telefonia');
    }

    // Clean mock clients
    const storedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (storedClients) {
      try {
        const parsed = JSON.parse(storedClients);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((c: any) => !MOCK_CLIENT_IDS.has(c.id));
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // Clean mock technicians
    const storedTechs = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
    if (storedTechs) {
      try {
        const parsed = JSON.parse(storedTechs);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((t: any) => !MOCK_TECH_IDS.has(t.id));
          localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // Clean mock work orders
    const storedOS = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
    if (storedOS) {
      try {
        const parsed = JSON.parse(storedOS);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((o: any) => !o.id || (!['os-1', 'os-2', 'os-3', 'os-4', 'os-5', 'os-6'].includes(o.id)));
          localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // Clean mock budgets
    const storedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (storedBudgets) {
      try {
        const parsed = JSON.parse(storedBudgets);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((b: any) => !b.id || (!['bud-1', 'bud-2', 'bud-3', 'bud-4', 'bud-5'].includes(b.id)));
          localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(cleaned));
        }
      } catch (e) {}
    }

    // Clean mock company
    const storedCompany = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (storedCompany) {
      try {
        const parsed = JSON.parse(storedCompany);
        if (
          parsed?.name?.includes('VigilantTech') || 
          parsed?.name?.includes('Talento') || 
          parsed?.tradeName?.includes('Talento') ||
          parsed?.email?.includes('talento') ||
          parsed?.cnpj === '00.000.000/0001-00' ||
          parsed?.id === 'tenant-1789359078083'
        ) {
          localStorage.removeItem(STORAGE_KEYS.COMPANY);
        }
      } catch (e) {}
    }

    // Remove obsolete test storage keys
    localStorage.removeItem('seguros_tenant_tenant-1789359078083_data');
    localStorage.removeItem('seguros_tenant_tenant-default_data');

    localStorage.setItem(CLEAN_V4_KEY, 'done');
  } catch (err) {
    console.error('Error purging test mock records:', err);
  }
}

// Automatically trigger purge before any reads
purgeTestMockRecords();

// Generic get/set with localStorage fallback to initialData
export function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error loading key ${key} from storage:`, err);
    return defaultData;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

// Initial state loaders
export function getStoredClients(): Client[] {
  return loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, initialClients);
}

export function getStoredTechnicians(): Technician[] {
  return loadFromStorage<Technician[]>(STORAGE_KEYS.TECHNICIANS, initialTechnicians);
}

export function getStoredProducts(): Product[] {
  return loadFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
}

export function getStoredServices(): Service[] {
  return loadFromStorage<Service[]>(STORAGE_KEYS.SERVICES, initialServices);
}

export function getStoredWorkOrders(): WorkOrder[] {
  return loadFromStorage<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, initialWorkOrders);
}

export function getStoredBudgets(): Budget[] {
  return loadFromStorage<Budget[]>(STORAGE_KEYS.BUDGETS, initialBudgets);
}

export function getStoredCompany(): CompanySettings {
  return loadFromStorage<CompanySettings>(STORAGE_KEYS.COMPANY, initialCompanySettings);
}

export function getStoredCurrentUser(): CurrentUser {
  return loadFromStorage<CurrentUser>(STORAGE_KEYS.CURRENT_USER, { role: 'admin' });
}

// Default Permissions for Supervisor
export const DEFAULT_SUPERVISOR_PERMISSIONS: SupervisorPermissions = {
  canChangeTechInOS: true,       // Alterar técnico do chamado
  canCreateOS: true,             // Adicionar O.S para os técnicos
  canEnterTechnicianMode: true,  // Entrar no modo do técnico
  canCreateClient: true,         // Incluir cliente novo
  canEditClient: true,           // Editar cadastro de clientes
  canDeleteClient: false,        // Excluir cliente (segurança: desativado por padrão)
  canCreateTechnician: true,     // Cadastrar técnico
  canEditTechnician: true,       // Editar técnico
  canDeleteTechnician: false,    // NUNCA PODE EXCLUIR TÉCNICO (Regra do sistema)
  canAddItemsToOS: true,         // Incluir material ou serviço nas O.S
  canManageInventory: true,      // Cadastrar produtos e serviços
  canCreateBudgets: true,        // Criar orçamentos
  canExportReports: true,        // Exportar relatórios em PDF
  canViewGPS: true,              // Ver mapa de GPS da equipe
  canAccessFinancial: false,     // Acesso ao financeiro (exclusivo do Dono e Financeiro)
};

// Multi-Tenant Isolation Data Payload
export interface TenantDataPayload {
  company: CompanySettings;
  technicians: Technician[];
  supervisors?: Supervisor[];
  financialOperators?: FinancialOperator[];
  clients: Client[];
  products: Product[];
  services: Service[];
  workOrders: WorkOrder[];
  budgets: Budget[];
  transactions?: FinancialTransaction[];
}

export const initialFinancialTransactions: FinancialTransaction[] = [
  {
    id: 'trans-rec-01',
    tenantId: 'tenant-mps-telefonia',
    type: 'receita',
    title: 'Instalação CFTV IP 8 Câmeras - Cond. Barra Prime',
    description: 'Instalação de 8 câmeras dome IP e switch PoE com configuração de acesso remoto.',
    category: 'servico_os',
    amount: 1450.00,
    dueDate: '2026-10-05',
    paymentDate: '2026-10-05',
    status: 'pago',
    paymentMethod: 'pix',
    workOrderNumber: 'OS-1001',
    clientName: 'Condomínio Residencial Barra Prime',
    technicianName: 'Rodrigo Silva',
    commissionPercent: 15,
    commissionAmount: 217.50,
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'trans-rec-02',
    tenantId: 'tenant-mps-telefonia',
    type: 'receita',
    title: 'Manutenção de Cerca Elétrica & Central de Choque',
    description: 'Troca de isoladores e esticadores da cerca elétrica perimetral.',
    category: 'servico_os',
    amount: 580.00,
    dueDate: '2026-10-07',
    paymentDate: '2026-10-07',
    status: 'pago',
    paymentMethod: 'cartao_credito',
    workOrderNumber: 'OS-1002',
    clientName: 'Dra. Carla Menezes',
    technicianName: 'Lucas Ferreira',
    commissionPercent: 15,
    commissionAmount: 87.00,
    createdAt: '2026-10-06T14:30:00Z',
  },
  {
    id: 'trans-rec-03',
    tenantId: 'tenant-mps-telefonia',
    type: 'receita',
    title: 'Atendimento Avulso: Configuração de Interfone Residencial',
    description: 'Visita técnica avulsa para reparo de fiação do interfone e fechadura eletroímã.',
    category: 'visita_avulsa',
    amount: 220.00,
    dueDate: '2026-10-08',
    paymentDate: '2026-10-08',
    status: 'pago',
    paymentMethod: 'pix',
    isAvulso: true,
    avulsoClientInfo: {
      name: 'Marcos Vinícius (Visita Avulsa)',
      phone: '(21) 98112-3344',
      address: 'Rua das Laranjeiras, 142 - Rio de Janeiro',
    },
    technicianName: 'Rodrigo Silva',
    commissionPercent: 20,
    commissionAmount: 44.00,
    createdAt: '2026-10-08T09:00:00Z',
  },
  {
    id: 'trans-rec-04',
    tenantId: 'tenant-mps-telefonia',
    type: 'receita',
    title: 'Contrato Mensal de Manutenção Preventiva CFTV',
    description: 'Mensalidade de manutenção preventiva e suporte de segurança patrimonial.',
    category: 'servico_os',
    amount: 1200.00,
    dueDate: '2026-10-15',
    status: 'pendente',
    paymentMethod: 'boleto',
    clientName: 'Centro Empresarial Botafogo',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'trans-rec-05',
    tenantId: 'tenant-mps-telefonia',
    type: 'receita',
    title: 'Atendimento Avulso: Troca de Conectores BNC e Fonte 12V',
    description: 'Atendimento avulso emergencial para restabelecimento de sinal de câmeras.',
    category: 'visita_avulsa',
    amount: 350.00,
    dueDate: '2026-10-12',
    status: 'pendente',
    paymentMethod: 'pix',
    isAvulso: true,
    avulsoClientInfo: {
      name: 'Padaria e Confeitaria Imperial',
      phone: '(21) 99876-5432',
      address: 'Av. Nossa Senhora de Copacabana, 520',
    },
    createdAt: '2026-10-08T16:00:00Z',
  },
  {
    id: 'trans-desp-01',
    tenantId: 'tenant-mps-telefonia',
    type: 'despesa',
    title: 'Compra de Cabos UTP Cat5e e Conectores RJ45',
    description: 'Bobina de 305m cabo de rede Homologado Anatel para instalações.',
    category: 'pecas_fornecedores',
    amount: 380.00,
    dueDate: '2026-10-02',
    paymentDate: '2026-10-02',
    status: 'pago',
    paymentMethod: 'pix',
    supplierName: 'Distribuidora Rio Segurança Eletrônica',
    createdAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'trans-desp-02',
    tenantId: 'tenant-mps-telefonia',
    type: 'despesa',
    title: 'Combustível Frota Técnica (Motos / Carro de Campo)',
    description: 'Abastecimento semanal para deslocamento da equipe técnica aos chamados.',
    category: 'combustivel',
    amount: 250.00,
    dueDate: '2026-10-06',
    paymentDate: '2026-10-06',
    status: 'pago',
    paymentMethod: 'cartao_debito',
    supplierName: 'Posto Shell Ipiranga',
    createdAt: '2026-10-06T08:00:00Z',
  },
  {
    id: 'trans-desp-03',
    tenantId: 'tenant-mps-telefonia',
    type: 'despesa',
    title: 'Pagamento de Comissões O.S - Rodrigo Silva',
    description: 'Comissão referente a serviços concluídos na semana anterior.',
    category: 'comissao_tecnico',
    amount: 261.50,
    dueDate: '2026-10-06',
    paymentDate: '2026-10-06',
    status: 'pago',
    paymentMethod: 'pix',
    technicianName: 'Rodrigo Silva',
    createdAt: '2026-10-06T17:00:00Z',
  },
  {
    id: 'trans-desp-04',
    tenantId: 'tenant-mps-telefonia',
    type: 'despesa',
    title: 'Fornecedor Intelbras: Câmeras Dome e Fontes Colmeia',
    description: 'Fatura de peças a prazo para estoque técnico.',
    category: 'pecas_fornecedores',
    amount: 680.00,
    dueDate: '2026-10-20',
    status: 'pendente',
    paymentMethod: 'boleto',
    supplierName: 'Distribuidora Intelbras RJ',
    createdAt: '2026-10-05T09:00:00Z',
  },
];

export const initialFinancialOperators: FinancialOperator[] = [
  {
    id: 'fin-op-1',
    tenantId: 'tenant-mps-telefonia',
    name: 'Juliana Costa (Financeiro)',
    email: 'financeiro@mpstelefonia.com.br',
    phone: '(21) 99887-1122',
    password: '123',
    active: true,
    avatarColor: 'from-emerald-600 to-teal-600',
    canManagePayables: true,
    canManageReceivables: true,
    canIssueBoletosPix: true,
    canViewDRE: true,
    canManageCommissions: true,
    createdAt: '2026-09-20T10:00:00Z',
  }
];

export function getTenantStorageKey(tenantId: string): string {
  return `seguros_tenant_${tenantId}_data`;
}

export function loadTenantDataFromStorage(tenantId: string, tenantMeta?: TenantAccount): TenantDataPayload {
  const isMps = tenantId === 'tenant-mps-telefonia' || (!tenantId && !tenantMeta) || tenantId === 'tenant-default';
  const effectiveId = (tenantId && tenantId !== 'tenant-1789359078083' && tenantId !== 'tenant-default')
    ? tenantId
    : (tenantMeta?.id ?? 'tenant-mps-telefonia');

  const defaultCompany: CompanySettings = {
    id: effectiveId,
    name: tenantMeta?.name || (isMps ? 'MPS Telefonia & Segurança Eletrônica Ltda' : ''),
    tradeName: tenantMeta?.tradeName || tenantMeta?.name || (isMps ? 'MPS Telefonia & Segurança' : ''),
    cnpj: tenantMeta?.cnpj || (isMps ? '11.601.831/0001-35' : ''),
    phone: tenantMeta?.phone || (isMps ? '021 99723-2764' : ''),
    whatsapp: tenantMeta?.whatsapp || (isMps ? '021 99723-2764' : ''),
    email: tenantMeta?.email || (isMps ? 'mpstelefonia@gmail.com' : ''),
    address: tenantMeta?.address || (isMps ? 'Rio de Janeiro - RJ' : ''),
    warrantyTerms: 'Garantia de 12 meses para equipamentos novos e 90 dias para mão de obra especializada conforme CDC.',
    logoUrl: '',
    plan: tenantMeta?.plan || 'master',
    planRenewalDate: tenantMeta?.nextPaymentDate || '2026-10-10',
    status: tenantMeta?.status || 'ativo',
    blockedReason: tenantMeta?.blockedReason,
    pixKeyType: 'cnpj',
    pixKey: '11.601.831/0001-35',
    pixBeneficiaryName: 'MPS Telefonia e Seguranca Ltda',
    pixCity: 'Rio de Janeiro',
    bankName: 'Banco Itaú S.A. (341-7)',
    bankAgency: '0450',
    bankAccount: '12345-6',
    defaultTechnicianCommissionRate: 15,
    defaultBoletoInstructions: 'Referente a prestação de serviços técnicos de segurança eletrônica e telecomunicações.',
  };

  const defaultData: TenantDataPayload = {
    company: defaultCompany,
    technicians: [],
    supervisors: [],
    financialOperators: isMps ? initialFinancialOperators : [],
    clients: [],
    products: [],
    services: [],
    workOrders: [],
    budgets: [],
    transactions: isMps ? initialFinancialTransactions : [],
  };

  if (!effectiveId) return defaultData;

  try {
    const raw = localStorage.getItem(getTenantStorageKey(effectiveId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const isMockCompany = parsed.company?.name?.includes('Talento') || parsed.company?.tradeName?.includes('Talento');
      const companyPayload = isMockCompany ? {} : (parsed.company || {});

      const mergedCompany: CompanySettings = {
        ...defaultCompany,
        ...companyPayload,
        id: effectiveId,
      };

      const techs = Array.isArray(parsed.technicians)
        ? parsed.technicians.filter((t: any) => t && t.id && !t.id.includes('tech-talento'))
        : [];

      return {
        company: mergedCompany,
        technicians: techs,
        supervisors: Array.isArray(parsed.supervisors) ? parsed.supervisors : [],
        financialOperators: Array.isArray(parsed.financialOperators) ? parsed.financialOperators : (isMps ? initialFinancialOperators : []),
        clients: Array.isArray(parsed.clients) ? parsed.clients : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        services: Array.isArray(parsed.services) ? parsed.services : [],
        workOrders: Array.isArray(parsed.workOrders) ? parsed.workOrders : [],
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : (isMps ? initialFinancialTransactions : []),
      };
    }
  } catch (err) {
    console.warn(`Error loading tenant data for ${effectiveId}:`, err);
  }

  // Fallback: Check if global company was saved with customized data specifically for this tenant
  const globalCompany = loadFromStorage<CompanySettings | null>(STORAGE_KEYS.COMPANY, null);
  if (globalCompany && (globalCompany.id === effectiveId || (isMps && !globalCompany.id))) {
    if (!globalCompany.name?.includes('Talento')) {
      return {
        ...defaultData,
        company: { ...defaultCompany, ...globalCompany, id: effectiveId },
      };
    }
  }

  return defaultData;
}

export function saveTenantDataToStorage(tenantId: string, data: Partial<TenantDataPayload>): void {
  if (!tenantId) return;
  try {
    const existing = loadTenantDataFromStorage(tenantId);
    const updatedCompany = data.company ? { ...existing.company, ...data.company } : existing.company;
    const updated: TenantDataPayload = {
      ...existing,
      ...data,
      company: updatedCompany,
      technicians: data.technicians !== undefined ? data.technicians : existing.technicians,
      supervisors: data.supervisors !== undefined ? data.supervisors : (existing.supervisors || []),
      financialOperators: data.financialOperators !== undefined ? data.financialOperators : (existing.financialOperators || []),
      clients: data.clients !== undefined ? data.clients : existing.clients,
      products: data.products !== undefined ? data.products : existing.products,
      services: data.services !== undefined ? data.services : existing.services,
      workOrders: data.workOrders !== undefined ? data.workOrders : existing.workOrders,
      budgets: data.budgets !== undefined ? data.budgets : existing.budgets,
      transactions: data.transactions !== undefined ? data.transactions : (existing.transactions || []),
    };
    localStorage.setItem(getTenantStorageKey(tenantId), JSON.stringify(updated));
    if (data.company) {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany));
    }
  } catch (err) {
    console.error(`Error saving tenant data for ${tenantId}:`, err);
  }
}

// Formatters
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeBR(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Helper to compress images on upload/capture for fast mobile experience & localStorage quota safety
export async function compressImage(file: File, maxDimension = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Erro ao processar imagem.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

// WhatsApp generator
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const brazilianPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${brazilianPhone}?text=${encodeURIComponent(text)}`;
}

// Generates next sequence number
export function getNextOSNumber(existing: WorkOrder[]): string {
  const year = new Date().getFullYear();
  const nextCount = existing.length + 1;
  const padded = String(nextCount).padStart(4, '0');
  return `OS-${year}-${padded}`;
}

export function getNextBudgetNumber(existing: Budget[]): string {
  const year = new Date().getFullYear();
  const nextCount = existing.length + 1;
  const padded = String(nextCount).padStart(4, '0');
  return `ORC-${year}-${padded}`;
}

export function getStoredTenants(): any[] {
  return loadFromStorage('seguros_tenants', []);
}

export function getStoredMasterPassword(): string {
  return loadFromStorage('seguros_master_password', 'master2026');
}

export function getPriorityLabel(priority?: string): string {
  switch (priority) {
    case 'urgente':
      return 'Urgente';
    case 'alta':
      return 'Alta';
    case 'media':
      return 'Média';
    case 'baixa':
      return 'Baixa';
    default:
      return 'Média';
  }
}

