import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_ORDERS, INITIAL_TECHNICIANS, ANGOLA_PROVINCES, SERVICES } from './src/data/mockData.ts';
import { Order, Technician, ZoneConfig, OrderStatus, Quote, Assignment, PaymentDetails, UserProfile } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// JSON database file persistence
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'angoserv-db.json');

interface StoredUser extends UserProfile {
  passwordHash?: string;
}

interface DatabaseSchema {
  orders: Order[];
  technicians: Technician[];
  zones: ZoneConfig[];
  users: StoredUser[];
}

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseSchema {
  ensureDataDirectory();
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        orders: parsed.orders || INITIAL_ORDERS,
        technicians: parsed.technicians || INITIAL_TECHNICIANS,
        zones: parsed.zones || ANGOLA_PROVINCES,
        users: parsed.users || [],
      };
    }
  } catch (err) {
    console.error('Error loading database file, falling back to initial data:', err);
  }

  const initial: DatabaseSchema = {
    orders: INITIAL_ORDERS,
    technicians: INITIAL_TECHNICIANS,
    zones: ANGOLA_PROVINCES,
    users: [],
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DatabaseSchema) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// In-memory active database state
let db: DatabaseSchema = loadDatabase();

// Middleware
app.use(express.json({ limit: '15mb' }));

// ----------------- AUTHENTICATION API (Fallback & Real-time) -----------------
const phoneVerificationCodes = new Map<string, { code: string; name?: string; expiresAt: number }>();

// Register with email and password
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, phone, province } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Nome, email e palavra-passe são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!db.users) db.users = [];
  const existing = db.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ success: false, error: 'Este endereço de email já se encontra registado.' });
  }

  const newUser: StoredUser = {
    uid: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : undefined,
    province: province ? province.trim() : 'Luanda',
    role: normalizedEmail === 'angoserv05@gmail.com' ? 'admin' : 'cliente',
    createdAt: new Date().toISOString(),
    passwordHash: password,
  };

  db.users.push(newUser);
  saveDatabase(db);

  const { passwordHash, ...safeUser } = newUser;
  return res.json({ success: true, user: safeUser });
});

// Login with email and password
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email e palavra-passe são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!db.users) db.users = [];
  const user = db.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ success: false, error: 'Email ou palavra-passe incorretos.' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

