// Sistema de Storage Local (será substituído por Supabase)
import { User, Service, Invoice, Ticket, Product, Order } from './types';

class StorageManager {
  private readonly STORAGE_KEYS = {
    USERS: 'whmcs_users',
    SERVICES: 'whmcs_services',
    INVOICES: 'whmcs_invoices',
    TICKETS: 'whmcs_tickets',
    PRODUCTS: 'whmcs_products',
    ORDERS: 'whmcs_orders',
    CURRENT_USER: 'whmcs_current_user',
  };

  init() {
    if (typeof window === 'undefined') return;

    // Inicializar dados de exemplo se não existirem
    if (!localStorage.getItem(this.STORAGE_KEYS.USERS)) {
      this.seedData();
    }
  }

  private seedData() {
    const demoUsers: User[] = [
      {
        id: '1',
        email: 'cliente@exemplo.com',
        password: 'senha123',
        name: 'João Silva',
        role: 'client',
        cpf: '123.456.789-00',
        phone: '(11) 98765-4321',
        address: {
          street: 'Rua das Flores',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          country: 'Brasil',
        },
        createdAt: new Date().toISOString(),
        emailVerified: true,
      },
      {
        id: '2',
        email: 'admin@hostmaster.com',
        password: 'admin123',
        name: 'Admin Master',
        role: 'admin',
        createdAt: new Date().toISOString(),
        emailVerified: true,
      },
    ];

    const demoProducts: Product[] = [
      {
        id: 'p1',
        name: 'Servidor MTA Básico',
        description: 'Servidor MTA:SA com 50 slots',
        type: 'mta-server',
        price: 29.90,
        billingCycle: 'monthly',
        features: ['50 slots', '2GB RAM', 'DDoS Protection', 'Suporte 24/7'],
        specs: {
          ram: '2GB',
          slots: 50,
        },
        available: true,
      },
      {
        id: 'p2',
        name: 'Servidor MTA Premium',
        description: 'Servidor MTA:SA com 100 slots',
        type: 'mta-server',
        price: 49.90,
        billingCycle: 'monthly',
        features: ['100 slots', '4GB RAM', 'DDoS Protection', 'Suporte Prioritário', 'Backup Diário'],
        specs: {
          ram: '4GB',
          slots: 100,
        },
        available: true,
      },
      {
        id: 'p3',
        name: 'Servidor SAMP Básico',
        description: 'Servidor SA-MP com 50 slots',
        type: 'samp-server',
        price: 24.90,
        billingCycle: 'monthly',
        features: ['50 slots', '2GB RAM', 'DDoS Protection', 'Suporte 24/7'],
        specs: {
          ram: '2GB',
          slots: 50,
        },
        available: true,
      },
      {
        id: 'p4',
        name: 'Servidor SAMP Premium',
        description: 'Servidor SA-MP com 100 slots',
        type: 'samp-server',
        price: 44.90,
        billingCycle: 'monthly',
        features: ['100 slots', '4GB RAM', 'DDoS Protection', 'Suporte Prioritário', 'Backup Diário'],
        specs: {
          ram: '4GB',
          slots: 100,
        },
        available: true,
      },
    ];

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
    localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(demoProducts));
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify([]));
    localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }

  // Autenticação
  login(email: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    
    return null;
  }

  register(userData: Omit<User, 'id' | 'createdAt' | 'emailVerified'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      emailVerified: false,
    };
    
    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return newUser;
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  requestPasswordReset(email: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.email === email);
    
    if (userIndex !== -1) {
      const resetToken = Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hora
      
      users[userIndex].resetToken = resetToken;
      users[userIndex].resetTokenExpiry = resetTokenExpiry;
      
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Em produção, enviaria email aqui
      console.log(`Token de recuperação: ${resetToken}`);
      return true;
    }
    
    return false;
  }

  resetPassword(token: string, newPassword: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(
      (u) => u.resetToken === token && u.resetTokenExpiry && new Date(u.resetTokenExpiry) > new Date()
    );
    
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      users[userIndex].resetToken = undefined;
      users[userIndex].resetTokenExpiry = undefined;
      
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    }
    
    return false;
  }

  verifyEmail(userId: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].emailVerified = true;
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    }
    
    return false;
  }

  // Usuários
  getUsers(): User[] {
    const usersStr = localStorage.getItem(this.STORAGE_KEYS.USERS);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  // Produtos
  getProducts(): Product[] {
    const productsStr = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
    return productsStr ? JSON.parse(productsStr) : [];
  }

  getProductById(id: string): Product | null {
    const products = this.getProducts();
    return products.find((p) => p.id === id) || null;
  }

  // Serviços
  getServices(userId?: string): Service[] {
    const servicesStr = localStorage.getItem(this.STORAGE_KEYS.SERVICES);
    const services: Service[] = servicesStr ? JSON.parse(servicesStr) : [];
    
    if (userId) {
      return services.filter((s) => s.userId === userId);
    }
    
    return services;
  }

  createService(service: Omit<Service, 'id' | 'createdAt'>): Service {
    const services = this.getServices();
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    services.push(newService);
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));
    
    return newService;
  }

  updateService(id: string, updates: Partial<Service>): Service | null {
    const services = this.getServices();
    const index = services.findIndex((s) => s.id === id);
    
    if (index !== -1) {
      services[index] = { ...services[index], ...updates };
      localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));
      return services[index];
    }
    
    return null;
  }

  // Faturas
  getInvoices(userId?: string): Invoice[] {
    const invoicesStr = localStorage.getItem(this.STORAGE_KEYS.INVOICES);
    const invoices: Invoice[] = invoicesStr ? JSON.parse(invoicesStr) : [];
    
    if (userId) {
      return invoices.filter((i) => i.userId === userId);
    }
    
    return invoices;
  }

  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Invoice {
    const invoices = this.getInvoices();
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    invoices.push(newInvoice);
    localStorage.setItem(this.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    
    return newInvoice;
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === id);
    
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updates };
      localStorage.setItem(this.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
      return invoices[index];
    }
    
    return null;
  }

  // Tickets
  getTickets(userId?: string): Ticket[] {
    const ticketsStr = localStorage.getItem(this.STORAGE_KEYS.TICKETS);
    const tickets: Ticket[] = ticketsStr ? JSON.parse(ticketsStr) : [];
    
    if (userId) {
      return tickets.filter((t) => t.userId === userId);
    }
    
    return tickets;
  }

  createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Ticket {
    const tickets = this.getTickets();
    const newTicket: Ticket = {
      ...ticket,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    tickets.push(newTicket);
    localStorage.setItem(this.STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    
    return newTicket;
  }

  // Pedidos
  getOrders(userId?: string): Order[] {
    const ordersStr = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
    const orders: Order[] = ordersStr ? JSON.parse(ordersStr) : [];
    
    if (userId) {
      return orders.filter((o) => o.userId === userId);
    }
    
    return orders;
  }

  createOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    orders.push(newOrder);
    localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    
    return newOrder;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === id);
    
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return orders[index];
    }
    
    return null;
  }
}

export const storage = new StorageManager();
