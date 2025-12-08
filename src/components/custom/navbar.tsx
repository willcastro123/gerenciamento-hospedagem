'use client';

import { User } from '@/lib/types';
import { 
  LogOut, 
  Server, 
  ShoppingCart, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  Shield, 
  Key // <--- O Ícone da chave está aqui
} from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ user, onLogout, currentPage, onNavigate }: NavbarProps) {
  // AQUI É ONDE OS BOTÕES SÃO DEFINIDOS
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Serviços', icon: Server },
    { id: 'shop', label: 'Loja', icon: ShoppingCart },
    // 👇 ADICIONE ESTA LINHA PARA O BOTÃO APARECER 👇
    { id: 'licenses', label: 'Licenças', icon: Key }, 
    // 👆 ---------------------------------------- 👆
    { id: 'invoices', label: 'Faturas', icon: FileText },
    { id: 'tickets', label: 'Suporte', icon: MessageSquare },
  ];

  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">HostMaster</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Menu Mobile */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