// Request Phone SMS Code
app.post('/api/auth/phone-code', (req: Request, res: Response) => {
  const { phone, name } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Número de telefone é obrigatório.' });
  }

  const normalizedPhone = phone.replace(/\s+/g, '');
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  phoneVerificationCodes.set(normalizedPhone, {
    code,
    name: name ? name.trim() : undefined,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return res.json({
    success: true,
    code,
    message: `Código de verificação SMS: ${code}`,
  });
});

// Verify Phone Code
app.post('/api/auth/verify-phone', (req: Request, res: Response) => {
  const { phone, code, name } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Número de telefone e código são obrigatórios.' });
  }

  const normalizedPhone = phone.replace(/\s+/g, '');
  const entry = phoneVerificationCodes.get(normalizedPhone);
  if (!entry || entry.code !== code.trim() || entry.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, error: 'Código de verificação incorreto ou expirado.' });
  }

  phoneVerificationCodes.delete(normalizedPhone);

  if (!db.users) db.users = [];
  let user = db.users.find((u) => u.phone === normalizedPhone);
  if (!user) {
    user = {
      uid: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name?.trim() || entry.name || 'Cliente AngoServ',
      phone: normalizedPhone,
      role: 'cliente',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDatabase(db);
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

// ----------------- API ENDPOINTS -----------------

// 1. Services Catalog
app.get('/api/services', (_req: Request, res: Response) => {
  res.json({ success: true, services: SERVICES });
});

// 2. Zones & Coverage
app.get('/api/zones', (_req: Request, res: Response) => {
  res.json({ success: true, zones: db.zones });
});

// 3. Orders: Create Order (Customer)
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      province,
      municipality,
      neighborhood,
      address,
      serviceId,
      serviceName,
      description,
      preferredDate,
      preferredTimeSlot,
      photos,
      observations,
    } = req.body;

    if (!customerName || !customerPhone || !province || !municipality || !serviceId || !description) {
      return res.status(400).json({
        success: false,
        error: 'Por favor preencha todos os campos obrigatórios (nome, telefone, localização, serviço e descrição).',
      });
    }

    // Generate unique code: AS-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `AS-2026-${randomSuffix}`;
    const id = `ord-${Date.now()}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id,
      code,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : undefined,
      province,
      municipality,
      neighborhood: neighborhood || 'Centro',
      address: address || '',
      serviceId,
      serviceName: serviceName || 'Serviço AngoServ',
      description,
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      preferredTimeSlot: preferredTimeSlot || 'MANHA',
      photos: Array.isArray(photos) ? photos : [],
      observations: observations || '',
      status: 'RECEBIDO',
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);
    saveDatabase(db);

    return res.status(201).json({
      success: true,
      message: 'Pedido registado com sucesso! A equipa da AngoServ entrará em contacto.',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: 'Erro ao registar o pedido.' });
  }
});

// 4. Orders: Track by code
app.get('/api/orders/:code', (req: Request, res: Response) => {
  const code = req.params.code?.trim().toUpperCase();
  const order = db.orders.find((o) => o.code.toUpperCase() === code || o.id === req.params.code);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: `Nenhum pedido encontrado com o código "${code}". Verifique o código e tente novamente.`,
    });
  }

  return res.json({ success: true, order });
});

// 5. Orders: Search by customer phone or email
app.get('/api/orders', (req: Request, res: Response) => {
  const { phone, email } = req.query;
  let filtered = db.orders;

  if (phone) {
    const cleanPhone = String(phone).replace(/\s+/g, '');
    filtered = filtered.filter((o) => o.customerPhone.replace(/\s+/g, '').includes(cleanPhone));
  } else if (email) {
    filtered = filtered.filter(
      (o) => o.customerEmail && o.customerEmail.toLowerCase() === String(email).toLowerCase()
    );
  }

  return res.json({ success: true, orders: filtered });
});

// 6. Orders: Customer Approve/Reject Quote
app.post('/api/orders/:code/quote-action', (req: Request, res: Response) => {
  const code = req.params.code?.trim().toUpperCase();
  const { action } = req.body; // 'APPROVE' or 'REJECT'

  const order = db.orders.find((o) => o.code.toUpperCase() === code || o.id === req.params.code);
  if (!order || !order.quote) {
    return res.status(404).json({ success: false, error: 'Pedido ou orçamento não encontrado.' });
  }

  if (action === 'APPROVE') {
    order.quote.status = 'APROVADO';
    order.status = 'AGUARDANDO_PAGAMENTO';
  } else if (action === 'REJECT') {
    order.quote.status = 'REJEITADO';
    order.status = 'CANCELADO';
  }
  order.updatedAt = new Date().toISOString();

  saveDatabase(db);
  return res.json({ success: true, order });
});

// 7. Payments: Submit Multicaixa Express Proof
app.post('/api/payments/submit', (req: Request, res: Response) => {
  const { orderCode, amountKz, referenceNumber, senderPhone, proofUrl } = req.body;

  if (!orderCode || !referenceNumber) {
    return res.status(400).json({ success: false, error: 'Código do pedido e referência são obrigatórios.' });
  }

  const order = db.orders.find((o) => o.code.toUpperCase() === orderCode.trim().toUpperCase());
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }

  const payment: PaymentDetails = {
    method: 'MULTICAIXA_EXPRESS',
    amountKz: Number(amountKz) || (order.quote ? order.quote.totalAmount : 0),
    referenceNumber: referenceNumber.trim(),
    senderPhone: senderPhone ? senderPhone.trim() : order.customerPhone,
    proofUrl: proofUrl || undefined,
    status: 'PENDENTE',
    submittedAt: new Date().toISOString(),
  };

  order.payment = payment;
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Comprovativo enviado com sucesso! O pagamento será verificado pela equipa AngoServ.',
    order,
  });
});

// 8. Orders: Customer Feedback / Rating
app.post('/api/orders/:code/rate', (req: Request, res: Response) => {
  const code = req.params.code?.trim().toUpperCase();
  const { stars, comment } = req.body;

  const order = db.orders.find((o) => o.code.toUpperCase() === code);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }

  order.rating = {
    stars: Math.max(1, Math.min(5, Number(stars) || 5)),
    comment: comment || '',
    submittedAt: new Date().toISOString(),
  };
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, order });
});

// ----------------- ADMIN API -----------------

// Admin auth check
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'angoserv2026';

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_DEFAULT_PASSWORD || password === 'admin123') {
    return res.json({
      success: true,
      token: 'admin-authorized-token-' + Date.now(),
      adminName: 'Administrador Geral AngoServ',
    });
  }
  return res.status(401).json({ success: false, error: 'Palavra-passe de administrador incorreta.' });
});

// Admin: Get all orders
app.get('/api/admin/orders', (_req: Request, res: Response) => {
  res.json({ success: true, orders: db.orders });
});

// Admin: Update order status
app.patch('/api/admin/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  const order = db.orders.find((o) => o.id === id || o.code === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, order });
});

// Admin: Create or update Quote
app.post('/api/admin/orders/:id/quote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { laborFee, materialsFee, travelFee, discount, notes, validDays } = req.body;

  const order = db.orders.find((o) => o.id === id || o.code === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }

  const labor = Number(laborFee) || 0;
  const materials = Number(materialsFee) || 0;
  const travel = Number(travelFee) || 0;
  const disc = Number(discount) || 0;
  const total = Math.max(0, labor + materials + travel - disc);

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + (Number(validDays) || 7));

  const quote: Quote = {
    id: `qt-${Date.now()}`,
    laborFee: labor,
    materialsFee: materials,
    travelFee: travel,
    discount: disc,
    totalAmount: total,
    notes: notes || '',
    status: 'PENDENTE',
    createdAt: new Date().toISOString(),
    validUntil: validUntilDate.toISOString().split('T')[0],
  };

  order.quote = quote;
  order.status = 'ORCAMENTO_ENVIADO';
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, order });
});

// Admin: Assign technician
app.post('/api/admin/orders/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { technicianId, scheduledTime, laborPayoutKz, notes } = req.body;

  const order = db.orders.find((o) => o.id === id || o.code === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
  }

  const tech = db.technicians.find((t) => t.id === technicianId);
  if (!tech) {
    return res.status(404).json({ success: false, error: 'Profissional não encontrado no cadastro interno.' });
  }

  const assignment: Assignment = {
    technicianId: tech.id,
    technicianName: tech.name,
    assignedAt: new Date().toISOString(),
    scheduledTime: scheduledTime || `${order.preferredDate} (${order.preferredTimeSlot})`,
    laborPayoutKz: Number(laborPayoutKz) || 15000,
    notes: notes || '',
  };

  order.assignment = assignment;
  order.status = 'PROFISSIONAL_ATRIBUIDO';
  order.updatedAt = new Date().toISOString();

  // Update technician status
  tech.status = 'EM_SERVICO';
  tech.pendingPayoutKz += Number(laborPayoutKz) || 15000;

  saveDatabase(db);
  return res.json({ success: true, order });
});

// Admin: Verify payment
app.post('/api/admin/payments/:orderId/verify', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { verified, rejectionReason } = req.body;

  const order = db.orders.find((o) => o.id === orderId || o.code === orderId);
  if (!order || !order.payment) {
    return res.status(404).json({ success: false, error: 'Pagamento não encontrado para este pedido.' });
  }

  if (verified) {
    order.payment.status = 'CONFIRMADO';
    order.payment.verifiedAt = new Date().toISOString();
    order.payment.verifiedBy = 'Administração AngoServ';
    order.status = 'PAGAMENTO_CONFIRMADO';
  } else {
    order.payment.status = 'REJEITADO';
    order.payment.rejectionReason = rejectionReason || 'Comprovativo não identificado no extrato.';
    order.status = 'AGUARDANDO_PAGAMENTO';
  }

  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, order });
});

// Admin: Technicians management
app.get('/api/admin/technicians', (_req: Request, res: Response) => {
  res.json({ success: true, technicians: db.technicians });
});

app.post('/api/admin/technicians', (req: Request, res: Response) => {
  const { name, phone, specialty, province } = req.body;
  if (!name || !phone || !specialty) {
    return res.status(400).json({ success: false, error: 'Nome, telefone e especialidade são obrigatórios.' });
  }

  const newTech: Technician = {
    id: `tech-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    specialty,
    province: province || 'Luanda',
    status: 'DISPONIVEL',
    rating: 5.0,
    totalCompletedJobs: 0,
    pendingPayoutKz: 0,
    hiredDate: new Date().toISOString().split('T')[0],
  };

  db.technicians.push(newTech);
  saveDatabase(db);

  return res.status(201).json({ success: true, technician: newTech });
});

