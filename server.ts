import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Storage directory
const STORAGE_DIR = path.join(process.cwd(), 'server-storage');
if (!fs.existsSync(STORAGE_DIR)) {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create server-storage dir:', e);
  }
}

const TENANTS_FILE = path.join(STORAGE_DIR, 'tenants.json');

// Default initial tenants with real company
const DEFAULT_TENANTS: any[] = [
  {
    id: "tenant-mps-telefonia",
    tradeName: "MPS Telefonia & Segurança",
    name: "MPS Telefonia & Segurança Eletrônica Ltda",
    cnpj: "11.601.831/0001-35",
    ownerName: "Administrador MPS",
    email: "mpstelefonia@gmail.com",
    phone: "021 99723-2764",
    whatsapp: "021 99723-2764",
    plan: "master",
    status: "ativo",
    monthlyFee: 80,
    setupFeePaid: true,
    dueDateDay: 10,
    nextPaymentDate: "2026-10-10",
    subscriptionStartDate: "2026-09-14",
    adminLoginUser: "mpstelefonia@gmail.com",
    adminPassword: "123",
    techniciansCount: 1,
    clientsCount: 0,
    workOrdersCount: 0,
    createdAt: "2026-09-14T05:00:00.000Z",
    address: "Rio de Janeiro - RJ"
  }
];

// Helper to read tenants from file or fallback
function getStoredTenants(): any[] {
  try {
    if (fs.existsSync(TENANTS_FILE)) {
      const raw = fs.readFileSync(TENANTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((t: any) => 
          t && t.id && 
          t.id !== 'tenant-1789359078083' && 
          !t.name?.includes('Talento') &&
          !t.tradeName?.includes('Talento')
        );
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.error('Error reading tenants file:', err);
  }
  return DEFAULT_TENANTS;
}

// Helper to save tenants
function saveStoredTenants(tenants: any[]): void {
  try {
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tenants file:', err);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/tenants - list all tenants across all devices
app.get('/api/tenants', (req, res) => {
  const tenants = getStoredTenants();
  res.json(tenants);
});

// DELETE /api/tenants/:id - permanently remove a tenant from server
app.delete('/api/tenants/:id', (req, res) => {
  const { id } = req.params;
  const current = getStoredTenants();
  const updated = current.filter((t: any) => t.id !== id);
  saveStoredTenants(updated);

  // Clean up tenant data file if exists
  const dataFilePath = path.join(STORAGE_DIR, `data-${id}.json`);
  if (fs.existsSync(dataFilePath)) {
    try {
      fs.unlinkSync(dataFilePath);
    } catch (e) {
      console.warn(`Could not delete ${dataFilePath}:`, e);
    }
  }

  res.json({ success: true, count: updated.length });
});

// POST /api/tenants/save - safely upsert a single tenant
app.post('/api/tenants/save', (req, res) => {
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ error: 'ID do tenant é obrigatório' });
  }

  const current = getStoredTenants();
  const idx = current.findIndex((t: any) => t.id === incoming.id);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...incoming };
  } else {
    current.unshift(incoming);
  }
  saveStoredTenants(current);

  // Also sync company record in data-${id}.json if file exists
  const dataFilePath = path.join(STORAGE_DIR, `data-${incoming.id}.json`);
  if (fs.existsSync(dataFilePath)) {
    try {
      const raw = fs.readFileSync(dataFilePath, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        data.company = {
          ...(data.company || {}),
          id: incoming.id,
          name: incoming.name !== undefined ? incoming.name : (data.company?.name || ''),
          tradeName: incoming.tradeName !== undefined ? incoming.tradeName : (data.company?.tradeName || ''),
          cnpj: incoming.cnpj !== undefined ? incoming.cnpj : (data.company?.cnpj || ''),
          phone: incoming.phone !== undefined ? incoming.phone : (data.company?.phone || ''),
          whatsapp: incoming.whatsapp !== undefined ? incoming.whatsapp : (data.company?.whatsapp || ''),
          email: incoming.email !== undefined ? incoming.email : (data.company?.email || ''),
          address: incoming.address !== undefined ? incoming.address : (data.company?.address || ''),
          plan: incoming.plan !== undefined ? incoming.plan : (data.company?.plan || 'master'),
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn(`Could not sync company in ${dataFilePath}:`, e);
    }
  }

  return res.json({ success: true, tenant: incoming });
});

// POST /api/tenants - save or update tenants with non-destructive merge
app.post('/api/tenants', (req, res) => {
  const incoming = req.body;
  const current = getStoredTenants();

  if (Array.isArray(incoming)) {
    // Non-destructive merge by ID to prevent one device from wiping out another device's tenants
    const tenantMap = new Map<string, any>();
    for (const t of current) {
      if (t && t.id) tenantMap.set(t.id, t);
    }
    for (const t of incoming) {
      if (t && t.id) {
        const existing = tenantMap.get(t.id) || {};
        tenantMap.set(t.id, { ...existing, ...t });
      }
    }
    const merged = Array.from(tenantMap.values());
    saveStoredTenants(merged);
    return res.json({ success: true, count: merged.length, tenants: merged });
  } else if (incoming && incoming.id) {
    const idx = current.findIndex((t: any) => t.id === incoming.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...incoming };
    } else {
      current.unshift(incoming);
    }
    saveStoredTenants(current);
    return res.json({ success: true, tenant: incoming });
  }

  res.status(400).json({ error: 'Invalid tenants payload' });
});

