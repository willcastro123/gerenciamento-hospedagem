'use client';

import { useState, useEffect, useRef } from 'react';
import { Service } from '@/lib/types';
import {
  Play,
  Square,
  RotateCw,
  Terminal,
  FolderOpen,
  Settings,
  Database,
  Activity,
  Clock,
  Users,
  HardDrive,
  Cpu,
  Network,
  Download,
  Upload,
  FileText,
  Save,
  Trash2,
  Copy,
  Edit,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Package,
} from 'lucide-react';

interface ServerControlPanelProps {
  service: Service;
  onClose: () => void;
}

interface ConsoleMessage {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'command';
  message: string;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  path: string;
}

interface ResourceItem {
  name: string;
  status: 'running' | 'stopped' | 'error';
  type: 'gamemode' | 'filterscript' | 'plugin' | 'resource';
  version?: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  command: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

export default function ServerControlPanel({ service, onClose }: ServerControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'config' | 'resources' | 'backup' | 'logs' | 'schedule'>('console');
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'starting' | 'stopping'>('online');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Estatísticas em tempo real
  const [stats, setStats] = useState({
    cpu: 45,
    ram: 62,
    disk: 38,
    network: { in: 1.2, out: 0.8 },
    players: service.gameServerConfig?.currentPlayers || 0,
    maxPlayers: service.gameServerConfig?.maxPlayers || 100,
    uptime: '2d 14h 32m',
  });

  useEffect(() => {
    // Simular mensagens do console
    const initialMessages: ConsoleMessage[] = [
      { id: '1', timestamp: new Date().toISOString(), type: 'info', message: 'Server started successfully' },
      { id: '2', timestamp: new Date().toISOString(), type: 'success', message: `${service.gameServerConfig?.serverName || 'Server'} is now online` },
      { id: '3', timestamp: new Date().toISOString(), type: 'info', message: `Listening on ${service.gameServerConfig?.serverIp}:${service.gameServerConfig?.serverPort}` },
    ];
    setConsoleMessages(initialMessages);

    // Simular arquivos
    const mockFiles: FileItem[] = [
      { name: 'server.cfg', type: 'file', size: '2.4 KB', modified: '2024-01-15 14:30', path: '/server.cfg' },
      { name: 'resources', type: 'folder', modified: '2024-01-15 12:00', path: '/resources' },
      { name: 'mods', type: 'folder', modified: '2024-01-14 18:45', path: '/mods' },
      { name: 'logs', type: 'folder', modified: '2024-01-15 14:35', path: '/logs' },
      { name: 'server.log', type: 'file', size: '156 KB', modified: '2024-01-15 14:35', path: '/server.log' },
    ];
    setFiles(mockFiles);

    // Simular recursos
    const mockResources: ResourceItem[] = [
      { name: 'admin', status: 'running', type: 'resource', version: '1.2.0' },
      { name: 'freeroam', status: 'running', type: 'gamemode', version: '2.0.1' },
      { name: 'mapeditor', status: 'stopped', type: 'resource', version: '1.5.3' },
      { name: 'mysql', status: 'running', type: 'plugin', version: '3.1.0' },
    ];
    setResources(mockResources);

    // Simular tarefas agendadas
    const mockTasks: ScheduledTask[] = [
      { 
        id: '1', 
        name: 'Backup Diário', 
        command: 'backup create', 
        schedule: '0 3 * * *', 
        enabled: true,
        lastRun: '2024-01-15 03:00',
        nextRun: '2024-01-16 03:00'
      },
      { 
        id: '2', 
        name: 'Reiniciar Servidor', 
        command: 'restart', 
        schedule: '0 6 * * *', 
        enabled: true,
        nextRun: '2024-01-16 06:00'
      },
      { 
        id: '3', 
        name: 'Limpar Logs', 
        command: 'logs clear', 
        schedule: '0 0 * * 0', 
        enabled: false,
        nextRun: '2024-01-21 00:00'
      },
    ];
    setScheduledTasks(mockTasks);

    // Atualizar estatísticas a cada 2 segundos
    const statsInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: Math.max(20, Math.min(80, prev.cpu + (Math.random() - 0.5) * 10)),
        ram: Math.max(40, Math.min(90, prev.ram + (Math.random() - 0.5) * 5)),
        network: {
          in: Math.max(0.5, Math.min(5, prev.network.in + (Math.random() - 0.5) * 0.5)),
          out: Math.max(0.3, Math.min(3, prev.network.out + (Math.random() - 0.5) * 0.3)),
        },
      }));
    }, 2000);

    return () => clearInterval(statsInterval);
  }, [service]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleMessages]);

  const handleServerAction = (action: 'start' | 'stop' | 'restart') => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'command',
      message: `Executing ${action} command...`,
    };
    setConsoleMessages(prev => [...prev, newMessage]);

    if (action === 'start') {
      setServerStatus('starting');
      setTimeout(() => {
        setServerStatus('online');
        setConsoleMessages(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'success',
          message: 'Server started successfully',
        }]);
      }, 2000);
    } else if (action === 'stop') {
      setServerStatus('stopping');
      setTimeout(() => {
        setServerStatus('offline');
        setConsoleMessages(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'info',
          message: 'Server stopped',
        }]);
      }, 2000);
    } else if (action === 'restart') {
      setServerStatus('stopping');
      setTimeout(() => {
        setServerStatus('starting');
        setConsoleMessages(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'info',
          message: 'Server restarting...',
        }]);
        setTimeout(() => {
          setServerStatus('online');
          setConsoleMessages(prev => [...prev, {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: 'success',
            message: 'Server restarted successfully',
          }]);
        }, 2000);
      }, 1000);
    }
  };

  const handleSendCommand = () => {
    if (!commandInput.trim()) return;

    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'command',
      message: `> ${commandInput}`,
    };
    setConsoleMessages(prev => [...prev, newMessage]);

    // Simular resposta do comando
    setTimeout(() => {
      setConsoleMessages(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'success',
        message: `Command executed: ${commandInput}`,
      }]);
    }, 500);

    setCommandInput('');
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
      // Simular carregamento de arquivos da pasta
    } else {
      setSelectedFile(file);
      // Simular carregamento do conteúdo do arquivo
      setFileContent(`# ${file.name}\n\n# Conteúdo do arquivo\nport=${service.gameServerConfig?.serverPort}\nservername=${service.gameServerConfig?.serverName}\nmaxplayers=${service.gameServerConfig?.maxPlayers}\nrcon_password=${service.gameServerConfig?.rconPassword}\n`);
    }
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;
    
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `File saved: ${selectedFile.name}`,
    };
    setConsoleMessages(prev => [...prev, newMessage]);
    setIsEditing(false);
  };

  const handleResourceAction = (resource: ResourceItem, action: 'start' | 'stop' | 'restart') => {
    setResources(prev => prev.map(r => 
      r.name === resource.name 
        ? { ...r, status: action === 'stop' ? 'stopped' : 'running' }
        : r
    ));

    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Resource ${resource.name} ${action}ed successfully`,
    };
    setConsoleMessages(prev => [...prev, newMessage]);
  };

  const handleCreateBackup = () => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'Creating backup...',
    };
    setConsoleMessages(prev => [...prev, newMessage]);

    setTimeout(() => {
      setConsoleMessages(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'success',
        message: `Backup created: backup_${new Date().toISOString().split('T')[0]}.zip`,
      }]);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{service.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                {service.gameServerConfig?.serverIp}:{service.gameServerConfig?.serverPort}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                serverStatus === 'online' ? 'bg-emerald-600/20 text-emerald-400' :
                serverStatus === 'offline' ? 'bg-slate-600/20 text-slate-400' :
                'bg-amber-600/20 text-amber-400'
              }`}>
                {serverStatus === 'online' ? 'Online' :
                 serverStatus === 'offline' ? 'Offline' :
                 serverStatus === 'starting' ? 'Iniciando...' : 'Parando...'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">CPU</p>
                <p className="text-sm font-semibold text-white">{stats.cpu.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs text-slate-400">RAM</p>
                <p className="text-sm font-semibold text-white">{stats.ram.toFixed(1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Disco</p>
                <p className="text-sm font-semibold text-white">{stats.disk}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">Rede</p>
                <p className="text-sm font-semibold text-white">
                  <Download className="w-3 h-3 inline" /> {stats.network.in.toFixed(1)} MB/s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-400">Jogadores</p>
                <p className="text-sm font-semibold text-white">{stats.players}/{stats.maxPlayers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <div>
                <p className="text-xs text-slate-400">Uptime</p>
                <p className="text-sm font-semibold text-white">{stats.uptime}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleServerAction('start')}
                disabled={serverStatus === 'online' || serverStatus === 'starting'}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="Iniciar"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleServerAction('stop')}
                disabled={serverStatus === 'offline' || serverStatus === 'stopping'}
                className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="Parar"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleServerAction('restart')}
                disabled={serverStatus !== 'online'}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                title="Reiniciar"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-800 flex gap-1 overflow-x-auto">
          {[
            { id: 'console', label: 'Console', icon: Terminal },
            { id: 'files', label: 'Arquivos', icon: FolderOpen },
            { id: 'config', label: 'Configuração', icon: Settings },
            { id: 'resources', label: 'Recursos', icon: Package },
            { id: 'backup', label: 'Backup', icon: Database },
            { id: 'logs', label: 'Logs', icon: FileText },
            { id: 'schedule', label: 'Agendamento', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Console Tab */}
          {activeTab === 'console' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
                {consoleMessages.map((msg) => (
                  <div key={msg.id} className="mb-2 flex gap-2">
                    <span className="text-slate-500 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`flex-1 ${
                      msg.type === 'error' ? 'text-red-400' :
                      msg.type === 'warning' ? 'text-amber-400' :
                      msg.type === 'success' ? 'text-emerald-400' :
                      msg.type === 'command' ? 'text-blue-400' :
                      'text-slate-300'
                    }`}>
                      {msg.message}
                    </span>
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                    placeholder="Digite um comando RCON..."
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendCommand}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="h-full flex">
              <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-4">
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Caminho atual:</p>
                  <p className="text-sm text-white font-mono">{currentPath}</p>
                </div>
                <div className="space-y-1">
                  {files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors ${
                        selectedFile?.path === file.path ? 'bg-slate-800' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {file.type === 'folder' ? (
                          <FolderOpen className="w-4 h-4 text-blue-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm text-white">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {file.size && <span>{file.size}</span>}
                        <span>{file.modified}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                {selectedFile ? (
                  <>
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-white font-medium">{selectedFile.name}</h3>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveFile}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Salvar
                            </button>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <textarea
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        disabled={!isEditing}
                        className="w-full h-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Selecione um arquivo para visualizar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recursos e Mods</h3>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Recurso
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource) => (
                  <div
                    key={resource.name}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium mb-1">{resource.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{resource.type}</span>
                          {resource.version && (
                            <span className="text-xs text-slate-500">v{resource.version}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        resource.status === 'running' ? 'bg-emerald-600/20 text-emerald-400' :
                        resource.status === 'stopped' ? 'bg-slate-600/20 text-slate-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {resource.status === 'running' ? 'Rodando' :
                         resource.status === 'stopped' ? 'Parado' : 'Erro'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {resource.status === 'running' ? (
                        <>
                          <button
                            onClick={() => handleResourceAction(resource, 'stop')}
                            className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Parar
                          </button>
                          <button
                            onClick={() => handleResourceAction(resource, 'restart')}
                            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Reiniciar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleResourceAction(resource, 'start')}
                          className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Iniciar
                        </button>
                      )}
                      <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Gerenciamento de Backups</h3>
                <button
                  onClick={handleCreateBackup}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  <Database className="w-5 h-5" />
                  Criar Backup Agora
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'backup_2024-01-15.zip', size: '245 MB', date: '15/01/2024 03:00' },
                  { name: 'backup_2024-01-14.zip', size: '243 MB', date: '14/01/2024 03:00' },
                  { name: 'backup_2024-01-13.zip', size: '241 MB', date: '13/01/2024 03:00' },
                ].map((backup) => (
                  <div
                    key={backup.name}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-blue-400" />
                      <div>
                        <h4 className="text-white font-medium">{backup.name}</h4>
                        <p className="text-sm text-slate-400">{backup.size} • {backup.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        Baixar
                      </button>
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
                        Restaurar
                      </button>
                      <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Tarefas Agendadas</h3>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </button>
              </div>
              <div className="space-y-3">
                {scheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium">{task.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            task.enabled ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
                          }`}>
                            {task.enabled ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2 font-mono">{task.command}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Agendamento: {task.schedule}</span>
                          {task.lastRun && <span>Última execução: {task.lastRun}</span>}
                          <span>Próxima execução: {task.nextRun}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config Tab */}
          {activeTab === 'config' && (
            <div className="h-full overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Configurações do Servidor</h3>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nome do Servidor
                  </label>
                  <input
                    type="text"
                    defaultValue={service.gameServerConfig?.serverName}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Porta do Servidor
                  </label>
                  <input
                    type="number"
                    defaultValue={service.gameServerConfig?.serverPort}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Máximo de Jogadores
                  </label>
                  <input
                    type="number"
                    defaultValue={service.gameServerConfig?.maxPlayers}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Senha RCON
                  </label>
                  <input
                    type="password"
                    defaultValue={service.gameServerConfig?.rconPassword}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Senha do Servidor (Opcional)
                  </label>
                  <input
                    type="password"
                    defaultValue={service.gameServerConfig?.serverPassword}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all">
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Logs do Servidor</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Baixar Logs
                  </button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Limpar Logs
                  </button>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 font-mono text-sm">
                {[
                  { time: '14:35:22', type: 'info', msg: 'Player John_Doe connected from 192.168.1.100' },
                  { time: '14:35:18', type: 'info', msg: 'Resource "admin" started successfully' },
                  { time: '14:35:15', type: 'warning', msg: 'High CPU usage detected: 78%' },
                  { time: '14:35:10', type: 'info', msg: 'Player Jane_Smith spawned at position (1234.5, 678.9, 10.5)' },
                  { time: '14:35:05', type: 'error', msg: 'Failed to load resource "broken_mod": file not found' },
                  { time: '14:35:00', type: 'info', msg: 'Server tick rate: 60 FPS' },
                ].map((log, i) => (
                  <div key={i} className="mb-2 flex gap-3">
                    <span className="text-slate-500">[{log.time}]</span>
                    <span className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      'text-slate-300'
                    }`}>
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