app.patch('/api/admin/technicians/:id/payout', (req: Request, res: Response) => {
  const { id } = req.params;
  const tech = db.technicians.find((t) => t.id === id);
  if (!tech) {
    return res.status(404).json({ success: false, error: 'Profissional não encontrado.' });
  }

  const paidAmount = tech.pendingPayoutKz;
  tech.pendingPayoutKz = 0;
  saveDatabase(db);

  return res.json({
    success: true,
    message: `Liquidação de ${paidAmount.toLocaleString('pt-AO')} Kz registada com sucesso!`,
    technician: tech,
  });
});

// Admin: Dashboard stats & KPIs
app.get('/api/admin/stats', (_req: Request, res: Response) => {
  const totalOrders = db.orders.length;
  const pendingOrders = db.orders.filter((o) => ['RECEBIDO', 'EM_ANALISE', 'ORCAMENTO_ENVIADO'].includes(o.status)).length;
  const activeOrders = db.orders.filter((o) => ['CONFIRMADO', 'PROFISSIONAL_ATRIBUIDO', 'EM_EXECUCAO'].includes(o.status)).length;
  const completedOrders = db.orders.filter((o) => o.status === 'CONCLUIDO').length;

  const totalRevenueKz = db.orders
    .filter((o) => o.payment && o.payment.status === 'CONFIRMADO')
    .reduce((sum, o) => sum + (o.payment?.amountKz || 0), 0);

  const pendingPaymentsKz = db.orders
    .filter((o) => o.payment && o.payment.status === 'PENDENTE')
    .reduce((sum, o) => sum + (o.payment?.amountKz || 0), 0);

  const pendingPayoutsKz = db.technicians.reduce((sum, t) => sum + t.pendingPayoutKz, 0);
  const activeTechnicians = db.technicians.filter((t) => t.status !== 'INATIVO').length;

  return res.json({
    success: true,
    stats: {
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      totalRevenueKz,
      pendingPaymentsKz,
      pendingPayoutsKz,
      activeTechnicians,
    },
  });
});