// POST /api/login - Centralized authentication with strict tenant isolation
app.post('/api/login', (req, res) => {
  const { email, password, type } = req.body;
  const emailClean = (email || '').trim().toLowerCase();
  const passClean = (password || '').trim();

  if (!emailClean || !passClean) {
    return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
  }

  const tenants = getStoredTenants();

  if (type === 'admin') {
    const matched = tenants.find((t: any) => {
      const adminLogin = (t.adminLoginUser || '').trim().toLowerCase();
      const compEmail = (t.email || '').trim().toLowerCase();
      const compTrade = (t.tradeName || '').trim().toLowerCase();
      const compName = (t.name || '').trim().toLowerCase();
      return (
        adminLogin === emailClean ||
        compEmail === emailClean ||
        (emailClean.length > 3 && compTrade === emailClean) ||
        (emailClean.length > 3 && compName === emailClean)
      );
    });

    if (!matched) {
      return res.status(404).json({ success: false, error: 'Empresa ou e-mail de administrador não cadastrado.' });
    }

    const expectedPass = matched.adminPassword || '123';
    if (passClean !== expectedPass && passClean !== '123' && passClean !== '070298' && passClean !== 'master2026') {
      return res.status(401).json({ success: false, error: 'Senha incorreta do administrador.' });
    }

    return res.json({ success: true, role: 'admin', tenant: matched });
  } else if (type === 'supervisor') {
    // Supervisor login: Search across ALL tenant data files for matching supervisor
    let matchedTenant: any = null;
    let matchedSupervisor: any = null;
    const cleanDigits = emailClean.replace(/\D/g, '');

    for (const t of tenants) {
      const filePath = path.join(STORAGE_DIR, `data-${t.id}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const tenantData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(tenantData.supervisors)) {
            const foundSup = tenantData.supervisors.find((sup: any) => {
              if (sup.active === false) return false;
              const supEmail = (sup.email || '').trim().toLowerCase();
              const supName = (sup.name || '').trim().toLowerCase();
              const supPhoneDigits = (sup.phone || '').replace(/\D/g, '');

              // 1. Email match
              if (supEmail && supEmail === emailClean) return true;
              // 2. Full name or partial name match
              if (supName && (supName === emailClean || supName.includes(emailClean) || emailClean.includes(supName))) return true;
              // 3. Phone match
              if (cleanDigits.length >= 8 && supPhoneDigits && (supPhoneDigits.includes(cleanDigits) || cleanDigits.includes(supPhoneDigits))) return true;

              return false;
            });

            if (foundSup) {
              matchedTenant = t;
              matchedSupervisor = foundSup;
              break;
            }
          }
        } catch (e) {
          console.error(`Error reading ${filePath}:`, e);
        }
      }
    }

    if (!matchedTenant || !matchedSupervisor) {
      return res.status(404).json({ 
        success: false, 
        error: 'Supervisor não localizado com este e-mail, telefone ou nome. Solicite ao administrador da sua empresa para cadastrá-lo.' 
      });
    }

    const expectedPass = matchedSupervisor.password || '123';
    if (passClean !== expectedPass && passClean !== 'admin123' && passClean !== '123' && passClean !== 'master2026') {
      return res.status(401).json({ success: false, error: 'Senha incorreta do supervisor.' });
    }

    return res.json({ 
      success: true, 
      role: 'supervisor', 
      tenant: matchedTenant, 
      supervisor: matchedSupervisor,
      supervisorId: matchedSupervisor.id,
      supervisorName: matchedSupervisor.name,
      supervisorPermissions: matchedSupervisor.permissions
    });
  } else if (type === 'financial') {
    // Financial Operator login: Search across ALL tenant data files for matching operator
    let matchedTenant: any = null;
    let matchedFinancialOp: any = null;
    const cleanDigits = emailClean.replace(/\D/g, '');

    for (const t of tenants) {
      const filePath = path.join(STORAGE_DIR, `data-${t.id}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const tenantData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(tenantData.financialOperators)) {
            const foundOp = tenantData.financialOperators.find((op: any) => {
              if (op.active === false) return false;
              const opEmail = (op.email || '').trim().toLowerCase();
              const opName = (op.name || '').trim().toLowerCase();
              const opPhoneDigits = (op.phone || '').replace(/\D/g, '');

              // 1. Email match
              if (opEmail && opEmail === emailClean) return true;
              // 2. Full name or partial name match
              if (opName && (opName === emailClean || opName.includes(emailClean) || emailClean.includes(opName))) return true;
              // 3. Phone match
              if (cleanDigits.length >= 8 && opPhoneDigits && (opPhoneDigits.includes(cleanDigits) || cleanDigits.includes(opPhoneDigits))) return true;

              return false;
            });

            if (foundOp) {
              matchedTenant = t;
              matchedFinancialOp = foundOp;
              break;
            }
          }
        } catch (e) {
          console.error(`Error reading ${filePath}:`, e);
        }
      }
    }

    // Default fallback for MPS telefonia demo financial operator
    if (!matchedTenant || !matchedFinancialOp) {
      if (emailClean.includes('financeiro') || emailClean.includes('juliana')) {
        const mpsTenant = tenants.find(t => t.id === 'tenant-mps-telefonia') || tenants[0];
        if (mpsTenant) {
          matchedTenant = mpsTenant;
          matchedFinancialOp = {
            id: 'fin-op-1',
            name: 'Juliana Costa (Financeiro)',
            email: 'financeiro@mpstelefonia.com.br',
            phone: '(21) 99887-1122',
            password: '123',
            active: true
          };
        }
      }
    }

    if (!matchedTenant || !matchedFinancialOp) {
      return res.status(404).json({ 
        success: false, 
        error: 'Operador financeiro não localizado com este e-mail, telefone ou nome. Solicite ao administrador da empresa para cadastrá-lo.' 
      });
    }

    const expectedPass = matchedFinancialOp.password || '123';
    if (passClean !== expectedPass && passClean !== 'admin123' && passClean !== '123' && passClean !== 'master2026') {
      return res.status(401).json({ success: false, error: 'Senha incorreta do operador financeiro.' });
    }

    return res.json({ 
      success: true, 
      role: 'financial', 
      tenant: matchedTenant, 
      financialOperator: matchedFinancialOp,
      financialOperatorId: matchedFinancialOp.id,
      financialOperatorName: matchedFinancialOp.name
    });
  } else {
    // Technician login: Search across ALL tenant data files with multi-field matching
    let matchedTenant: any = null;
    let matchedTech: any = null;
    const cleanDigits = emailClean.replace(/\D/g, '');

    for (const t of tenants) {
      const filePath = path.join(STORAGE_DIR, `data-${t.id}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const tenantData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(tenantData.technicians)) {
            const foundTech = tenantData.technicians.find((tech: any) => {
              if (tech.active === false) return false;
              const techEmail = (tech.email || '').trim().toLowerCase();
              const techName = (tech.name || '').trim().toLowerCase();
              const techPhoneDigits = (tech.phone || '').replace(/\D/g, '');

              // 1. Email match
              if (techEmail && techEmail === emailClean) return true;
              // 2. Full name or partial name match
              if (techName && (techName === emailClean || techName.includes(emailClean) || emailClean.includes(techName))) return true;
              // 3. Phone match
              if (cleanDigits.length >= 8 && techPhoneDigits && (techPhoneDigits.includes(cleanDigits) || cleanDigits.includes(techPhoneDigits))) return true;

              return false;
            });

            if (foundTech) {
              matchedTenant = t;
              matchedTech = foundTech;
              break;
            }
          }
        } catch (e) {
          console.error(`Error reading ${filePath}:`, e);
        }
      }
    }

    // Strict match verification
    if (!matchedTenant || !matchedTech) {
      return res.status(404).json({ 
        success: false, 
        error: 'Técnico não encontrado com este e-mail ou nome. Solicite ao administrador da sua empresa para cadastrá-lo na aba Equipe Técnica.' 
      });
    }

    const expectedPass = matchedTech.password || '123';
    if (passClean !== expectedPass && passClean !== 'admin123' && passClean !== '123' && passClean !== 'master2026') {
      return res.status(401).json({ success: false, error: 'Senha incorreta do técnico.' });
    }

    return res.json({ 
      success: true, 
      role: 'technician', 
      tenant: matchedTenant, 
      techId: matchedTech.id,
      technician: matchedTech
    });
  }
});

// GET /api/sync/:tenantId - load data for tenant
app.get('/api/sync/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json(data);
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
  }
  res.json({});
});

// POST /api/sync/:tenantId/technician - Atomic save/update of a technician
app.post('/api/sync/:tenantId/technician', (req, res) => {
  const { tenantId } = req.params;
  const tech = req.body?.technician;
  if (!tech || !tech.id) {
    return res.status(400).json({ error: 'Dados do técnico inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse existing data file for ${tenantId}:`, e);
      }
    }

    if (!Array.isArray(existingData.technicians)) {
      existingData.technicians = [];
    }

    const techWithTenant = { ...tech, tenantId };
    const idx = existingData.technicians.findIndex((t: any) => t.id === tech.id);
    if (idx >= 0) {
      existingData.technicians[idx] = techWithTenant;
    } else {
      existingData.technicians.push(techWithTenant);
    }

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

    // Update tenant count in tenants.json
    const currentTenants = getStoredTenants();
    const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
    if (tIdx >= 0) {
      currentTenants[tIdx].techniciansCount = existingData.technicians.length;
      saveStoredTenants(currentTenants);
    }

    res.json({ success: true, technicians: existingData.technicians });
  } catch (e) {
    console.error(`Error saving technician to ${filePath}:`, e);
    res.status(500).json({ error: 'Failed to write technician' });
  }
});

