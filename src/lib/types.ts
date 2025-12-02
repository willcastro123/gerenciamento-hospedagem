// Tipos do Sistema WHMCS

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'client' | 'admin';
  cpf?: string;
  phone?: string;
  address?: Address;
  createdAt: string;
  emailVerified: boolean;
  resetToken?: string;
  resetTokenExpiry?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Service {
  id: string;
  userId: string;
  name: string;
  type: 'mta-server' | 'samp-server' | 'shared' | 'vps' | 'dedicated' | 'cloud';
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'semiannually' | 'annually';
  domain?: string;
  nextDueDate: string;
  createdAt: string;
  gameServerConfig?: GameServerConfig;
}

export interface GameServerConfig {
  serverIp: string;
  serverPort: number;
  rconPassword: string;
  serverPassword?: string;
  serverName: string;
  gameMode: string;
  maxPlayers: number;
  currentPlayers: number;
  resources: string[];
  machineSpecs: MachineSpecs;
  status: 'online' | 'offline' | 'starting' | 'stopping';
  uptime: number;
  lastRestart?: string;
}

export interface MachineSpecs {
  cpu: string;
  ram: string;
  storage: string;
  bandwidth: string;
  os: string;
  location: string;
}

export interface Invoice {
  id: string;
  userId: string;
  serviceId: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'cancelled' | 'refunded';
  description: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'boleto';
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  department: 'technical' | 'billing' | 'sales' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'answered' | 'customer-reply' | 'closed';
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
  attachments?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  type: 'mta-server' | 'samp-server' | 'shared' | 'vps' | 'dedicated' | 'cloud';
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'semiannually' | 'annually';
  features: string[];
  specs?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    bandwidth?: string;
    slots?: number;
  };
  available: boolean;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: 'mercadopago' | 'nubank';
  enabled: boolean;
  credentials: {
    publicKey?: string;
    accessToken?: string;
    clientId?: string;
    clientSecret?: string;
  };
  supportedMethods: ('pix' | 'credit_card' | 'boleto')[];
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
}
