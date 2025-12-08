'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase'; // Importação do Supabase
import { User, Service, Invoice, Ticket, Product, Order } from '@/lib/types';
import Navbar from '@/components/custom/navbar';
import AuthForm from '@/components/custom/auth-form';
import ServerControlPanel from '@/components/custom/server-control-panel';
import { 
  Server, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Activity, 
  Calendar, 
  ShoppingCart, 
  CreditCard, 
  QrCode, 
  Barcode, 
  Plus, 
  Check, 
  X, 
  Settings, 
  Users, 
  Package, 
  Terminal, 
  ShieldCheck, 
  Wifi, 
  Cpu, 
  Globe, 
  Key, 
  Trash2,
  Copy,       // Ícone novo
  RefreshCw   // Ícone novo
} from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Estados para checkout
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');
  const [showCheckout, setShowCheckout] = useState(false);

  // --- ESTADOS DE LICENÇAS (USUÁRIO) ---
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState('');

  // --- ESTADOS DE ADMIN (GERADOR) ---
  const [generatedKey, setGeneratedKey] = useState('');
  const [adminLicenses, setAdminLicenses] = useState<any[]>([]);

  // --- ESTADO DAEMON (VPS) ---
  const [daemonStatus, setDaemonStatus] = useState({
    connected: false,
    licenseValid: false,
    latency: 0,
    version: '-',
    lastSync: '-',
    vpsHealth: { cpu: 0, ram: 0 }
  });

  // ==================================================================================
  // 1. LÓGICA DO ADMIN (GERAR LICENÇAS)
  // ==================================================================================
  
  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) key += '-';
    }
    setGeneratedKey(key);
  };

  const handleAdminCreateLicense = async () => {
    if (!generatedKey) return alert('Gere uma chave primeiro.');

    const { error } = await supabase
      .from('licenses')
      .insert([
        { 
          key_code: generatedKey,
          status: 'unclaimed', 
          user_id: null,       
          expires_at: null     
        }
      ]);

    if (error) {
      alert('Erro ao criar: ' + error.message);
    } else {
      alert(`Licença ${generatedKey} criada! Copie e envie para o cliente.`);
      fetchAdminLicenses();
      setGeneratedKey('');
    }
  };

  const fetchAdminLicenses = async () => {
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });
    setAdminLicenses(data || []);
  };

  // Carrega lista do admin se estiver na aba admin
  useEffect(() => {
    if (currentPage === 'admin' && currentUser?.role === 'admin') {
      fetchAdminLicenses();
    }
  }, [currentPage, currentUser]);


  // ==================================================================================
  // 2. LÓGICA DO CLIENTE (RESGATAR E VERIFICAR LICENÇAS)
  // ==================================================================================

  // Carrega licenças do usuário ao logar
  useEffect(() => {
    if (currentUser) {
      fetchLicenses();
    }
  }, [currentUser]);

  const fetchLicenses = async () => {
    if (!currentUser) return;
    setLoadingLicenses(true);
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (!error) setLicenses(data || []);
    setLoadingLicenses(false);
  };

  const handleRedeemLicense = async () => {
    if (!newLicenseKey) return alert('Digite uma chave de licença');
    if (!currentUser) return;

    // 1. Busca licença livre
    const { data: license, error: searchError } = await supabase
      .from('licenses')
      .select('*')
      .eq('key_code', newLicenseKey)
      .single();

    if (searchError || !license) return alert('Licença inválida ou não encontrada.');
    if (license.status !== 'unclaimed') return alert('Esta licença já foi utilizada ou não está disponível.');

    // 2. Vincula ao usuário
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ 
        user_id: currentUser.id, 
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', license.id);

    if (updateError) {
      alert('Erro ao ativar: ' + updateError.message);
    } else {
      alert('Licença ativada com sucesso!');
      setNewLicenseKey('');
      fetchLicenses();
    }
  };

  const handleRevokeLicense = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta licença da sua conta?')) return;
    const { error } = await supabase
      .from('licenses')
      .update({ status: 'revoked' }) 
      .eq('id', id);

    if (error) alert('Erro: ' + error.message);
    else fetchLicenses();
  };

  // Verifica se existe pelo menos uma licença ativa
  const hasActiveLicense = licenses.some(l => l.status === 'active');


  // ==================================================================================
  // 3. DAEMON (CONEXÃO COM VPS)
  // ==================================================================================
  useEffect(() => {
    if (!mounted || !currentUser) return;
    const fetchDaemonData = async () => {
      const startTime = Date.now();
      try {
        // ⚠️ Troque pelo IP real da sua VPS
        const response = await fetch('http://SEU_IP_DA_VPS:PORTA/status', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(4000) 
        });
        if (!response.ok) throw new Error('Erro');
        const data = await response.json();
        const endTime = Date.now();
        setDaemonStatus({
          connected: true,
          licenseValid: data.license_active === true, 
          latency: endTime - startTime,
          version: data.version || 'v1.0.0',
          lastSync: new Date().toLocaleTimeString(),
          vpsHealth: { cpu: Number(data.cpu_usage)||0, ram: Number(data.ram_usage)||0 }
        });
      } catch (error) {
        setDaemonStatus(prev => ({ ...prev, connected: false, latency: 0, lastSync: 'Offline' }));
      }
    };
    fetchDaemonData();
    const interval = setInterval(fetchDaemonData, 5000);
    return () => clearInterval(interval);
  }, [mounted, currentUser]);


  // ==================================================================================
  // 4. FUNÇÕES DE SISTEMA (LOGIN, CHECKOUT, ETC)
  // ==================================================================================
  useEffect(() => {
    setMounted(true);
    storage.init();
    const user = storage.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadUserData(user.id);
    }
    setProducts(storage.getProducts());
  }, []);

  const loadUserData = (userId: string) => {
    setServices(storage.getServices(userId));
    setInvoices(storage.getInvoices(userId));
    setTickets(storage.getTickets(userId));
    setOrders(storage.getOrders(userId));
  };

  const handleLogin = (email: string, password: string) => {
    const user = storage.login(email, password);
    if (user) {
      // ⚠️ TRAPAÇA PARA TESTES: Força admin. Remova esta linha em produção.
      user.role = 'admin'; 
      
      setCurrentUser(user);
      loadUserData(user.id);
    } else {
      alert('Credenciais inválidas');
    }
  };

  const handleRegister = (userData: Omit<User, 'id' | 'createdAt' | 'emailVerified'>) => {
    const newUser = storage.register(userData);
    alert('Conta criada!');
    setCurrentUser(newUser);
    loadUserData(newUser.id);
  };

  const handleForgotPassword = (email: string) => {
    alert('Funcionalidade de recuperar senha simulada.');
  };

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
    setServices([]);
    setInvoices([]);
    setTickets([]);
    setOrders([]);
    setCurrentPage('dashboard');
  };

  const handleBuyProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleCompleteCheckout = () => {
    if (!currentUser || !selectedProduct) return;
    const order = storage.createOrder({
      userId: currentUser.id,
      productId: selectedProduct.id,
      amount: selectedProduct.price,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
    });
    const invoice = storage.createInvoice({
      userId: currentUser.id,
      serviceId: order.id,
      amount: selectedProduct.price,
      status: 'unpaid',
      description: `Pagamento - ${selectedProduct.name}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod,
    });
    setTimeout(() => {
      storage.updateOrder(order.id, { 
        status: 'completed', paymentStatus: 'paid', completedAt: new Date().toISOString(),
      });
      storage.updateInvoice(invoice.id, { 
        status: 'paid', paidDate: new Date().toISOString(),
      });
      const gameServerConfig = (selectedProduct.type === 'mta-server' || selectedProduct.type === 'samp-server') ? {
        serverIp: '192.168.1.100',
        serverPort: selectedProduct.type === 'mta-server' ? 22003 : 7777,
        rconPassword: Math.random().toString(36).substring(2, 15),
        serverPassword: '',
        serverName: `${currentUser.name}'s Server`,
        gameMode: 'freeroam',
        maxPlayers: 100,
        currentPlayers: 0,
        resources: [],
        machineSpecs: { cpu: '4 vCPU', ram: '8 GB', storage: '50 GB', bandwidth: '1 Gbps', os: 'Ubuntu', location: 'BR' },
        status: 'online' as const,
        uptime: 0,
        lastRestart: new Date().toISOString(),
      } : undefined;

      storage.createService({
        userId: currentUser.id,
        name: selectedProduct.name,
        type: selectedProduct.type,
        status: 'active',
        price: selectedProduct.price,
        billingCycle: selectedProduct.billingCycle,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        gameServerConfig,
      });

      loadUserData(currentUser.id);
      setShowCheckout(false);
      setSelectedProduct(null);
      setCurrentPage('services');
      alert('Pagamento aprovado!');
    }, 2000);
    alert('Processando...');
  };

  const handleManageServer = (service: Service) => {
    // BLOQUEIO: Se não tiver licença, não gerencia servidor
    if (!hasActiveLicense) {
      alert('ACESSO NEGADO: Você precisa de uma licença ativa.');
      setCurrentPage('licenses');
      return;
    }
    setSelectedService(service);
  };

  if (!mounted) return null;

  if (!currentUser) {
    return (
      <AuthForm onLogin={handleLogin} onRegister={handleRegister} onForgotPassword={handleForgotPassword} />
    );
  }

  const activeServices = services.filter(s => s.status === 'active').length;
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'customer-reply').length;
  const totalSpent = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

  // =========================================================
  // RENDERIZAÇÃO DAS PÁGINAS
  // =========================================================

  // --- DASHBOARD ---
  if (currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo, {currentUser.name}!</h1>
            <p className="text-slate-400">Gerencie seus serviços de hospedagem</p>
          </div>

          {/* Cards Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-lg">
               <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-white/20 rounded-lg"><Server className="w-6 h-6 text-white" /></div>
                 <TrendingUp className="w-5 h-5 text-blue-200" />
               </div>
               <h3 className="text-3xl font-bold text-white mb-1">{activeServices}</h3>
               <p className="text-blue-100 text-sm">Serviços Ativos</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
                <AlertCircle className="w-5 h-5 text-amber-200" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{unpaidInvoices.length}</h3>
              <p className="text-amber-100 text-sm">Faturas Pendentes</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg"><MessageSquare className="w-6 h-6 text-white" /></div>
                <Activity className="w-5 h-5 text-purple-200" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{openTickets}</h3>
              <p className="text-purple-100 text-sm">Tickets Abertos</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg"><DollarSign className="w-6 h-6 text-white" /></div>
                <CheckCircle className="w-5 h-5 text-emerald-200" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">R$ {totalSpent.toFixed(2)}</h3>
              <p className="text-emerald-100 text-sm">Total Pago</p>
            </div>
          </div>

          {/* Status Licença e Daemon */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity ${daemonStatus.connected ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              
              {/* Botão que leva para Licenças */}
              <button 
                onClick={() => setCurrentPage('licenses')}
                className="flex items-center gap-4 hover:bg-slate-800/50 p-2 rounded-xl transition-all text-left cursor-pointer border border-transparent hover:border-slate-700"
              >
                <div className={`p-4 rounded-xl ${daemonStatus.licenseValid ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-slate-800'}`}>
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Licença {daemonStatus.licenseValid ? 'Validada' : 'Inativa'}
                  </h3>
                  <p className="text-slate-400 text-sm font-mono mt-1">Clique para gerenciar</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${daemonStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {daemonStatus.connected ? 'Online' : 'Offline'}
                  </div>
                </div>
              </button>
              
              {/* Infos Daemon */}
              <div className="flex-1 w-full md:w-auto md:border-l md:border-r border-slate-800 md:px-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Wifi className="w-3 h-3" /> Latência</p>
                    <p className={`text-xl font-bold ${daemonStatus.latency < 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{daemonStatus.latency}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Versão</p>
                    <p className="text-xl font-bold text-white">{daemonStatus.version}</p>
                  </div>
                </div>
              </div>

              {/* Recursos VPS */}
              <div className="w-full md:w-auto min-w-[200px]">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU</span>
                      <span className="text-blue-400 font-bold">{daemonStatus.vpsHealth.cpu}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${daemonStatus.vpsHealth.cpu}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">RAM</span>
                      <span className="text-purple-400 font-bold">{daemonStatus.vpsHealth.ram}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${daemonStatus.vpsHealth.ram}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Meus Serviços */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
             <div className="text-center py-8">
               <p className="text-slate-400">Verifique a aba "Serviços" para detalhes.</p>
             </div>
          </div>
        </main>
      </div>
    );
  }

  // --- LICENÇAS (CLIENTE) ---
  if (currentPage === 'licenses') {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8"><h1 className="text-3xl font-bold text-white">Gerenciar Licenças</h1></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Resgatar Código</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={newLicenseKey}
                onChange={(e) => setNewLicenseKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2"
              />
              <button onClick={handleRedeemLicense} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2">
                <Key className="w-4 h-4" /> Resgatar
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800"><h2 className="text-lg font-semibold text-white">Minhas Chaves</h2></div>
            {licenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Nenhuma licença ativa.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="bg-slate-950 text-slate-200 uppercase">
                    <tr><th className="px-6 py-4">Chave</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {licenses.map((lic) => (
                      <tr key={lic.id}>
                        <td className="px-6 py-4 font-mono text-white">{lic.key_code}</td>
                        <td className="px-6 py-4"><span className="text-emerald-400 font-bold">{lic.status.toUpperCase()}</span></td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleRevokeLicense(lic.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // --- ADMIN (GERADOR) ---
  if (currentPage === 'admin' && currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8"><h1 className="text-3xl font-bold text-white">Painel Admin</h1></div>

          {/* Gerador */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Key className="w-5 h-5 text-emerald-500" /> Gerador de Licenças</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <code className="text-xl font-mono text-white tracking-wider">{generatedKey || 'XXXX-XXXX-XXXX-XXXX'}</code>
                <div className="flex gap-2">
                  <button onClick={generateRandomKey} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white" title="Gerar Nova"><RefreshCw className="w-5 h-5" /></button>
                  {generatedKey && <button onClick={() => {navigator.clipboard.writeText(generatedKey); alert('Copiado!')}} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Copy className="w-5 h-5" /></button>}
                </div>
              </div>
              <button onClick={handleAdminCreateLicense} disabled={!generatedKey} className={`px-8 py-4 font-bold rounded-lg flex items-center gap-2 ${generatedKey ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                <Plus className="w-5 h-5" /> CRIAR
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-slate-200">
                  <tr><th className="px-4 py-3">Chave</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">User ID</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {adminLicenses.map((lic) => (
                    <tr key={lic.id}>
                      <td className="px-4 py-3 font-mono text-white">{lic.key_code}</td>
                      <td className="px-4 py-3"><span className={`font-bold ${lic.status==='active'?'text-emerald-400':lic.status==='unclaimed'?'text-blue-400':'text-red-400'}`}>{lic.status.toUpperCase()}</span></td>
                      <td className="px-4 py-3 text-xs font-mono">{lic.user_id ? lic.user_id : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- OUTRAS PÁGINAS (SHOP, SERVICES) ---
  if (currentPage === 'shop') return <div className="min-h-screen bg-slate-950"><Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage} />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8"><h1 className="text-3xl font-bold text-white mb-2">Loja</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-4"><div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"><Server className="w-6 h-6 text-white" /></div></div>
            <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
            <p className="text-slate-400 text-sm mb-4">{product.description}</p>
            <div className="mb-6"><div className="flex items-baseline gap-2 mb-1"><span className="text-3xl font-bold text-white">R$ {product.price.toFixed(2)}</span><span className="text-slate-400">/{product.billingCycle === 'monthly' ? 'mês' : 'ano'}</span></div></div>
            <button onClick={() => handleBuyProduct(product)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all">Contratar Agora</button>
          </div>
        ))}
      </div>
    </main>
    {/* Modal Checkout simplificado aqui se precisar */}
    {showCheckout && selectedProduct && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Finalizar Compra: {selectedProduct.name}</h2>
          <button onClick={handleCompleteCheckout} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Pagar Agora</button>
          <button onClick={() => setShowCheckout(false)} className="w-full py-3 mt-2 text-slate-400 hover:text-white">Cancelar</button>
        </div>
      </div>
    )}
  </div>;

  if (currentPage === 'services') return <div className="min-h-screen bg-slate-950"><Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage} />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Meus Serviços</h1>
        <button onClick={()=>{
          if (!hasActiveLicense) { alert('Você precisa de uma licença ativa.'); setCurrentPage('licenses'); return; }
          setCurrentPage('shop');
        }} className={`px-4 py-2 text-white font-medium rounded-lg ${!hasActiveLicense ? 'bg-slate-700 cursor-not-allowed':'bg-blue-600 hover:bg-blue-700'}`}>Novo Serviço</button>
      </div>
      {services.length === 0 ? <div className="text-center text-slate-400 py-12">Nenhum serviço.</div> : 
        <div className="grid grid-cols-1 gap-6">{services.map(s => <div key={s.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800"><h3 className="text-white font-bold">{s.name}</h3><button onClick={()=>handleManageServer(s)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Gerenciar</button></div>)}</div>
      }
    </main>
    {selectedService && <ServerControlPanel service={selectedService} onClose={() => setSelectedService(null)} />}
  </div>;

  // Fallback genérico
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2 className="text-2xl font-bold text-white">Página em Desenvolvimento</h2>
      </main>
    </div>
  );
}