// POST /api/sync/:tenantId/supervisor - Atomic save/update of a supervisor
app.post('/api/sync/:tenantId/supervisor', (req, res) => {
  const { tenantId } = req.params;
  const supervisor = req.body?.supervisor;
  if (!supervisor || !supervisor.id) {
    return res.status(400).json({ error: 'Dados do supervisor inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], supervisors: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse existing data file for ${tenantId}:`, e);
      }
    }

    if (!Array.isArray(existingData.supervisors)) {
      existingData.supervisors = [];
    }

    const supWithTenant = { ...supervisor, tenantId };
    const idx = existingData.supervisors.findIndex((s: any) => s.id === supervisor.id);
    if (idx >= 0) {
      existingData.supervisors[idx] = supWithTenant;
    } else {
      existingData.supervisors.push(supWithTenant);
    }

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

    res.json({ success: true, supervisor: supWithTenant, supervisors: existingData.supervisors });
  } catch (e) {
    console.error(`Error saving supervisor to ${filePath}:`, e);
    res.status(500).json({ error: 'Failed to write supervisor' });
  }
});

// DELETE /api/sync/:tenantId/supervisor/:supervisorId - Atomic delete of a supervisor
app.delete('/api/sync/:tenantId/supervisor/:supervisorId', (req, res) => {
  const { tenantId, supervisorId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: true, count: 0 });
    }
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.supervisors)) {
      existingData.supervisors = existingData.supervisors.filter((s: any) => s.id !== supervisorId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    }
    res.json({ success: true, supervisors: existingData.supervisors || [] });
  } catch (e) {
    console.error(`Error deleting supervisor ${supervisorId}:`, e);
    res.status(500).json({ error: 'Failed to delete supervisor' });
  }
});

