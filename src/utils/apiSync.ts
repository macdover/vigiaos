import { 
  TenantAccount, 
  WorkOrder, 
  Budget, 
  Client, 
  Technician, 
  Supervisor, 
  FinancialOperator,
  FinancialTransaction,
  Product, 
  Service, 
  CompanySettings, 
  TechnicianLocation 
} from '../types';

export interface TenantFullData {
  clients?: Client[];
  technicians?: Technician[];
  supervisors?: Supervisor[];
  financialOperators?: FinancialOperator[];
  products?: Product[];
  services?: Service[];
  workOrders?: WorkOrder[];
  budgets?: Budget[];
  transactions?: FinancialTransaction[];
  company?: CompanySettings;
  allowClearTechnicians?: boolean;
}

// Fetch all tenants from shared backend
export async function apiFetchTenants(): Promise<TenantAccount[] | null> {
  try {
    const res = await fetch('/api/tenants', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('[apiSync] Could not fetch tenants from server, using local fallback:', err);
    return null;
  }
}

// Save or update all tenants in shared backend
export async function apiSaveTenants(tenants: TenantAccount[]): Promise<boolean> {
  try {
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenants),
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Could not save tenants to server:', err);
    return false;
  }
}

// Safely upsert a single tenant immediately in shared backend
export async function apiSaveSingleTenant(tenant: TenantAccount): Promise<boolean> {
  try {
    const res = await fetch('/api/tenants/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenant),
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Could not save single tenant to server:', err);
    return false;
  }
}

// Permanently delete a tenant from shared backend
export async function apiDeleteTenant(tenantId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tenants/${tenantId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Could not delete tenant from server:', err);
    return false;
  }
}

// Check login credentials against shared backend
export async function apiVerifyLogin(
  email: string,
  pass: string,
  type: 'admin' | 'supervisor' | 'financial' | 'technician'
): Promise<{ success: boolean; tenant?: TenantAccount; techId?: string; supervisor?: Supervisor; financialOperator?: FinancialOperator; error?: string }> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, type }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: 'Falha de conexão com o servidor.' };
  }
}

// Fetch specific tenant's data (clients, workOrders, budgets, etc.)
export async function apiFetchTenantData(tenantId: string): Promise<TenantFullData | null> {
  try {
    const res = await fetch(`/api/sync/${tenantId}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[apiSync] Error fetching data for tenant ${tenantId}:`, err);
    return null;
  }
}

// Save specific tenant's data
export async function apiSaveTenantData(tenantId: string, data: TenantFullData): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving data for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically save or update a single technician on the server
export async function apiSaveTechnician(tenantId: string, technician: any): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/technician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving technician for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically save or update a single client on the server
export async function apiSaveClient(tenantId: string, client: Client): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving client for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a client on the server
export async function apiDeleteClient(tenantId: string, clientId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/client/${clientId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting client ${clientId}:`, err);
    return false;
  }
}

// Atomically delete a technician on the server
export async function apiDeleteTechnician(tenantId: string, techId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/technician/${techId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting technician ${techId}:`, err);
    return false;
  }
}

// Atomically save or update a single supervisor on the server
export async function apiSaveSupervisor(tenantId: string, supervisor: Supervisor): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/supervisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supervisor }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving supervisor for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a supervisor on the server
export async function apiDeleteSupervisor(tenantId: string, supervisorId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/supervisor/${supervisorId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting supervisor ${supervisorId}:`, err);
    return false;
  }
}

// Atomically send live GPS location from technician mobile phone
export async function apiUpdateTechnicianLocation(
  tenantId: string,
  techId: string,
  location: TechnicianLocation
): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/technician/${techId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error updating location for technician ${techId}:`, err);
    return false;
  }
}

// Fetch live GPS locations of all technicians for the company dashboard
export async function apiFetchTechnicianLocations(
  tenantId: string
): Promise<{ id: string; name: string; phone: string; specialty: string; avatarColor: string; active: boolean; lastLocation: TechnicianLocation | null }[] | null> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/locations`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.technicians || null;
  } catch (err) {
    console.warn(`[apiSync] Error fetching locations for tenant ${tenantId}:`, err);
    return null;
  }
}

// Atomically save or update a single product on the server
export async function apiSaveProduct(tenantId: string, product: Product): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving product for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a product on the server
export async function apiDeleteProduct(tenantId: string, productId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/product/${productId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting product ${productId}:`, err);
    return false;
  }
}

// Atomically save or update a single service on the server
export async function apiSaveService(tenantId: string, service: Service): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving service for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a service on the server
export async function apiDeleteService(tenantId: string, serviceId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/service/${serviceId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting service ${serviceId}:`, err);
    return false;
  }
}

// Atomically save or update a single budget on the server
export async function apiSaveBudget(tenantId: string, budget: Budget): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving budget for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a budget on the server
export async function apiDeleteBudget(tenantId: string, budgetId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/budget/${budgetId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting budget ${budgetId}:`, err);
    return false;
  }
}

// Atomically save or update a single work order on the server
export async function apiSaveWorkOrder(tenantId: string, workOrder: WorkOrder): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/workorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workOrder }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving work order for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a work order on the server
export async function apiDeleteWorkOrder(tenantId: string, osId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/workorder/${osId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting work order ${osId}:`, err);
    return false;
  }
}

// Atomically save or update a single financial transaction on the server
export async function apiSaveTransaction(tenantId: string, transaction: FinancialTransaction): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving transaction for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a financial transaction on the server
export async function apiDeleteTransaction(tenantId: string, transId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/transaction/${transId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting transaction ${transId}:`, err);
    return false;
  }
}

// Atomically save or update a financial operator on the server
export async function apiSaveFinancialOperator(tenantId: string, operator: FinancialOperator): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/financial-operator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error saving financial operator for tenant ${tenantId}:`, err);
    return false;
  }
}

// Atomically delete a financial operator on the server
export async function apiDeleteFinancialOperator(tenantId: string, opId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/${tenantId}/financial-operator/${opId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn(`[apiSync] Error deleting financial operator ${opId}:`, err);
    return false;
  }
}


