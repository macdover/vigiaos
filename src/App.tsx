import React, { useState, useEffect } from 'react';
import { 
  CurrentUser, 
  WorkOrder, 
  Budget, 
  Client, 
  Product, 
  Service, 
  Technician, 
  Supervisor,
  FinancialOperator,
  FinancialTransaction,
  CompanySettings,
  PlanTier,
  TenantAccount,
  TenantStatus,
  TechnicianLocation
} from './types';
import { 
  getStoredClients, 
  getStoredTechnicians, 
  getStoredProducts, 
  getStoredServices, 
  getStoredWorkOrders, 
  getStoredBudgets, 
  getStoredCompany, 
  getStoredCurrentUser, 
  saveToStorage, 
  loadFromStorage,
  getNextOSNumber,
  STORAGE_KEYS,
  initialFinancialTransactions,
  initialFinancialOperators
} from './utils/storage';
import { initialTenants, DEFAULT_MASTER_PASSWORD } from './data/initialData';
import { 
  apiFetchTenants, 
  apiSaveTenants, 
  apiSaveSingleTenant, 
  apiDeleteTenant, 
  apiFetchTenantData, 
  apiSaveTenantData,
  apiSaveTechnician,
  apiDeleteTechnician,
  apiSaveSupervisor,
  apiDeleteSupervisor,
  apiSaveClient,
  apiDeleteClient,
  apiSaveProduct,
  apiDeleteProduct,
  apiSaveService,
  apiDeleteService,
  apiSaveBudget,
  apiDeleteBudget,
  apiSaveWorkOrder,
  apiDeleteWorkOrder,
  apiSaveTransaction,
  apiDeleteTransaction,
  apiSaveFinancialOperator,
  apiDeleteFinancialOperator
} from './utils/apiSync';
import { 
  loadTenantDataFromStorage, 
  saveTenantDataToStorage, 
  TenantDataPayload 
} from './utils/storage';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { BudgetsView } from './components/BudgetsView';
import { ClientsView } from './components/ClientsView';
import { InventoryView } from './components/InventoryView';
import { TeamView } from './components/TeamView';
import { FinancialView } from './components/FinancialView';
import { CompanyPlanSettingsView } from './components/CompanyPlanSettingsView';
import { MasterSaasView } from './components/MasterSaasView';
import { BlockedTenantScreen } from './components/BlockedTenantScreen';
import { LoginScreen } from './components/LoginScreen';
import { UpgradeModal } from './components/UpgradeModal';
import { TechnicianFieldView } from './components/TechnicianFieldView';
import { OSModal } from './components/OSModal';
import { OSDetailModal } from './components/OSDetailModal';
import { BudgetModal } from './components/BudgetModal';
import { BillingModal } from './components/BillingModal';
import { PrintableOS } from './components/PrintableOS';
import { ChangeAdminPasswordModal } from './components/ChangeAdminPasswordModal';
import { DispatchOSModal } from './components/DispatchOSModal';