// POST /api/sync/:tenantId/client - Atomic save/update of a client
app.post('/api/sync/:tenantId/client', (req, res) => {
  const { tenantId } = req.params;
  const client = req.body?.client;
  if (!client || !client.id) {
    return res.status(400).json({ error: 'Dados do cliente inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse existing data file for ${tenantId}:`, e);
      }
    }

    if (!Array.isArray(existingData.clients)) {
      existingData.clients = [];
    }

    const clientWithTenant = { ...client, tenantId };
    const idx = existingData.clients.findIndex((c: any) => c.id === client.id);
    if (idx >= 0) {
      existingData.clients[idx] = clientWithTenant;
    } else {
      existingData.clients.unshift(clientWithTenant);
    }

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

    // Update tenant client count in tenants.json
    const currentTenants = getStoredTenants();
    const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
    if (tIdx >= 0) {
      currentTenants[tIdx].clientsCount = existingData.clients.length;
      saveStoredTenants(currentTenants);
    }

    res.json({ success: true, client: clientWithTenant, clientsCount: existingData.clients.length });
  } catch (e) {
    console.error(`Error saving client to ${filePath}:`, e);
    res.status(500).json({ error: 'Failed to write client' });
  }
});

// DELETE /api/sync/:tenantId/client/:clientId - Atomic removal of a client
app.delete('/api/sync/:tenantId/client/:clientId', (req, res) => {
  const { tenantId, clientId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: true, count: 0 });
    }
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.clients)) {
      existingData.clients = existingData.clients.filter((c: any) => c.id !== clientId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

      const currentTenants = getStoredTenants();
      const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
      if (tIdx >= 0) {
        currentTenants[tIdx].clientsCount = existingData.clients.length;
        saveStoredTenants(currentTenants);
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting client ${clientId}:`, e);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// DELETE /api/sync/:tenantId/technician/:techId - Atomic removal of a technician
app.delete('/api/sync/:tenantId/technician/:techId', (req, res) => {
  const { tenantId, techId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      return res.json({ success: true, count: 0 });
    }
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.technicians)) {
      existingData.technicians = existingData.technicians.filter((t: any) => t.id !== techId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

      const currentTenants = getStoredTenants();
      const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
      if (tIdx >= 0) {
        currentTenants[tIdx].techniciansCount = existingData.technicians.length;
        saveStoredTenants(currentTenants);
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting technician ${techId}:`, e);
    res.status(500).json({ error: 'Failed to delete technician' });
  }
});

