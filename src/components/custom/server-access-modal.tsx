'use client';

import { useState } from 'react';
import { Service } from '@/lib/types';
import {
  X,
  Copy,
  CheckCircle,
  Terminal,
  Key,
  Globe,
  Server,
  Shield,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';

interface ServerAccessModalProps {
  service: Service;
  onClose: () => void;
}

export default function ServerAccessModal({ service, onClose }: ServerAccessModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const config = service.gameServerConfig;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const accessInfo = [
    {
      label: 'IP do Servidor',
      value: config?.serverIp || 'N/A',
      icon: Globe,
      field: 'ip',
    },
    {
      label: 'Porta',
      value: config?.serverPort?.toString() || 'N/A',
      icon: Server,
      field: 'port',
    },
    {
      label: 'Senha RCON',
      value: config?.rconPassword || 'Não configurada',
      icon: Key,
      field: 'rcon',
      sensitive: true,
    },
    {
      label: 'Senha do Servidor',
      value: config?.password || 'Sem senha',
      icon: Shield,
      field: 'password',
      sensitive: !!config?.password,
    },
  ];

  const connectionString = `${config?.serverIp}:${config?.serverPort}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Acesso ao Servidor</h2>
            <p className="text-slate-400 text-sm">{service.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conexão Rápida */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-500" />
                Conexão Rápida
              </h3>
              <button
                onClick={() => copyToClipboard(connectionString, 'connection')}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {copiedField === 'connection' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-emerald-400">
              {connectionString}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Cole este endereço no {service.type === 'mta-server' ? 'MTA:SA' : 'SA-MP'} para conectar
            </p>
          </div>

          {/* Informações de Acesso */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Informações de Acesso
            </h3>

            {accessInfo.map((info) => (
              <div
                key={info.field}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <info.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{info.label}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(info.value, info.field)}
                    className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                  >
                    {copiedField === info.field ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
                <div className={`font-mono text-white ${info.sensitive ? 'select-all' : ''}`}>
                  {info.sensitive && info.value !== 'Não configurada' && info.value !== 'Sem senha'
                    ? '••••••••••••'
                    : info.value}
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes do Servidor */}
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Detalhes do Servidor</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400">Nome:</span>
                <p className="text-white font-medium">{config?.serverName}</p>
              </div>
              <div>
                <span className="text-slate-400">Modo de Jogo:</span>
                <p className="text-white font-medium">{config?.gameMode}</p>
              </div>
              <div>
                <span className="text-slate-400">Versão:</span>
                <p className="text-white font-medium">{config?.version}</p>
              </div>
              <div>
                <span className="text-slate-400">Jogadores:</span>
                <p className="text-white font-medium">
                  {config?.currentPlayers}/{config?.maxPlayers}
                </p>
              </div>
              {config?.mapName && (
                <div className="col-span-2">
                  <span className="text-slate-400">Mapa:</span>
                  <p className="text-white font-medium">{config.mapName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Como Conectar */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-500" />
              Como Conectar
            </h3>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>
                  Baixe e instale o {service.type === 'mta-server' ? 'MTA:SA' : 'SA-MP'}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Abra o cliente e vá em "Adicionar Servidor"</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Cole o endereço: <code className="text-emerald-400 bg-black/50 px-2 py-0.5 rounded">{connectionString}</code></span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>Clique em "Conectar" e divirta-se!</span>
              </li>
            </ol>
          </div>

          {/* Links Úteis */}
          <div className="flex flex-wrap gap-3">
            <a
              href={service.type === 'mta-server' 
                ? 'https://multitheftauto.com/' 
                : 'https://sa-mp.mp/'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Baixar Cliente
            </a>
            <a
              href={service.type === 'mta-server'
                ? 'https://wiki.multitheftauto.com/'
                : 'https://team.sa-mp.com/wiki/'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Documentação
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-800/30">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-slate-300 font-medium mb-1">Segurança</p>
              <p className="text-slate-400">
                Nunca compartilhe suas credenciais RCON com terceiros. Use senhas fortes e únicas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
