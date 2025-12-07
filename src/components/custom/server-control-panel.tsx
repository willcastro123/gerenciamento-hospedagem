'use client';

import { useState, useEffect, useRef } from 'react';
import { Service } from '@/lib/types';
import { useServerControl } from '@/hooks/useServerControl'; // <--- IMPORTANTE: Importe o Hook criado
import {
  Play, Square, RotateCw, Terminal, FolderOpen, Settings,
  Database, Activity, Clock, Users, HardDrive, Cpu,
  Network, Download, FileText, Save, Edit, Trash2, X, Plus
} from 'lucide-react';

interface ServerControlPanelProps {
  service: Service;
  onClose: () => void;
}

export default function ServerControlPanel({ service, onClose }: ServerControlPanelProps) {
  // 1. CONEXÃO COM O BACKEND (Via Hook)
  // Removemos os estados manuais de 'stats' e 'serverStatus' e usamos os do hook
  const { 
    status: serverStatus, 
    stats, 
    logs, 
    files, 
    sendPowerAction, 
    refreshFiles 
  } = useServerControl(service);

  // 2. ESTADOS DE UI (Apenas o que é visual/interação local)
  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'config' | 'resources' | 'backup' | 'logs' | 'schedule'>('console');
  const [commandInput, setCommandInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState<any | null>(null); // Tipagem pode ser melhorada no hook
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do terminal quando chegarem logs novos reais
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Atualiza lista de arquivos quando troca de aba ou pasta
  useEffect(() => {
    if (activeTab === 'files') {
      refreshFiles(currentPath);
    }
  }, [activeTab, currentPath, refreshFiles]);

  // --- HANDLERS (Ações do Usuário) ---

  const handleServerAction = (action: 'start' | 'stop' | 'restart') => {
    // Chama a função real do hook, não mais a simulação
    sendPowerAction(action);
  };

  const handleSendCommand = () => {
    if (!commandInput.trim()) return;
    // TODO: Adicionar função sendCommand no hook useServerControl
    // sendCommand(commandInput); 
    setCommandInput('');
  };

  const handleFileClick = (file: any) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      setSelectedFile(file);
      // TODO: Implementar fetchFileContent(file.path) no hook
      setFileContent(`Carregando conteúdo real de ${file.name}...`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header - Barra de Título e Status */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{service.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400 flex items-center gap-1">
                <Network className="w-3 h-3" />
                {service.gameServerConfig?.serverIp}:{service.gameServerConfig?.serverPort}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                serverStatus === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                serverStatus === 'offline' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {serverStatus.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Barra de Estatísticas (Dados Reais do Hook) */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <StatItem icon={Cpu} label="CPU" value={`${stats.cpu}%`} color="text-blue-400" />
            <StatItem icon={Activity} label="RAM" value={`${stats.ram}%`} color="text-purple-400" />
            <StatItem icon={HardDrive} label="Disco" value={`${stats.disk}%`} color="text-emerald-400" />
            <StatItem icon={Network} label="Rede" value="--" color="text-amber-400" />
            <StatItem icon={Users} label="Players" value={`${stats.players}/${stats.maxPlayers}`} color="text-cyan-400" />
            <StatItem icon={Clock} label="Uptime" value={stats.uptime} color="text-pink-400" />
            
            {/* Botões de Ação */}
            <div className="flex gap-2 items-center justify-end">
              <ActionButton 
                onClick={() => handleServerAction('start')} 
                disabled={serverStatus !== 'offline'}
                icon={Play} color="emerald" tooltip="Iniciar" 
              />
              <ActionButton 
                onClick={() => handleServerAction('restart')} 
                disabled={serverStatus === 'offline'}
                icon={RotateCw} color="blue" tooltip="Reiniciar" 
              />
              <ActionButton 
                onClick={() => handleServerAction('stop')} 
                disabled={serverStatus === 'offline'}
                icon={Square} color="red" tooltip="Parar" 
              />
            </div>
          </div>
        </div>

        {/* Navegação de Abas */}
        <div className="px-6 border-b border-slate-800 flex gap-1 overflow-x-auto bg-slate-900">
          <TabButton id="console" label="Console" icon={Terminal} active={activeTab} set={setActiveTab} />
          <TabButton id="files" label="Arquivos" icon={FolderOpen} active={activeTab} set={setActiveTab} />
          <TabButton id="config" label="Config" icon={Settings} active={activeTab} set={setActiveTab} />
          {/* Outras abas podem ser reabilitadas conforme você cria as rotas na API */}
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-hidden bg-slate-950">
          
          {/* --- TAB: CONSOLE --- */}
          {activeTab === 'console' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
                {logs.length === 0 && <div className="text-slate-600 italic">Aguardando logs do servidor...</div>}
                {logs.map((log, i) => (
                  <div key={i} className="border-b border-slate-900/50 pb-0.5 text-slate-300 break-all hover:bg-slate-900/50">
                    {log}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                    placeholder="Digite um comando para o servidor..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button onClick={handleSendCommand} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: ARQUIVOS --- */}
          {activeTab === 'files' && (
            <div className="h-full flex">
              {/* Lista de Arquivos */}
              <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-2 bg-slate-900/50">
                <div className="flex items-center gap-2 p-2 mb-2 text-xs text-slate-500 border-b border-slate-800">
                   <FolderOpen className="w-4 h-4" /> {currentPath}
                </div>
                <div className="space-y-0.5">
                  {files.length === 0 ? (
                    <div className="text-center p-4 text-slate-500">Pasta vazia ou erro ao listar.</div>
                  ) : files.map((file: any) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-slate-800 transition-all flex items-center gap-3 ${selectedFile?.path === file.path ? 'bg-blue-900/30 border border-blue-500/30' : ''}`}
                    >
                      {file.type === 'folder' ? 
                        <FolderOpen className="w-4 h-4 text-yellow-500" /> : 
                        <FileText className="w-4 h-4 text-slate-400" />
                      }
                      <span className="text-sm text-slate-200 truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor de Arquivos */}
              <div className="flex-1 flex flex-col bg-slate-950">
                {selectedFile ? (
                  <>
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                      <span className="text-white font-medium text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" /> {selectedFile.name}
                      </span>
                      <div className="flex gap-2">
                         {isEditing ? (
                           <>
                             <button className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">
                               <Save className="w-3 h-3" /> Salvar
                             </button>
                             <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-slate-700 text-white text-xs rounded hover:bg-slate-600">
                               Cancelar
                             </button>
                           </>
                         ) : (
                           <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                             <Edit className="w-3 h-3" /> Editar
                           </button>
                         )}
                      </div>
                    </div>
                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 w-full bg-slate-950 p-4 text-slate-300 font-mono text-sm resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p>Selecione um arquivo para editar</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder para outras abas */}
          {activeTab !== 'console' && activeTab !== 'files' && (
            <div className="flex items-center justify-center h-full text-slate-500">
              Funcionalidade em desenvolvimento na integração da API.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES PARA LIMPEZA DO CÓDIGO ---

function StatItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, icon: Icon, color, tooltip }: any) {
  const colors: any = {
    emerald: "bg-emerald-600 hover:bg-emerald-500",
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`p-2 rounded-lg text-white transition-all shadow-lg ${
        disabled ? "bg-slate-800 text-slate-600 cursor-not-allowed" : colors[color]
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function TabButton({ id, label, icon: Icon, active, set }: any) {
  return (
    <button
      onClick={() => set(id)}
      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
        active === id
          ? 'text-blue-400 border-blue-400 bg-slate-800/50'
          : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/30'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