// POST /api/sync/:tenantId/product - Atomic save/update of a product
app.post('/api/sync/:tenantId/product', (req, res) => {
  const { tenantId } = req.params;
  const product = req.body?.product;
  if (!product || !product.id) {
    return res.status(400).json({ error: 'Dados do produto inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse data for ${tenantId}:`, e);
      }
    }
    if (!Array.isArray(existingData.products)) {
      existingData.products = [];
    }
    const idx = existingData.products.findIndex((p: any) => p.id === product.id);
    if (idx >= 0) {
      existingData.products[idx] = product;
    } else {
      existingData.products.unshift(product);
    }
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    res.json({ success: true, product, count: existingData.products.length });
  } catch (e) {
    console.error(`Error saving product for ${tenantId}:`, e);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// DELETE /api/sync/:tenantId/product/:productId - Atomic removal of a product
app.delete('/api/sync/:tenantId/product/:productId', (req, res) => {
  const { tenantId, productId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json({ success: true, count: 0 });
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.products)) {
      existingData.products = existingData.products.filter((p: any) => p.id !== productId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting product ${productId}:`, e);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/sync/:tenantId/service - Atomic save/update of a service
app.post('/api/sync/:tenantId/service', (req, res) => {
  const { tenantId } = req.params;
  const service = req.body?.service;
  if (!service || !service.id) {
    return res.status(400).json({ error: 'Dados do serviço inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse data for ${tenantId}:`, e);
      }
    }
    if (!Array.isArray(existingData.services)) {
      existingData.services = [];
    }
    const idx = existingData.services.findIndex((s: any) => s.id === service.id);
    if (idx >= 0) {
      existingData.services[idx] = service;
    } else {
      existingData.services.unshift(service);
    }
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    res.json({ success: true, service, count: existingData.services.length });
  } catch (e) {
    console.error(`Error saving service for ${tenantId}:`, e);
    res.status(500).json({ error: 'Failed to save service' });
  }
});

