import { useState, useEffect, useCallback } from 'react';
import { Service } from '@/lib/types';

// Função para decidir qual URL usar (Localhost ou Ngrok)
const getDaemonUrl = (ip: string) => {
  // Se o site estiver rodando no seu PC (localhost), conecta direto na porta 3001
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
     return `http://${ip}:3001`; 
  }
  
  // Se estiver na Vercel (nuvem), usa o túnel do Ngrok
  // IMPORTANTE: Troque o link abaixo pelo SEU link do ngrok atual
  return 'https://superzealously-petrolic-elise.ngrok-free.dev'; 
};

export const useServerControl = (service: Service) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'starting' | 'stopping'>('offline');
  
  // Estado inicial zerado
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

  // Pega a URL correta (Local ou Ngrok)
  const DAEMON_URL = getDaemonUrl(service.gameServerConfig?.serverIp || 'localhost');
  const AUTH_TOKEN = service.gameServerConfig?.rconPassword; 

  // 1. Função para buscar dados reais (Heartbeat)
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${DAEMON_URL}/api/status`, {
        headers: { 'Authorization': AUTH_TOKEN || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status); 
        setStats(prev => ({
          ...prev,
          cpu: data.stats?.cpu || 0,
          ram: data.stats?.ram || 0,
          players: data.stats?.players || 0,
          uptime: data.stats?.uptime || '0m'
        }));
      } else {
        // Se der erro 404 ou 500, assumimos offline
        setStatus('offline');
      }
    } catch (error) {
      // Se der erro de rede (fetch falhou), é offline
      // Não logamos erro aqui para não sujar o console a cada 2 segundos
      setStatus('offline');
    }
  }, [DAEMON_URL, AUTH_TOKEN]);

  // 2. Polling: Busca dados a cada 2 segundos
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 3. Funções de Ação (Ligar/Desligar)
  const sendPowerAction = async (action: 'start' | 'stop' | 'restart') => {
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
          type: service.type 
        })
      });
      
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
      if(res.ok) {
        const data = await res.json();
        setFiles(data.files);
      }
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