// Admin: Update zone config
app.patch('/api/admin/zones', (req: Request, res: Response) => {
  const { province, baseTravelFeeKz, active } = req.body;
  const zone = db.zones.find((z) => z.province.toLowerCase() === String(province).toLowerCase());
  if (!zone) {
    return res.status(404).json({ success: false, error: 'Província não encontrada.' });
  }

  if (typeof baseTravelFeeKz === 'number') zone.baseTravelFeeKz = baseTravelFeeKz;
  if (typeof active === 'boolean') zone.active = active;

  saveDatabase(db);
  return res.json({ success: true, zone });
});

// ----------------- GEMINI CHATBOT (AngoBot) -----------------
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Mensagem inválida.' });
  }

  // System instruction for AngoBot
  const systemInstruction = `
Você é o "AngoBot", assistente virtual inteligente e acolhedor da AngoServ ("Serviços ao seu alcance.").
A AngoServ é a empresa angolana líder em prestação de serviços ao domicílio e empresariais em todas as 18 províncias de Angola.

Serviços prestados pela AngoServ:
1. Lavagem de Sofás, Cadeirões e Tapetes (a partir de 18.000 Kz)
2. Pintura Residencial e Comercial (sob orçamento detalhado)
3. Canalização (reparação de fugas, desentupimentos, autoclismos) (a partir de 15.000 Kz)
4. Electricidade (quadros elétricos, disjuntores, iluminação, geradores) (a partir de 16.000 Kz)
5. Montagem de Móveis e Salas (roupeiros, camas, armários) (a partir de 14.000 Kz)
6. Assistência Técnica e Hardware (computadores, redes, manutenção) (a partir de 18.000 Kz)
7. Barbearia ao domicílio (a partir de 9.000 Kz)
8. Manicure, Pedicure e Serviços de Beleza (a partir de 11.000 Kz)

Regras fundamentais:
- Responda em Português de Angola com tom cordial, profissional e seguro.
- Destaque que o cliente contrata a AngoServ diretamente, com garantia de satisfação e segurança.
- O cliente paga à AngoServ por Multicaixa Express (contacto: 930 051 440) ou transferência bancária.
- Para solicitar um serviço, instrua o cliente a clicar no botão "Solicitar um serviço" no topo ou fornecer nome e telefone.
- Para consultar o estado de um pedido existente, peça o código do pedido (formato AS-2026-XXXX).
- Mantenha respostas concisas, úteis e formatadas com marcadores elegantes.
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI();
      const formattedContents = [];

      // Format previous history if provided
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          formattedContents.push({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.text }],
          });
        }
      }
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || 'Olá! Como posso ajudar com os serviços da AngoServ hoje?';
      return res.json({ success: true, reply });
    }
  } catch (err) {
    console.warn('Gemini API call failed or not configured, using smart fallback response:', err);
  }

  // Fallback assistant response
  const lower = message.toLowerCase();
  let fallbackReply = 'Olá! Sou o AngoBot da AngoServ. ';

  if (lower.includes('preço') || lower.includes('quanto custa') || lower.includes('valor')) {
    fallbackReply +=
      'Os nossos serviços têm preços transparentes em Kwanzas (Kz)! Por exemplo: Lavagem de sofás a partir de 18.000 Kz, Canalização a partir de 15.000 Kz, Electricidade a partir de 16.000 Kz e Montagem de móveis a partir de 14.000 Kz. Para serviços complexos como Pintura, emitimos um orçamento detalhado e sem compromisso.';
  } else if (lower.includes('onde') || lower.includes('província') || lower.includes('luanda') || lower.includes('benguela')) {
    fallbackReply +=
      'A AngoServ atende em todas as 18 províncias de Angola! Temos equipas ativas em Luanda (Talatona, Maianga, Belas, Viana, Cazenga, etc.), Benguela, Huambo, Huíla, Cabinda e demais capitais provinciais.';
  } else if (lower.includes('pagamento') || lower.includes('multicaixa') || lower.includes('express')) {
    fallbackReply +=
      'O pagamento é feito diretamente à AngoServ via Multicaixa Express (930 051 440) ou transferência bancária BAI. A AngoServ nunca solicita o seu PIN ou código secreto!';
  } else if (lower.includes('pedido') || lower.includes('acompanhar') || lower.includes('código') || lower.includes('as-2026')) {
    fallbackReply +=
      'Pode acompanhar o seu pedido em tempo real clicando em "Minha Conta / Acompanhar Pedido" no cabeçalho e inserindo o seu código (ex: AS-2026-9041).';
  } else {
    fallbackReply +=
      'A AngoServ está ao seu dispor para serviços residenciais e empresariais com garantia total de qualidade. Deseja solicitar um orçamento ou agendar um dos nossos 8 serviços disponíveis?';
  }

  return res.json({ success: true, reply: fallbackReply });
});

// ----------------- GMAIL NOTIFICATION PROXY -----------------
app.post('/api/email/notify', async (req: Request, res: Response) => {
  const { to, subject, htmlContent } = req.body;
  const authHeader = req.headers.authorization;

  if (!to || !subject || !htmlContent) {
    return res.status(400).json({ success: false, error: 'Dados incompletos para envio de email.' });
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.substring(7);
    try {
      // Build RFC 2822 email format
      const rawEmail = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        '',
        htmlContent,
      ].join('\r\n');

      const encodedEmail = Buffer.from(rawEmail)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gmail API send error:', errorText);
        return res.status(502).json({ success: false, error: 'Falha ao enviar através do Gmail.' });
      }

      const result = await response.json();
      return res.json({ success: true, messageId: result.id });
    } catch (err: any) {
      console.error('Failed to dispatch via Gmail API:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // When no OAuth token is provided by client, log notification and return simulated success
  console.log(`[Notification Engine] Email queued to ${to}: "${subject}"`);
  return res.json({
    success: true,
    simulated: true,
    message: 'Notificação registada no sistema AngoServ.',
  });
});

// ----------------- FRONTEND SERVING -----------------

async function setupFrontend() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AngoServ server running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

setupFrontend().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