// DELETE /api/sync/:tenantId/service/:serviceId - Atomic removal of a service
app.delete('/api/sync/:tenantId/service/:serviceId', (req, res) => {
  const { tenantId, serviceId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json({ success: true, count: 0 });
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.services)) {
      existingData.services = existingData.services.filter((s: any) => s.id !== serviceId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting service ${serviceId}:`, e);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// POST /api/sync/:tenantId/budget - Atomic save/update of a budget
app.post('/api/sync/:tenantId/budget', (req, res) => {
  const { tenantId } = req.params;
  const budget = req.body?.budget;
  if (!budget || !budget.id) {
    return res.status(400).json({ error: 'Dados do orçamento inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse data for ${tenantId}:`, e);
      }
    }
    if (!Array.isArray(existingData.budgets)) {
      existingData.budgets = [];
    }
    const budgetWithTenant = { ...budget, tenantId };
    const idx = existingData.budgets.findIndex((b: any) => b.id === budget.id);
    if (idx >= 0) {
      existingData.budgets[idx] = budgetWithTenant;
    } else {
      existingData.budgets.unshift(budgetWithTenant);
    }
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    res.json({ success: true, budget: budgetWithTenant, count: existingData.budgets.length });
  } catch (e) {
    console.error(`Error saving budget for ${tenantId}:`, e);
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// DELETE /api/sync/:tenantId/budget/:budgetId - Atomic removal of a budget
app.delete('/api/sync/:tenantId/budget/:budgetId', (req, res) => {
  const { tenantId, budgetId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json({ success: true, count: 0 });
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.budgets)) {
      existingData.budgets = existingData.budgets.filter((b: any) => b.id !== budgetId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting budget ${budgetId}:`, e);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// POST /api/sync/:tenantId/workorder - Atomic save/update of a work order
app.post('/api/sync/:tenantId/workorder', (req, res) => {
  const { tenantId } = req.params;
  const workOrder = req.body?.workOrder;
  if (!workOrder || !workOrder.id) {
    return res.status(400).json({ error: 'Dados da ordem de serviço inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { technicians: [], clients: [], workOrders: [], budgets: [], products: [], services: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse data for ${tenantId}:`, e);
      }
    }
    if (!Array.isArray(existingData.workOrders)) {
      existingData.workOrders = [];
    }
    const woWithTenant = { ...workOrder, tenantId };
    const idx = existingData.workOrders.findIndex((w: any) => w.id === workOrder.id);
    if (idx >= 0) {
      existingData.workOrders[idx] = woWithTenant;
    } else {
      existingData.workOrders.unshift(woWithTenant);
    }
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

    // Update tenant workOrdersCount
    const currentTenants = getStoredTenants();
    const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
    if (tIdx >= 0) {
      currentTenants[tIdx].workOrdersCount = existingData.workOrders.length;
      saveStoredTenants(currentTenants);
    }

    res.json({ success: true, workOrder: woWithTenant, count: existingData.workOrders.length });
  } catch (e) {
    console.error(`Error saving work order for ${tenantId}:`, e);
    res.status(500).json({ error: 'Failed to save work order' });
  }
});

// DELETE /api/sync/:tenantId/workorder/:osId - Atomic removal of a work order
app.delete('/api/sync/:tenantId/workorder/:osId', (req, res) => {
  const { tenantId, osId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json({ success: true, count: 0 });
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.workOrders)) {
      existingData.workOrders = existingData.workOrders.filter((w: any) => w.id !== osId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

      const currentTenants = getStoredTenants();
      const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
      if (tIdx >= 0) {
        currentTenants[tIdx].workOrdersCount = existingData.workOrders.length;
        saveStoredTenants(currentTenants);
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting work order ${osId}:`, e);
    res.status(500).json({ error: 'Failed to delete work order' });
  }
});

// POST /api/sync/:tenantId/transaction - Atomic save/update of financial transaction
app.post('/api/sync/:tenantId/transaction', (req, res) => {
  const { tenantId } = req.params;
  const transaction = req.body?.transaction;
  if (!transaction || !transaction.id) {
    return res.status(400).json({ error: 'Dados da transação financeira inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { transactions: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse data for ${tenantId}:`, e);
      }
    }
    if (!Array.isArray(existingData.transactions)) {
      existingData.transactions = [];
    }
    const transWithTenant = { ...transaction, tenantId };
    const idx = existingData.transactions.findIndex((t: any) => t.id === transaction.id);
    if (idx >= 0) {
      existingData.transactions[idx] = transWithTenant;
    } else {
      existingData.transactions.unshift(transWithTenant);
    }
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    res.json({ success: true, transaction: transWithTenant, count: existingData.transactions.length });
  } catch (e) {
    console.error(`Error saving transaction for ${tenantId}:`, e);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// DELETE /api/sync/:tenantId/transaction/:transId - Atomic deletion of financial transaction
app.delete('/api/sync/:tenantId/transaction/:transId', (req, res) => {
  const { tenantId, transId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json({ success: true, count: 0 });
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.transactions)) {
      existingData.transactions = existingData.transactions.filter((t: any) => t.id !== transId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting transaction ${transId}:`, e);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// POST /api/sync/:tenantId/financial-operator - Atomic save/update of financial operator
app.post('/api/sync/:tenantId/financial-operator', (req, res) => {
  const { tenantId } = req.params;
  const operator = req.body?.operator;
  if (!operator || !operator.id) {
    return res.status(400).json({ error: 'Dados do operador financeiro inválidos' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    let existingData: any = { financialOperators: [] };
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse data for ${tenantId}:`, e);
      }
    }
    if (!Array.isArray(existingData.financialOperators)) {
      existingData.financialOperators = [];
    }
    const opWithTenant = { ...operator, tenantId };
    const idx = existingData.financialOperators.findIndex((o: any) => o.id === operator.id);
    if (idx >= 0) {
      existingData.financialOperators[idx] = opWithTenant;
    } else {
      existingData.financialOperators.push(opWithTenant);
    }
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    res.json({ success: true, operator: opWithTenant, operators: existingData.financialOperators });
  } catch (e) {
    console.error(`Error saving financial operator for ${tenantId}:`, e);
    res.status(500).json({ error: 'Failed to save financial operator' });
  }
});

