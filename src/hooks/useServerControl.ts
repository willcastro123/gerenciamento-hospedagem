import { useState, useEffect } from 'react';
import { Service } from '@/lib/types';

// Substitui a lógica de simulação do seu componente original
export const useServerControl = (service: Service) => {
  const [status, setStatus] = useState<'online' | 'offline' | 'starting' | 'stopping'>('offline');
  const [stats, setStats] = useState({ cpu: 0, ram: 0, disk: 0, players: 0, maxPlayers: 100 });
  const [logs, setLogs] = useState<string[]>([]);

  // Token de segurança para falar com o Agente na VPS
  const AGENT_URL = `http://${service.gameServerConfig?.serverIp}:3000`;
  const API_KEY = service.gameServerConfig?.rconPassword; // Usando RCON como "senha" temporária do agente

  // Função para buscar status real da VPS
  const fetchHeartbeat = async () => {
    try {
      const res = await fetch(`${AGENT_URL}/api/status`, {
        headers: { 'Authorization': API_KEY || '' }
      });
      const data = await res.json();
      setStatus(data.status); // 'online' ou 'offline' real
      setStats(data.stats);   // Uso real de CPU/RAM do Linux
    } catch (error) {
      console.error("Falha ao contatar o Agente Koala:", error);
      setStatus('offline');
    }
  };

  // Polling a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(fetchHeartbeat, 2000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (action: 'start' | 'stop' | 'restart') => {
    setStatus(action === 'start' || action === 'restart' ? 'starting' : 'stopping');
    
    await fetch(`${AGENT_URL}/api/power`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': API_KEY || ''
      },
      body: JSON.stringify({ action, type: service.type }) // envia se é MTA ou SAMP
    });
  };

  return { status, stats, logs, sendCommand };
};
