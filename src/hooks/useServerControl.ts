import { useState, useEffect, useCallback } from 'react';
import { Service } from '@/lib/types';

// URL do Daemon (Agente) rodando na VPS do cliente
// Em produção, isso pode ser um Proxy para evitar erros de HTTPS/CORS
const getDaemonUrl = (ip: string) => `http://${ip}:3000`;

export const useServerControl = (service: Service) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'starting' | 'stopping'>('offline');
  
  // Estado inicial zerado (não randomizado)
  const [stats, setStats] = useState({
    cpu: 0,
    ram: 0,
    disk: 0,
    network: { in: 0, out: 0 },
    players: 0,
    maxPlayers: service.gameServerConfig?.maxPlayers || 100,
    uptime: '0m',
  });

  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  const DAEMON_URL = getDaemonUrl(service.gameServerConfig?.serverIp || 'localhost');
  const AUTH_TOKEN = service.gameServerConfig?.rconPassword; // Usando como chave de API temporária

  // 1. Função para buscar dados reais (Heartbeat)
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${DAEMON_URL}/api/status`, {
        headers: { 'Authorization': AUTH_TOKEN || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status); // online/offline real vindo do Linux
        setStats(prev => ({
          ...prev,
          cpu: data.cpu_usage,
          ram: data.ram_usage,
          players: data.current_players,
          uptime: data.uptime
        }));
      }
    } catch (error) {
      console.error("Erro ao conectar com a VPS:", error);
      // Não setamos offline imediatamente para evitar 'piscar' se falhar um request só
    }
  }, [DAEMON_URL, AUTH_TOKEN]);

  // 2. Polling: Substitui o setInterval de simulação
  useEffect(() => {
    // Busca imediatamente
    fetchStatus();
    
    // E depois a cada 2 segundos
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 3. Funções de Ação (Ligar/Desligar)
  const sendPowerAction = async (action: 'start' | 'stop' | 'restart') => {
    // Feedback visual imediato
    setStatus(action === 'stop' ? 'stopping' : 'starting');

    try {
      await fetch(`${DAEMON_URL}/api/power`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN || ''
        },
        body: JSON.stringify({ 
          action, 
          type: service.type // envia 'mta-server' ou 'samp-server'
        })
      });
      
      // Atualiza status forçadamente após 2s
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      console.error("Falha ao enviar comando", error);
      setStatus('offline');
    }
  };

  // 4. Função para listar arquivos reais
  const refreshFiles = async (path: string = '/') => {
    try {
      const res = await fetch(`${DAEMON_URL}/api/files?path=${path}`, {
         headers: { 'Authorization': AUTH_TOKEN || '' }
      });
      const data = await res.json();
      setFiles(data.files);
    } catch (e) {
      console.error("Erro ao listar arquivos", e);
    }
  };

  return {
    status,
    stats,
    logs,
    files,
    sendPowerAction,
    refreshFiles
  };
};