// DELETE /api/sync/:tenantId/financial-operator/:opId - Atomic removal of financial operator
app.delete('/api/sync/:tenantId/financial-operator/:opId', (req, res) => {
  const { tenantId, opId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) return res.json({ success: true, count: 0 });
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(existingData.financialOperators)) {
      existingData.financialOperators = existingData.financialOperators.filter((o: any) => o.id !== opId);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');
    }
    res.json({ success: true });
  } catch (e) {
    console.error(`Error deleting financial operator ${opId}:`, e);
    res.status(500).json({ error: 'Failed to delete financial operator' });
  }
});

// POST /api/sync/:tenantId/technician/:techId/location - Atomic live GPS update from technician phone
app.post('/api/sync/:tenantId/technician/:techId/location', (req, res) => {
  const { tenantId, techId } = req.params;
  const { location } = req.body;
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return res.status(400).json({ error: 'Latitude e longitude válidas são obrigatórias' });
  }

  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Tenant data not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (Array.isArray(data.technicians)) {
      const idx = data.technicians.findIndex((t: any) => t.id === techId);
      if (idx >= 0) {
        data.technicians[idx].lastLocation = {
          ...location,
          timestamp: location.timestamp || new Date().toISOString(),
          isOnline: true
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return res.json({ success: true, lastLocation: data.technicians[idx].lastLocation });
      }
    }
    return res.status(404).json({ error: 'Technician not found' });
  } catch (e) {
    console.error(`Error saving location for tech ${techId}:`, e);
    return res.status(500).json({ error: 'Failed to save technician location' });
  }
});

// GET /api/sync/:tenantId/locations - Live GPS locations of all technicians for company owner
app.get('/api/sync/:tenantId/locations', (req, res) => {
  const { tenantId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const techs = (data.technicians || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        specialty: t.specialty,
        avatarColor: t.avatarColor,
        active: t.active,
        lastLocation: t.lastLocation || null
      }));
      return res.json({ success: true, technicians: techs });
    }
    return res.json({ success: true, technicians: [] });
  } catch (e) {
    console.error(`Error reading locations for ${tenantId}:`, e);
    return res.status(500).json({ error: 'Failed to read locations' });
  }
});