export default function App() {
  // Theme state (Modo Diurno / Claro e Modo Noturno / Escuro)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (loadFromStorage('seguros_theme', 'dark') as 'dark' | 'light') || 'dark';
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      saveToStorage('seguros_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  // Global persisted data
  const [currentUser, setCurrentUser] = useState<CurrentUser>(getStoredCurrentUser);
  const [activeTab, setActiveTab] = useState<string>(() => 
    currentUser.role === 'technician' ? 'my_os' : 'dashboard'
  );

  // SaaS Multi-Tenant & Master Owner Data
  const [tenants, setTenants] = useState<TenantAccount[]>(() => {
    const stored = loadFromStorage<TenantAccount[]>('seguros_tenants', []);
    if (!Array.isArray(stored)) return [];
    return stored.filter(t => t.id !== 'tenant-1789359078083' && !t.name?.includes('Talento'));
  });
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    const stored = loadFromStorage('seguros_current_tenant_id', '');
    if (!stored || stored === 'tenant-1789359078083' || stored === 'tenant-default') {
      return 'tenant-mps-telefonia';
    }
    return stored;
  });
  const [masterPassword, setMasterPassword] = useState<string>(() => 
    loadFromStorage('seguros_master_password', DEFAULT_MASTER_PASSWORD)
  );

  // Initialize initial tenant data scoped to current tenant
  const initialTenant = tenants.find((t) => t.id === currentTenantId) || 
                        tenants.find((t) => t.id === 'tenant-mps-telefonia') || 
                        tenants[0];
  const initialData = loadTenantDataFromStorage(initialTenant?.id || currentTenantId || 'tenant-mps-telefonia', initialTenant);

  const [clients, setClients] = useState<Client[]>(() => initialData.clients || []);
  const [technicians, setTechnicians] = useState<Technician[]>(() => initialData.technicians || []);
  const [supervisors, setSupervisors] = useState<Supervisor[]>(() => initialData.supervisors || []);
  const [financialOperators, setFinancialOperators] = useState<FinancialOperator[]>(() => initialData.financialOperators || initialFinancialOperators);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => initialData.transactions || initialFinancialTransactions);
  const [products, setProducts] = useState<Product[]>(() => initialData.products || []);
  const [services, setServices] = useState<Service[]>(() => initialData.services || []);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => initialData.workOrders || []);
  const [budgets, setBudgets] = useState<Budget[]>(() => initialData.budgets || []);
  const [company, setCompany] = useState<CompanySettings>(() => initialData.company);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadFromStorage('seguros_is_authenticated', false)
  );
  const [isMasterSession, setIsMasterSession] = useState<boolean>(() =>
    loadFromStorage('seguros_is_master_session', false)
  );

  // Upgrade modal state
  const [upgradeModalInfo, setUpgradeModalInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Admin password change modal
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  // Global dispatch OS modal state
  const [dispatchingOS, setDispatchingOS] = useState<WorkOrder | null>(null);

  // Global billing modal state (Pix & Boleto)
  const [isGlobalBillingOpen, setIsGlobalBillingOpen] = useState(false);
  const [globalBillingOS, setGlobalBillingOS] = useState<WorkOrder | null>(null);

  // Modals & Printable view states
  const [isOSModalOpen, setIsOSModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<WorkOrder | null>(null);

  const [selectedOSForDetail, setSelectedOSForDetail] = useState<WorkOrder | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [printingOS, setPrintingOS] = useState<WorkOrder | null>(null);

  // Persist Current Session Keys
  useEffect(() => {
    saveToStorage('seguros_current_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveToStorage('seguros_current_tenant_id', currentTenantId);
  }, [currentTenantId]);

  useEffect(() => {
    saveToStorage('seguros_master_password', masterPassword);
  }, [masterPassword]);

  useEffect(() => {
    saveToStorage('seguros_is_authenticated', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    saveToStorage('seguros_is_master_session', isMasterSession);
  }, [isMasterSession]);

  // Master Tenant Selection & Operational Data Loading
  const handleSelectTenant = async (tenantId: string) => {
    const cleanTenantId = (!tenantId || tenantId === 'tenant-1789359078083' || tenantId === 'tenant-default')
      ? 'tenant-mps-telefonia'
      : tenantId;

    const found = tenants.find((t) => t.id === cleanTenantId);
    setCurrentTenantId(cleanTenantId);
    saveToStorage('seguros_current_tenant_id', cleanTenantId);

    // 1. Instant local load from tenant-isolated storage
    const localData = loadTenantDataFromStorage(cleanTenantId, found);
    setCompany(localData.company);
    setTechnicians(localData.technicians);
    setSupervisors(localData.supervisors || []);
    setFinancialOperators(localData.financialOperators || []);
    setTransactions(localData.transactions || []);
    setClients(localData.clients);
    setProducts(localData.products);
    setServices(localData.services);
    setWorkOrders(localData.workOrders);
    setBudgets(localData.budgets);

    // 2. Fetch server-side tenant-isolated operational data
    try {
      const serverData = await apiFetchTenantData(cleanTenantId);
      if (serverData) {
        // Smart merge for company: prioritize non-empty local edits over stale server fields
        const effectiveCompany: CompanySettings = {
          ...serverData.company,
          ...localData.company,
          id: cleanTenantId,
        };
        // Preserve any non-empty server fields if local was empty
        if (serverData.company) {
          if (serverData.company.name && !effectiveCompany.name) effectiveCompany.name = serverData.company.name;
          if (serverData.company.tradeName && !effectiveCompany.tradeName) effectiveCompany.tradeName = serverData.company.tradeName;
          if (serverData.company.cnpj && !effectiveCompany.cnpj) effectiveCompany.cnpj = serverData.company.cnpj;
          if (serverData.company.phone && !effectiveCompany.phone) effectiveCompany.phone = serverData.company.phone;
          if (serverData.company.whatsapp && !effectiveCompany.whatsapp) effectiveCompany.whatsapp = serverData.company.whatsapp;
          if (serverData.company.email && !effectiveCompany.email) effectiveCompany.email = serverData.company.email;
          if (serverData.company.address && !effectiveCompany.address) effectiveCompany.address = serverData.company.address;
          if (serverData.company.logoUrl && !effectiveCompany.logoUrl) effectiveCompany.logoUrl = serverData.company.logoUrl;
        }

        setCompany(effectiveCompany);

        // Deduplicate and merge collections so no item is ever lost across reloads, tenant switches, or offline edits
        const mergeById = <T extends { id: string }>(serverList: T[] = [], localList: T[] = []): T[] => {
          const map = new Map<string, T>();
          (localList || []).forEach(item => { if (item && item.id) map.set(item.id, item); });
          (serverList || []).forEach(item => { if (item && item.id) map.set(item.id, item); });
          return Array.from(map.values());
        };

        const effectiveTechs = mergeById(serverData.technicians, localData.technicians);
        const effectiveSupervisors = mergeById(serverData.supervisors, localData.supervisors);
        const effectiveFinOps = mergeById(serverData.financialOperators, localData.financialOperators);
        const effectiveTrans = mergeById(serverData.transactions, localData.transactions);
        const effectiveClients = mergeById(serverData.clients, localData.clients);
        const effectiveProducts = mergeById(serverData.products, localData.products);
        const effectiveServices = mergeById(serverData.services, localData.services);
        const effectiveWorkOrders = mergeById(serverData.workOrders, localData.workOrders);
        const effectiveBudgets = mergeById(serverData.budgets, localData.budgets);

        setTechnicians(effectiveTechs);
        setSupervisors(effectiveSupervisors);
        setFinancialOperators(effectiveFinOps);
        setTransactions(effectiveTrans);
        setClients(effectiveClients);
        setProducts(effectiveProducts);
        setServices(effectiveServices);
        setWorkOrders(effectiveWorkOrders);
        setBudgets(effectiveBudgets);

        saveTenantDataToStorage(cleanTenantId, {
          company: effectiveCompany,
          technicians: effectiveTechs,
          supervisors: effectiveSupervisors,
          financialOperators: effectiveFinOps,
          transactions: effectiveTrans,
          clients: effectiveClients,
          products: effectiveProducts,
          services: effectiveServices,
          workOrders: effectiveWorkOrders,
          budgets: effectiveBudgets,
        });

        apiSaveTenantData(cleanTenantId, {
          company: effectiveCompany,
          technicians: effectiveTechs,
          supervisors: effectiveSupervisors,
          financialOperators: effectiveFinOps,
          transactions: effectiveTrans,
          clients: effectiveClients,
          products: effectiveProducts,
          services: effectiveServices,
          workOrders: effectiveWorkOrders,
          budgets: effectiveBudgets,
        });
      }
    } catch (err) {
      console.warn('Could not fetch server tenant data for', cleanTenantId, err);
    }
  };

  // Helper to persist data for the current active tenant
  const persistCurrentTenantData = (partial: Partial<TenantDataPayload>) => {
    const tenantKey = (currentTenantId && currentTenantId !== 'tenant-1789359078083' && currentTenantId !== 'tenant-default')
      ? currentTenantId
      : (company?.id || 'tenant-mps-telefonia');
    saveTenantDataToStorage(tenantKey, partial);
    apiSaveTenantData(tenantKey, partial);
  };

  // Load tenants on startup safely without overwriting server data
  useEffect(() => {
    let isMounted = true;
    apiFetchTenants().then((serverTenants) => {
      if (!isMounted) return;
      setTenants((prevLocal) => {
        const map = new Map<string, TenantAccount>();
        const isValid = (t: TenantAccount) => t && t.id && t.id !== 'tenant-1789359078083' && !t.name?.includes('Talento') && !t.tradeName?.includes('Talento');
        
        (serverTenants || []).filter(isValid).forEach((t) => map.set(t.id, t));
        (prevLocal || []).filter(isValid).forEach((t) => {
          if (!map.has(t.id)) {
            map.set(t.id, t);
            apiSaveSingleTenant(t);
          } else {
            const s = map.get(t.id)!;
            map.set(t.id, { ...s, ...t, tradeName: t.tradeName || s.tradeName, name: t.name || s.name });
          }
        });
        const merged = Array.from(map.values());
        saveToStorage('seguros_tenants', merged);

        // Auto-select tenant if needed (prioritizing current state, local storage, or MPS)
        const storedTenantId = loadFromStorage('seguros_current_tenant_id', '');
        const targetId = (currentTenantId && currentTenantId !== 'tenant-1789359078083')
          ? currentTenantId
          : (storedTenantId && storedTenantId !== 'tenant-1789359078083' ? storedTenantId : 'tenant-mps-telefonia');
        const activeId = targetId && merged.some((t) => t.id === targetId)
          ? targetId
          : (merged.find((t) => t.id === 'tenant-mps-telefonia')?.id || merged[0]?.id || 'tenant-mps-telefonia');

        if (activeId) {
          handleSelectTenant(activeId);
        }
        return merged;
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateTenantStatus = (tenantId: string, status: TenantStatus, reason?: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === tenantId) {
          const updated: TenantAccount = {
            ...t,
            status,
            blockedReason: reason || (status === 'bloqueado' ? 'Mensalidade do plano em atraso.' : undefined),
          };
          apiSaveSingleTenant(updated);
          return updated;
        }
        return t;
      })
    );

    if (currentTenantId === tenantId) {
      setCompany((prev) => {
        const updated = {
          ...prev,
          status,
          blockedReason: reason || (status === 'bloqueado' ? 'Mensalidade do plano em atraso.' : undefined),
        };
        persistCurrentTenantData({ company: updated });
        return updated;
      });
    }
  };

  const handleSaveTenant = (newTenant: TenantAccount) => {
    setTenants((prev) => {
      const exists = prev.some((t) => t.id === newTenant.id);
      const next = exists ? prev.map((t) => (t.id === newTenant.id ? newTenant : t)) : [newTenant, ...prev];
      saveToStorage('seguros_tenants', next);
      return next;
    });

    // Save to shared server atomically
    apiSaveSingleTenant(newTenant);

    // Initialize isolated container for this tenant
    const initialPayload: TenantDataPayload = {
      company: {
        id: newTenant.id,
        name: newTenant.name,
        tradeName: newTenant.tradeName || newTenant.name,
        cnpj: newTenant.cnpj || '',
        phone: newTenant.phone || '',
        whatsapp: newTenant.whatsapp || '',
        email: newTenant.email || '',
        address: newTenant.address || '',
        warrantyTerms: 'Garantia de 12 meses para equipamentos novos e 90 dias para mão de obra especializada conforme CDC.',
        logoUrl: '',
        plan: newTenant.plan,
        planRenewalDate: newTenant.nextPaymentDate,
        status: newTenant.status,
        blockedReason: newTenant.blockedReason,
      },
      technicians: [],
      clients: [],
      products: [],
      services: [],
      workOrders: [],
      budgets: [],
    };

    saveTenantDataToStorage(newTenant.id, initialPayload);
    apiSaveTenantData(newTenant.id, initialPayload);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    // 1. Delete permanently from server storage
    await apiDeleteTenant(tenantId);

    // 2. Clear isolated local storage for this tenant
    localStorage.removeItem(`seguros_tenant_${tenantId}_data`);

    // 3. Update state and local storage immediately
    const remaining = tenants.filter((t) => t.id !== tenantId);
    setTenants(remaining);
    saveToStorage('seguros_tenants', remaining);

    // 4. Re-route if the deleted company was active
    if (currentTenantId === tenantId) {
      if (remaining.length > 0) {
        handleSelectTenant(remaining[0].id);
      } else {
        setCurrentTenantId('');
      }
    }
  };

  const handleUpdateAdminPassword = async (newPassword: string, newEmail?: string) => {
    const updatedTenants = tenants.map((t) => {
      if (t.id === currentTenantId) {
        const updated: TenantAccount = {
          ...t,
          adminPassword: newPassword,
          ...(newEmail ? { adminLoginUser: newEmail, email: newEmail } : {}),
        };
        apiSaveSingleTenant(updated);
        return updated;
      }
      return t;
    });

    setTenants(updatedTenants);
    saveToStorage('seguros_tenants', updatedTenants);

    if (newEmail) {
      setCompany((prev) => {
        const updated = { ...prev, email: newEmail };
        persistCurrentTenantData({ company: updated });
        return updated;
      });
    }
  };

  const handleChangeMasterPassword = (newPass: string) => {
    setMasterPassword(newPass);
  };

  // Login & Logout Handlers
  const handleLoginSuccess = (
    tenant: TenantAccount, 
    role: 'admin' | 'supervisor' | 'financial' | 'technician', 
    techId?: string,
    supervisorData?: Supervisor,
    financialData?: FinancialOperator
  ) => {
    // Switch to this tenant
    handleSelectTenant(tenant.id);
    
    // Set user role
    let newUser: CurrentUser;
    if (role === 'admin') {
      newUser = { role: 'admin' };
    } else if (role === 'supervisor') {
      newUser = {
        role: 'supervisor',
        supervisorId: supervisorData?.id,
        supervisorName: supervisorData?.name,
        supervisorPermissions: supervisorData?.permissions,
      };
    } else if (role === 'financial') {
      newUser = {
        role: 'financial',
        financialOperatorId: financialData?.id,
        financialOperatorName: financialData?.name,
        financialData: financialData,
      };
    } else {
      newUser = { role: 'technician', technicianId: techId || technicians[0]?.id };
    }
    
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsMasterSession(false);
    
    if (role === 'technician') {
      setActiveTab('my_os');
    } else if (role === 'financial') {
      setActiveTab('financial');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleOpenMasterDirect = () => {
    setIsAuthenticated(true);
    setIsMasterSession(true);
    setActiveTab('master_saas');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsMasterSession(false);
    setActiveTab('dashboard');
  };

  // User & role change handler
  const handleUserChange = (newUser: CurrentUser) => {
    setCurrentUser(newUser);
    if (newUser.role === 'technician') {
      setActiveTab('my_os');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSwitchToTech = (techId: string) => {
    handleUserChange({ role: 'technician', technicianId: techId });
  };

  const handleTriggerUpgrade = (title: string, message: string) => {
    setUpgradeModalInfo({
      isOpen: true,
      title,
      message,
    });
  };

  const handleUpgradePlan = (newTier: PlanTier) => {
    const updated = {
      ...company,
      plan: newTier,
    };
    handleSaveCompany(updated);
  };

  const handleSaveCompany = (newCompany: CompanySettings) => {
    const targetTenantId = (currentTenantId && currentTenantId !== 'tenant-1789359078083' && currentTenantId !== 'tenant-default')
      ? currentTenantId
      : (company?.id || newCompany.id || 'tenant-mps-telefonia');
    const companyWithId: CompanySettings = {
      ...newCompany,
      id: targetTenantId,
    };

    // 1. Update company in React state & currentTenantId
    setCompany(companyWithId);
    setCurrentTenantId(targetTenantId);
    saveToStorage('seguros_current_tenant_id', targetTenantId);

    // 2. Persist to storage & tenant sync API
    saveTenantDataToStorage(targetTenantId, { company: companyWithId });
    saveToStorage(STORAGE_KEYS.COMPANY, companyWithId);
    apiSaveTenantData(targetTenantId, { company: companyWithId });

    // 3. Keep tenants list and master tenant meta in sync
    setTenants((prevTenants) => {
      const idx = prevTenants.findIndex((t) => t.id === targetTenantId);
      let updatedTenants: TenantAccount[];
      if (idx >= 0) {
        updatedTenants = prevTenants.map((t) =>
          t.id === targetTenantId
            ? {
                ...t,
                name: companyWithId.name || t.name,
                tradeName: companyWithId.tradeName || companyWithId.name || t.tradeName,
                cnpj: companyWithId.cnpj || t.cnpj,
                phone: companyWithId.phone || t.phone,
                whatsapp: companyWithId.whatsapp || t.whatsapp,
                email: companyWithId.email || t.email,
                address: companyWithId.address || t.address,
                plan: companyWithId.plan || t.plan,
              }
            : t
        );
      } else {
        const newTenantMeta: TenantAccount = {
          id: targetTenantId,
          name: companyWithId.name || 'MPS Telefonia & Segurança Eletrônica Ltda',
          tradeName: companyWithId.tradeName || companyWithId.name || 'MPS Telefonia & Segurança',
          cnpj: companyWithId.cnpj || '11.601.831/0001-35',
          ownerName: 'Administrador MPS',
          email: companyWithId.email || 'mpstelefonia@gmail.com',
          phone: companyWithId.phone || '021 99723-2764',
          whatsapp: companyWithId.whatsapp || '021 99723-2764',
          address: companyWithId.address || 'Rio de Janeiro - RJ',
          plan: companyWithId.plan || 'master',
          status: 'ativo',
          monthlyFee: 80,
          setupFeePaid: true,
          dueDateDay: 10,
          nextPaymentDate: companyWithId.planRenewalDate || '2026-10-10',
          subscriptionStartDate: '2026-09-14',
          adminLoginUser: companyWithId.email || 'mpstelefonia@gmail.com',
          techniciansCount: technicians.length,
          clientsCount: clients.length,
          workOrdersCount: workOrders.length,
          createdAt: new Date().toISOString(),
        };
        updatedTenants = [newTenantMeta, ...prevTenants];
      }

      saveToStorage('seguros_tenants', updatedTenants);
      const updatedTenant = updatedTenants.find((t) => t.id === targetTenantId);
      if (updatedTenant) {
        apiSaveSingleTenant(updatedTenant);
      }
      return updatedTenants;
    });
  };

  // Work Orders Handlers
  const handleSaveOS = (os: WorkOrder) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const osWithTenant: WorkOrder = {
      ...os,
      tenantId: tenantKey,
    };

    const isExisting = workOrders.some((o) => o.id === osWithTenant.id);
    const updatedOrders = isExisting
      ? workOrders.map((o) => (o.id === osWithTenant.id ? osWithTenant : o))
      : [osWithTenant, ...workOrders];

    // 1. Update React state
    setWorkOrders(updatedOrders);

    // 2. Persist locally
    saveTenantDataToStorage(tenantKey, { workOrders: updatedOrders });
    saveToStorage('seguros_work_orders', updatedOrders);

    // 3. Atomically persist to server
    apiSaveWorkOrder(tenantKey, osWithTenant);
    apiSaveTenantData(tenantKey, { workOrders: updatedOrders });
    persistCurrentTenantData({ workOrders: updatedOrders });

    if (selectedOSForDetail && selectedOSForDetail.id === os.id) {
      setSelectedOSForDetail(osWithTenant);
    }

    // Update tenant work order count
    setTenants((prevTenants) => {
      const updated = prevTenants.map((t) =>
        t.id === tenantKey ? { ...t, workOrdersCount: updatedOrders.length } : t
      );
      saveToStorage('seguros_tenants', updated);
      const cur = updated.find((t) => t.id === tenantKey);
      if (cur) apiSaveSingleTenant(cur);
      return updated;
    });
  };

  const handleUpdateOS = (updatedOS: WorkOrder) => {
    handleSaveOS(updatedOS);
    if (printingOS && printingOS.id === updatedOS.id) {
      setPrintingOS(updatedOS);
    }
  };

  const handleDeleteOS = (osId: string) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const updatedOrders = workOrders.filter((o) => o.id !== osId);

    // 1. Update React state
    setWorkOrders(updatedOrders);

    // 2. Persist locally
    saveTenantDataToStorage(tenantKey, { workOrders: updatedOrders });
    saveToStorage('seguros_work_orders', updatedOrders);

    // 3. Atomically delete on server
    apiDeleteWorkOrder(tenantKey, osId);
    apiSaveTenantData(tenantKey, { workOrders: updatedOrders });
    persistCurrentTenantData({ workOrders: updatedOrders });

    if (selectedOSForDetail && selectedOSForDetail.id === osId) {
      setSelectedOSForDetail(null);
    }

    // Update tenant work order count
    setTenants((prevTenants) => {
      const updated = prevTenants.map((t) =>
        t.id === tenantKey ? { ...t, workOrdersCount: Math.max(0, updatedOrders.length) } : t
      );
      saveToStorage('seguros_tenants', updated);
      const cur = updated.find((t) => t.id === tenantKey);
      if (cur) apiSaveSingleTenant(cur);
      return updated;
    });
  };

  // Budget Handlers
  const handleSaveBudget = (budget: Budget) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const budgetWithTenant: Budget = {
      ...budget,
      tenantId: tenantKey,
    };

    const isExisting = budgets.some((b) => b.id === budgetWithTenant.id);
    const updatedBudgets = isExisting
      ? budgets.map((b) => (b.id === budgetWithTenant.id ? budgetWithTenant : b))
      : [budgetWithTenant, ...budgets];

    // 1. Update React state
    setBudgets(updatedBudgets);

    // 2. Persist locally
    saveTenantDataToStorage(tenantKey, { budgets: updatedBudgets });
    saveToStorage('seguros_budgets', updatedBudgets);

    // 3. Atomically persist to server
    apiSaveBudget(tenantKey, budgetWithTenant);
    apiSaveTenantData(tenantKey, { budgets: updatedBudgets });
    persistCurrentTenantData({ budgets: updatedBudgets });
  };

  const handleUpdateBudget = (updated: Budget) => {
    handleSaveBudget(updated);
  };

  const handleDeleteBudget = (budgetId: string) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const updatedBudgets = budgets.filter((b) => b.id !== budgetId);

    // 1. Update React state
    setBudgets(updatedBudgets);

    // 2. Persist locally
    saveTenantDataToStorage(tenantKey, { budgets: updatedBudgets });
    saveToStorage('seguros_budgets', updatedBudgets);

    // 3. Atomically delete on server
    apiDeleteBudget(tenantKey, budgetId);
    apiSaveTenantData(tenantKey, { budgets: updatedBudgets });
    persistCurrentTenantData({ budgets: updatedBudgets });

    if (editingBudget && editingBudget.id === budgetId) {
      setEditingBudget(null);
      setIsBudgetModalOpen(false);
    }
  };

  // Convert Budget to Work Order
  const handleConvertToOS = (budget: Budget) => {
    const defaultTechId = technicians[0]?.id ? [technicians[0].id] : [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduledDate = tomorrow.toISOString().split('T')[0];

    const newOS: WorkOrder = {
      id: `os-${Date.now()}`,
      osNumber: getNextOSNumber(workOrders),
      clientId: budget.clientId,
      clientName: budget.clientName,
      clientPhone: budget.clientPhone,
      clientAddress: budget.clientAddress,
      assignedTechnicianIds: defaultTechId,
      status: 'aberta',
      priority: 'alta',
      type: 'instalacao',
      description: `[ORIGEM ORÇAMENTO ${budget.budgetNumber}] ${budget.title}`,
      scheduledDate,
      scheduledTime: '09:00',
      items: budget.items,
      laborValue: budget.laborValue,
      partsValue: budget.partsValue,
      discountValue: budget.discountValue || 0,
      totalValue: budget.totalValue,
      photos: [],
      createdAt: new Date().toISOString(),
      tenantId: currentTenantId,
    };

    // Save OS
    handleSaveOS(newOS);

    // Update Budget status
    handleUpdateBudget({
      ...budget,
      status: 'convertido_em_os',
      convertedOSId: newOS.id,
    });

    // Switch view to open and view this new OS
    setActiveTab('work_orders');
    setSelectedOSForDetail(newOS);
  };

  // Client Handlers
  const handleSaveClient = (client: Client) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const clientWithTenant: Client = {
      ...client,
      tenantId: tenantKey,
    };
    
    const isExisting = clients.some((c) => c.id === clientWithTenant.id);
    const updatedClients = isExisting
      ? clients.map((c) => (c.id === clientWithTenant.id ? clientWithTenant : c))
      : [clientWithTenant, ...clients];

    // 1. Update React state
    setClients(updatedClients);

    // 2. Persist to tenant localStorage & backup
    saveTenantDataToStorage(tenantKey, { clients: updatedClients });
    saveToStorage('seguros_clients', updatedClients);

    // 3. Atomically persist to server
    apiSaveClient(tenantKey, clientWithTenant);
    apiSaveTenantData(tenantKey, { clients: updatedClients });
    persistCurrentTenantData({ clients: updatedClients });

    // 4. Update tenant clients count accurately
    setTenants((prevTenants) => {
      const updated = prevTenants.map((t) => {
        if (t.id === tenantKey) {
          return { ...t, clientsCount: updatedClients.length };
        }
        return t;
      });
      saveToStorage('seguros_tenants', updated);
      const cur = updated.find((t) => t.id === tenantKey);
      if (cur) apiSaveSingleTenant(cur);
      return updated;
    });
  };

  const handleDeleteClient = (clientId: string) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
      return;
    }
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const updatedClients = clients.filter((c) => c.id !== clientId);

    // 1. Update React state
    setClients(updatedClients);

    // 2. Persist to storage
    saveTenantDataToStorage(tenantKey, { clients: updatedClients });
    saveToStorage('seguros_clients', updatedClients);

    // 3. Atomically delete on server
    apiDeleteClient(tenantKey, clientId);
    apiSaveTenantData(tenantKey, { clients: updatedClients });
    persistCurrentTenantData({ clients: updatedClients });

    // 4. Update count in tenants list
    setTenants((prevTenants) => {
      const updated = prevTenants.map((t) => {
        if (t.id === tenantKey) {
          return { ...t, clientsCount: Math.max(0, updatedClients.length) };
        }
        return t;
      });
      saveToStorage('seguros_tenants', updated);
      const cur = updated.find((t) => t.id === tenantKey);
      if (cur) apiSaveSingleTenant(cur);
      return updated;
    });
  };

  const handleOpenNewOSWithClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const formattedAddress = `${client.address.street}, ${client.address.number} - ${client.address.neighborhood}, ${client.address.city}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setEditingOS({
      id: `os-${Date.now()}`,
      osNumber: getNextOSNumber(workOrders),
      clientId: client.id,
      clientName: client.tradeName || client.name,
      clientPhone: client.phone,
      clientAddress: formattedAddress,
      assignedTechnicianIds: technicians[0] ? [technicians[0].id] : [],
      status: 'aberta',
      priority: 'media',
      type: 'manutencao_corretiva',
      description: '',
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: '09:00',
      items: [],
      laborValue: 0,
      partsValue: 0,
      discountValue: 0,
      totalValue: 0,
      photos: [],
      createdAt: new Date().toISOString(),
      tenantId: currentTenantId,
    });
    setIsOSModalOpen(true);
  };

  // Product Handlers
  const handleSaveProduct = (product: Product) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const isExisting = products.some((p) => p.id === product.id);
    const updatedProducts = isExisting
      ? products.map((p) => (p.id === product.id ? product : p))
      : [product, ...products];

    // 1. Update React state
    setProducts(updatedProducts);

    // 2. Save locally
    saveTenantDataToStorage(tenantKey, { products: updatedProducts });
    saveToStorage('seguros_products', updatedProducts);

    // 3. Atomically persist to server
    apiSaveProduct(tenantKey, product);
    apiSaveTenantData(tenantKey, { products: updatedProducts });
    persistCurrentTenantData({ products: updatedProducts });
  };

  const handleDeleteProduct = (productId: string) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const updatedProducts = products.filter((p) => p.id !== productId);

    // 1. Update React state
    setProducts(updatedProducts);

    // 2. Save locally
    saveTenantDataToStorage(tenantKey, { products: updatedProducts });
    saveToStorage('seguros_products', updatedProducts);

    // 3. Atomically delete on server
    apiDeleteProduct(tenantKey, productId);
    apiSaveTenantData(tenantKey, { products: updatedProducts });
    persistCurrentTenantData({ products: updatedProducts });
  };

  // Service Handlers
  const handleSaveService = (service: Service) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const isExisting = services.some((s) => s.id === service.id);
    const updatedServices = isExisting
      ? services.map((s) => (s.id === service.id ? service : s))
      : [service, ...services];

    // 1. Update React state
    setServices(updatedServices);

    // 2. Save locally
    saveTenantDataToStorage(tenantKey, { services: updatedServices });
    saveToStorage('seguros_services', updatedServices);

    // 3. Atomically persist to server
    apiSaveService(tenantKey, service);
    apiSaveTenantData(tenantKey, { services: updatedServices });
    persistCurrentTenantData({ services: updatedServices });
  };

  const handleDeleteService = (serviceId: string) => {
    const tenantKey = currentTenantId || company?.id || 'tenant-default';
    const updatedServices = services.filter((s) => s.id !== serviceId);

    // 1. Update React state
    setServices(updatedServices);

    // 2. Save locally
    saveTenantDataToStorage(tenantKey, { services: updatedServices });
    saveToStorage('seguros_services', updatedServices);

    // 3. Atomically delete on server
    apiDeleteService(tenantKey, serviceId);
    apiSaveTenantData(tenantKey, { services: updatedServices });
    persistCurrentTenantData({ services: updatedServices });
  };

  // Technician Handlers with strict Tenant Scoping
  const handleSaveTechnician = (tech: Technician) => {
    const targetTenantId = currentTenantId || company?.id || tech.tenantId || 'tenant-mps-telefonia';
    const techWithTenant: Technician = {
      ...tech,
      tenantId: targetTenantId,
    };

    // 1. Update React state
    setTechnicians((prev) => {
      const exists = prev.some((t) => t.id === techWithTenant.id);
      return exists ? prev.map((t) => (t.id === techWithTenant.id ? techWithTenant : t)) : [...prev, techWithTenant];
    });

    // 2. Build updated list directly for guaranteed persistence
    const currentList = technicians.filter((t) => t.id !== techWithTenant.id);
    const updatedList = [...currentList, techWithTenant];

    // 3. Persist to isolated localStorage immediately
    saveTenantDataToStorage(targetTenantId, { technicians: updatedList });

    // 4. Atomically persist to server database endpoint
    apiSaveTechnician(targetTenantId, techWithTenant);
    apiSaveTenantData(targetTenantId, { technicians: updatedList });

    // 5. Update technician count on tenant account
    setTenants((prevTenants) => {
      const updated = prevTenants.map((t) =>
        t.id === targetTenantId ? { ...t, techniciansCount: updatedList.length } : t
      );
      saveToStorage('seguros_tenants', updated);
      const cur = updated.find((t) => t.id === targetTenantId);
      if (cur) apiSaveSingleTenant(cur);
      return updated;
    });
  };

  const handleDeleteTechnician = (techId: string) => {
    const targetTenantId = currentTenantId || company?.id || 'tenant-mps-telefonia';
    const updatedList = technicians.filter((t) => t.id !== techId);

    // 1. Update React state
    setTechnicians(updatedList);

    // 2. Persist to isolated localStorage
    saveTenantDataToStorage(targetTenantId, { technicians: updatedList });

    // 3. Atomically delete on server
    apiDeleteTechnician(targetTenantId, techId);
    apiSaveTenantData(targetTenantId, { technicians: updatedList, allowClearTechnicians: updatedList.length === 0 });

    // 4. Update tenant count on tenant account
    setTenants((prevTenants) => {
      const updated = prevTenants.map((t) =>
        t.id === targetTenantId ? { ...t, techniciansCount: Math.max(0, updatedList.length) } : t
      );
      saveToStorage('seguros_tenants', updated);
      const cur = updated.find((t) => t.id === targetTenantId);
      if (cur) apiSaveSingleTenant(cur);
      return updated;
    });
  };

  // Supervisor Handlers with strict Tenant Scoping
  const handleSaveSupervisor = (supervisor: Supervisor) => {
    const targetTenantId = currentTenantId || company?.id || supervisor.tenantId || 'tenant-mps-telefonia';
    const supervisorWithTenant: Supervisor = {
      ...supervisor,
      tenantId: targetTenantId,
    };

    setSupervisors((prev) => {
      const exists = prev.some((s) => s.id === supervisorWithTenant.id);
      return exists ? prev.map((s) => (s.id === supervisorWithTenant.id ? supervisorWithTenant : s)) : [...prev, supervisorWithTenant];
    });

    const currentList = supervisors.filter((s) => s.id !== supervisorWithTenant.id);
    const updatedList = [...currentList, supervisorWithTenant];

    saveTenantDataToStorage(targetTenantId, { supervisors: updatedList });
    apiSaveSupervisor(targetTenantId, supervisorWithTenant);
    apiSaveTenantData(targetTenantId, { supervisors: updatedList });
  };

  const handleDeleteSupervisor = (supId: string) => {
    const targetTenantId = currentTenantId || company?.id || 'tenant-mps-telefonia';
    const updatedList = supervisors.filter((s) => s.id !== supId);

    setSupervisors(updatedList);
    saveTenantDataToStorage(targetTenantId, { supervisors: updatedList });
    apiDeleteSupervisor(targetTenantId, supId);
    apiSaveTenantData(targetTenantId, { supervisors: updatedList });
  };

  // Financial Transaction Handlers
  const handleSaveTransaction = (transaction: FinancialTransaction) => {
    const targetTenantId = currentTenantId || company?.id || transaction.tenantId || 'tenant-mps-telefonia';
    const transWithTenant: FinancialTransaction = {
      ...transaction,
      tenantId: targetTenantId,
    };

    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === transWithTenant.id);
      return exists ? prev.map((t) => (t.id === transWithTenant.id ? transWithTenant : t)) : [transWithTenant, ...prev];
    });

    const currentList = transactions.filter((t) => t.id !== transWithTenant.id);
    const updatedList = [transWithTenant, ...currentList];

    saveTenantDataToStorage(targetTenantId, { transactions: updatedList });
    apiSaveTransaction(targetTenantId, transWithTenant);
    apiSaveTenantData(targetTenantId, { transactions: updatedList });
  };

  const handleDeleteTransaction = (transId: string) => {
    const targetTenantId = currentTenantId || company?.id || 'tenant-mps-telefonia';
    const updatedList = transactions.filter((t) => t.id !== transId);

    setTransactions(updatedList);
    saveTenantDataToStorage(targetTenantId, { transactions: updatedList });
    apiDeleteTransaction(targetTenantId, transId);
    apiSaveTenantData(targetTenantId, { transactions: updatedList });
  };

  // Financial Operator Handlers
  const handleSaveFinancialOperator = (operator: FinancialOperator) => {
    const targetTenantId = currentTenantId || company?.id || operator.tenantId || 'tenant-mps-telefonia';
    const opWithTenant: FinancialOperator = {
      ...operator,
      tenantId: targetTenantId,
    };

    setFinancialOperators((prev) => {
      const exists = prev.some((o) => o.id === opWithTenant.id);
      return exists ? prev.map((o) => (o.id === opWithTenant.id ? opWithTenant : o)) : [...prev, opWithTenant];
    });

    const currentList = financialOperators.filter((o) => o.id !== opWithTenant.id);
    const updatedList = [...currentList, opWithTenant];

    saveTenantDataToStorage(targetTenantId, { financialOperators: updatedList });
    apiSaveFinancialOperator(targetTenantId, opWithTenant);
    apiSaveTenantData(targetTenantId, { financialOperators: updatedList });
  };

  const handleDeleteFinancialOperator = (opId: string) => {
    const targetTenantId = currentTenantId || company?.id || 'tenant-mps-telefonia';
    const updatedList = financialOperators.filter((o) => o.id !== opId);

    setFinancialOperators(updatedList);
    saveTenantDataToStorage(targetTenantId, { financialOperators: updatedList });
    apiDeleteFinancialOperator(targetTenantId, opId);
    apiSaveTenantData(targetTenantId, { financialOperators: updatedList });
  };

  const handleSwitchToFinancialUser = (op: FinancialOperator) => {
    setCurrentUser({
      role: 'financial',
      financialOperatorId: op.id,
      financialOperatorName: op.name,
      financialData: op,
    });
    setActiveTab('financial');
  };

  const handleUpdateTechnicianLocation = (techId: string, location: TechnicianLocation) => {
    setTechnicians((prev) =>
      prev.map((t) => (t.id === techId ? { ...t, lastLocation: location } : t))
    );
  };

  const currentTechnician = currentUser.role === 'technician'
    ? technicians.find((t) => t.id === currentUser.technicianId) || technicians[0]
    : null;

  if (!isAuthenticated) {
    return (
      <LoginScreen
        tenants={tenants}
        technicians={technicians}
        masterPassword={masterPassword}
        onLoginSuccess={handleLoginSuccess}
        onOpenMasterDirect={handleOpenMasterDirect}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden ${theme === 'light' ? 'theme-light bg-slate-100 text-slate-900' : 'theme-dark bg-slate-950 text-slate-100'} flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-150`}>
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        technicians={technicians}
        workOrders={workOrders}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        company={company}
        onLogout={handleLogout}
        isMasterLogged={isMasterSession}
        onOpenChangeAdminPassword={() => setIsAdminPasswordModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        {/* Printable OS Sheet View (Takes precedence if user requested print) */}
        {printingOS ? (
          <PrintableOS
            os={printingOS}
            company={company}
            technicians={technicians}
            onBack={() => setPrintingOS(null)}
          />
        ) : activeTab === 'master_saas' ? (
          /* SaaS Master Owner Controller (Multi-Tenancy, Master Password, Block / Delete Inadimplentes) */
          <MasterSaasView
            tenants={tenants}
            currentTenantId={currentTenantId}
            onSelectTenant={handleSelectTenant}
            onUpdateTenantStatus={handleUpdateTenantStatus}
            onSaveTenant={handleSaveTenant}
            onDeleteTenant={handleDeleteTenant}
            masterPassword={masterPassword}
            onChangeMasterPassword={handleChangeMasterPassword}
            onExitMaster={() => setActiveTab('dashboard')}
          />
        ) : (company.status === 'bloqueado' || company.status === 'inadimplente') ? (
          /* Blocked Tenant View when monthly fee is not paid */
          <BlockedTenantScreen
            company={company}
            masterPhone="19998765432"
            onOpenMasterLogin={() => setActiveTab('master_saas')}
            onSelectAnotherCompany={handleSelectTenant}
            availableTenants={tenants}
            onLogout={handleLogout}
            isMasterLogged={isMasterSession}
          />
        ) : (
          <>
            {/* Technician Mode View: Only shows their assigned OS, camera upload, finger signature, budget creation and live GPS */}
            {currentUser.role === 'technician' && currentTechnician ? (
              <TechnicianFieldView
                currentTech={currentTechnician}
                workOrders={workOrders}
                onUpdateWorkOrder={handleUpdateOS}
                company={company}
                tenantId={currentTenantId}
                budgets={budgets}
                onSaveBudget={handleSaveBudget}
                onDeleteBudget={handleDeleteBudget}
                clients={clients}
                products={products}
                services={services}
                onConvertToOS={handleConvertToOS}
                onUpdateTechnicianLocation={handleUpdateTechnicianLocation}
              />
            ) : (
              /* Administrator Views */
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    workOrders={workOrders}
                    budgets={budgets}
                    clients={clients}
                    technicians={technicians}
                    onNavigate={setActiveTab}
                    onOpenNewOS={() => {
                      setEditingOS(null);
                      setIsOSModalOpen(true);
                    }}
                    onOpenNewBudget={() => {
                      setEditingBudget(null);
                      setIsBudgetModalOpen(true);
                    }}
                    onSelectOS={(os) => setSelectedOSForDetail(os)}
                    onSwitchToTech={handleSwitchToTech}
                    company={company}
                  />
                )}

                {activeTab === 'work_orders' && (
                  <WorkOrdersView
                    workOrders={workOrders}
                    technicians={technicians}
                    currentUser={currentUser}
                    company={company}
                    onOpenNewOS={() => {
                      setEditingOS(null);
                      setIsOSModalOpen(true);
                    }}
                    onSelectOS={(os) => setSelectedOSForDetail(os)}
                    onEditOS={(os) => {
                      setEditingOS(os);
                      setIsOSModalOpen(true);
                    }}
                    onPrintOS={(os) => setPrintingOS(os)}
                    onDeleteOS={handleDeleteOS}
                    onOpenBillingModal={(os) => {
                      setGlobalBillingOS(os);
                      setIsGlobalBillingOpen(true);
                    }}
                  />
                )}

                {activeTab === 'financial' && (
                  <FinancialView
                    transactions={transactions}
                    financialOperators={financialOperators}
                    clients={clients}
                    technicians={technicians}
                    workOrders={workOrders}
                    company={company}
                    currentUser={currentUser}
                    onSaveTransaction={handleSaveTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onSaveFinancialOperator={handleSaveFinancialOperator}
                    onDeleteFinancialOperator={handleDeleteFinancialOperator}
                    onSaveCompany={handleSaveCompany}
                    onSwitchToFinancialUser={handleSwitchToFinancialUser}
                  />
                )}

                {activeTab === 'budgets' && (
                  <BudgetsView
                    budgets={budgets}
                    company={company}
                    onOpenNewBudget={() => {
                      setEditingBudget(null);
                      setIsBudgetModalOpen(true);
                    }}
                    onEditBudget={(budget) => {
                      setEditingBudget(budget);
                      setIsBudgetModalOpen(true);
                    }}
                    onConvertToOS={handleConvertToOS}
                    onUpdateBudget={handleUpdateBudget}
                    onDeleteBudget={handleDeleteBudget}
                  />
                )}

                {activeTab === 'clients' && (
                  <ClientsView
                    clients={clients}
                    workOrders={workOrders}
                    budgets={budgets}
                    currentUser={currentUser}
                    technicians={technicians}
                    onSaveClient={handleSaveClient}
                    onDeleteClient={handleDeleteClient}
                    onOpenNewOSWithClient={handleOpenNewOSWithClient}
                    company={company}
                    onTriggerUpgrade={handleTriggerUpgrade}
                  />
                )}

                {activeTab === 'inventory' && (
                  <InventoryView
                    products={products}
                    services={services}
                    currentUser={currentUser}
                    onSaveProduct={handleSaveProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onSaveService={handleSaveService}
                    onDeleteService={handleDeleteService}
                  />
                )}

                {activeTab === 'team' && (
                  <TeamView
                    technicians={technicians}
                    supervisors={supervisors}
                    financialOperators={financialOperators}
                    workOrders={workOrders}
                    currentUser={currentUser}
                    onSaveTechnician={handleSaveTechnician}
                    onDeleteTechnician={handleDeleteTechnician}
                    onSwitchToTech={handleSwitchToTech}
                    onSaveSupervisor={handleSaveSupervisor}
                    onDeleteSupervisor={handleDeleteSupervisor}
                    onSaveFinancialOperator={handleSaveFinancialOperator}
                    company={company}
                    onSaveCompany={handleSaveCompany}
                    onTriggerUpgrade={handleTriggerUpgrade}
                    currentTenant={tenants.find((t) => t.id === currentTenantId)}
                    onOpenChangeAdminPassword={() => setIsAdminPasswordModalOpen(true)}
                  />
                )}

                {activeTab === 'company_settings' && (
                  <CompanyPlanSettingsView
                    company={company}
                    technicians={technicians}
                    clients={clients}
                    onSaveCompany={handleSaveCompany}
                    onUpgradePlan={handleUpgradePlan}
                    currentTenant={tenants.find((t) => t.id === currentTenantId)}
                    onOpenChangeAdminPassword={() => setIsAdminPasswordModalOpen(true)}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      {/* Plan Upgrade Trigger Modal */}
      {upgradeModalInfo?.isOpen && (
        <UpgradeModal
          isOpen={upgradeModalInfo.isOpen}
          onClose={() => setUpgradeModalInfo(null)}
          title={upgradeModalInfo.title}
          message={upgradeModalInfo.message}
          currentPlan={company.plan || 'master'}
          onSelectPlan={(newTier) => {
            handleUpgradePlan(newTier);
            setUpgradeModalInfo(null);
          }}
        />
      )}
      {/* Create / Edit OS Modal */}
      {isOSModalOpen && (
        <OSModal
          isOpen={isOSModalOpen}
          onClose={() => {
            setIsOSModalOpen(false);
            setEditingOS(null);
          }}
          onSave={handleSaveOS}
          onSaveAndDispatch={(os) => {
            handleSaveOS(os);
            setDispatchingOS(os);
          }}
          initialData={editingOS}
          clients={clients}
          technicians={technicians}
          products={products}
          services={services}
          existingOrders={workOrders}
          currentUser={currentUser}
        />
      )}

      {/* Detailed OS Modal */}
      {selectedOSForDetail && (
        <OSDetailModal
          os={selectedOSForDetail}
          isOpen={!!selectedOSForDetail}
          currentUser={currentUser}
          company={company}
          onClose={() => setSelectedOSForDetail(null)}
          onEdit={(os) => {
            setSelectedOSForDetail(null);
            setEditingOS(os);
            setIsOSModalOpen(true);
          }}
          onPrint={(os) => {
            setSelectedOSForDetail(null);
            setPrintingOS(os);
          }}
          onOpenBillingModal={(os) => {
            setGlobalBillingOS(os);
            setIsGlobalBillingOpen(true);
          }}
          onUpdateOS={handleUpdateOS}
          onDeleteOS={handleDeleteOS}
          technicians={technicians}
        />
      )}

      {/* Create / Edit Budget Modal */}
      {isBudgetModalOpen && (
        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => {
            setIsBudgetModalOpen(false);
            setEditingBudget(null);
          }}
          onSave={handleSaveBudget}
          onDelete={handleDeleteBudget}
          initialData={editingBudget}
          clients={clients}
          products={products}
          services={services}
          existingBudgets={budgets}
        />
      )}

      {/* Change Admin Password Modal */}
      {isAdminPasswordModalOpen && (
        <ChangeAdminPasswordModal
          isOpen={isAdminPasswordModalOpen}
          onClose={() => setIsAdminPasswordModalOpen(false)}
          currentTenant={tenants.find((t) => t.id === currentTenantId)}
          company={company}
          onSavePassword={handleUpdateAdminPassword}
        />
      )}

      {/* Global Dispatch OS Modal */}
      {dispatchingOS && (
        <DispatchOSModal
          os={dispatchingOS}
          technicians={technicians}
          company={company}
          isOpen={!!dispatchingOS}
          onClose={() => setDispatchingOS(null)}
        />
      )}

      {/* Global Billing Modal (Pix & Boleto) */}
      {isGlobalBillingOpen && (
        <BillingModal
          isOpen={isGlobalBillingOpen}
          onClose={() => {
            setIsGlobalBillingOpen(false);
            setGlobalBillingOS(null);
          }}
          company={company}
          workOrder={globalBillingOS}
          clients={clients}
          technicians={technicians}
          onSaveTransaction={handleSaveTransaction}
        />
      )}
    </div>
  );
}