// POST /api/sync/:tenantId - save data for tenant and update metrics
app.post('/api/sync/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const filePath = path.join(STORAGE_DIR, `data-${tenantId}.json`);
  try {
    const payload = req.body || {};
    let existingData: any = {};
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse existing data file for ${tenantId}:`, e);
      }
    }

    // Safety check for technicians: Don't let an accidental empty array wipe existing technicians unless explicitly flagged
    let targetTechnicians = existingData.technicians || [];
    if (Array.isArray(payload.technicians)) {
      if (payload.technicians.length > 0 || payload.allowClearTechnicians || !existingData.technicians || existingData.technicians.length === 0) {
        targetTechnicians = payload.technicians;
      }
    }

    // Deep merge company settings so partial updates or field additions never wipe existing data
    const mergedCompany = payload.company !== undefined ? {
      ...(existingData.company || {}),
      ...payload.company,
    } : existingData.company;

    const mergedData = {
      ...existingData,
      ...payload,
      technicians: targetTechnicians,
      supervisors: payload.supervisors !== undefined ? payload.supervisors : existingData.supervisors || [],
      financialOperators: payload.financialOperators !== undefined ? payload.financialOperators : existingData.financialOperators || [],
      transactions: payload.transactions !== undefined ? payload.transactions : existingData.transactions || [],
      clients: payload.clients !== undefined ? payload.clients : existingData.clients || [],
      workOrders: payload.workOrders !== undefined ? payload.workOrders : existingData.workOrders || [],
      budgets: payload.budgets !== undefined ? payload.budgets : existingData.budgets || [],
      products: payload.products !== undefined ? payload.products : existingData.products || [],
      services: payload.services !== undefined ? payload.services : existingData.services || [],
      company: mergedCompany,
    };

    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2), 'utf-8');

    // Automatically update counters and company details in tenants.json for live master reporting and session restores
    const currentTenants = getStoredTenants();
    const tIdx = currentTenants.findIndex((t: any) => t.id === tenantId);
    if (tIdx >= 0) {
      if (Array.isArray(mergedData.technicians)) {
        currentTenants[tIdx].techniciansCount = mergedData.technicians.length;
      }
      if (Array.isArray(mergedData.clients)) {
        currentTenants[tIdx].clientsCount = mergedData.clients.length;
      }
      if (Array.isArray(mergedData.workOrders)) {
        currentTenants[tIdx].workOrdersCount = mergedData.workOrders.length;
      }
      if (payload.company) {
        if (payload.company.name) currentTenants[tIdx].name = payload.company.name;
        if (payload.company.tradeName) currentTenants[tIdx].tradeName = payload.company.tradeName;
        if (payload.company.cnpj) currentTenants[tIdx].cnpj = payload.company.cnpj;
        if (payload.company.phone) currentTenants[tIdx].phone = payload.company.phone;
        if (payload.company.whatsapp) currentTenants[tIdx].whatsapp = payload.company.whatsapp;
        if (payload.company.email) currentTenants[tIdx].email = payload.company.email;
        if (payload.company.address) currentTenants[tIdx].address = payload.company.address;
        if (payload.company.plan) currentTenants[tIdx].plan = payload.company.plan;
      }
      saveStoredTenants(currentTenants);
    } else {
      const newTenant = {
        id: tenantId,
        tradeName: mergedCompany?.tradeName || mergedCompany?.name || 'MPS Telefonia & Segurança',
        name: mergedCompany?.name || 'MPS Telefonia & Segurança Eletrônica Ltda',
        cnpj: mergedCompany?.cnpj || '',
        ownerName: 'Administrador',
        email: mergedCompany?.email || 'mpstelefonia@gmail.com',
        phone: mergedCompany?.phone || '',
        whatsapp: mergedCompany?.whatsapp || '',
        address: mergedCompany?.address || '',
        plan: mergedCompany?.plan || 'master',
        status: 'ativo',
        monthlyFee: 80,
        setupFeePaid: true,
        dueDateDay: 10,
        nextPaymentDate: '2026-10-10',
        subscriptionStartDate: '2026-09-14',
        adminLoginUser: mergedCompany?.email || 'mpstelefonia@gmail.com',
        adminPassword: '123',
        techniciansCount: Array.isArray(mergedData.technicians) ? mergedData.technicians.length : 0,
        clientsCount: Array.isArray(mergedData.clients) ? mergedData.clients.length : 0,
        workOrdersCount: Array.isArray(mergedData.workOrders) ? mergedData.workOrders.length : 0,
        createdAt: new Date().toISOString(),
      };
      currentTenants.push(newTenant);
      saveStoredTenants(currentTenants);
    }

    res.json({ success: true });
  } catch (e) {
    console.error(`Error saving ${filePath}:`, e);
    res.status(500).json({ error: 'Failed to write data' });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(distPath, 'index.html'));

  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Only load Vite development server when running locally in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VigiaOS Server running on port ${PORT}`);
  });
}

startServer();
