/**
 * Serviço de backup automático
 */

import { supabase } from '@/integrations/supabase/client';
import { exportToJSON } from './export-utils';

export interface BackupData {
    timestamp: string;
    restaurantId: string;
    data: {
        pedidos: any[];
        produtos: any[];
        clientes: any[];
        mesas: any[];
        configuracoes: any;
    };
}

class BackupService {
    private readonly BACKUP_KEY = 'pedeai_backups';
    private readonly MAX_BACKUPS = 10;

    /**
     * Cria um backup completo dos dados
     */
    async createBackup(restaurantId: string): Promise<BackupData> {
        try {
            // Buscar todos os dados
            const [pedidos, produtos, clientes, configuracoes] = await Promise.all([
                supabase.from('pedidos').select('*').eq('restaurant_id', restaurantId),
                supabase.from('produtos').select('*').eq('restaurant_id', restaurantId),
                supabase.from('clientes').select('*').eq('restaurant_id', restaurantId),
                supabase.from('restaurantes').select('*').eq('id', restaurantId).single(),
            ]);

            const backup: BackupData = {
                timestamp: new Date().toISOString(),
                restaurantId,
                data: {
                    pedidos: pedidos.data || [],
                    produtos: produtos.data || [],
                    clientes: clientes.data || [],
                    mesas: [], // Mesas são gerenciadas dinamicamente
                    configuracoes: configuracoes.data || {},
                },
            };

            return backup;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            throw error;
        }
    }

    /**
     * Salva backup no localStorage
     */
    saveBackupLocally(backup: BackupData): void {
        try {
            const backups = this.getLocalBackups();
            backups.unshift(backup);

            // Manter apenas os últimos MAX_BACKUPS
            const trimmedBackups = backups.slice(0, this.MAX_BACKUPS);

            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(trimmedBackups));
        } catch (error) {
            console.error('Erro ao salvar backup localmente:', error);
            throw error;
        }
    }

    /**
     * Obtém backups salvos localmente
     */
    getLocalBackups(): BackupData[] {
        try {
            const backupsJson = localStorage.getItem(this.BACKUP_KEY);
            return backupsJson ? JSON.parse(backupsJson) : [];
        } catch (error) {
            console.error('Erro ao obter backups locais:', error);
            return [];
        }
    }

    /**
     * Exporta backup como arquivo JSON
     */
    exportBackup(backup: BackupData): void {
        exportToJSON(backup);
    }

    /**
     * Restaura dados de um backup
     */
    async restoreBackup(backup: BackupData, restaurantId: string): Promise<void> {
        try {
            // ATENÇÃO: Esta operação é destrutiva!
            // Em produção, considere fazer uma confirmação adicional

            // Restaurar produtos
            if (backup.data.produtos.length > 0) {
                await supabase.from('produtos').delete().eq('restaurant_id', restaurantId);
                await supabase.from('produtos').insert(
                    backup.data.produtos.map(p => ({ ...p, restaurant_id: restaurantId }))
                );
            }

            // Restaurar clientes
            if (backup.data.clientes.length > 0) {
                await supabase.from('clientes').delete().eq('restaurant_id', restaurantId);
                await supabase.from('clientes').insert(
                    backup.data.clientes.map(c => ({ ...c, restaurant_id: restaurantId }))
                );
            }

            // Restaurar configurações
            if (backup.data.configuracoes) {
                await supabase
                    .from('restaurantes')
                    .update(backup.data.configuracoes)
                    .eq('id', restaurantId);
            }

            console.log('Backup restaurado com sucesso');
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            throw error;
        }
    }

    /**
     * Configura backup automático
     */
    setupAutoBackup(restaurantId: string, intervalHours: number = 24): () => void {
        const intervalMs = intervalHours * 60 * 60 * 1000;

        const performBackup = async () => {
            try {
                const backup = await this.createBackup(restaurantId);
                this.saveBackupLocally(backup);
                console.log('Backup automático criado:', new Date().toLocaleString());
            } catch (error) {
                console.error('Erro no backup automático:', error);
            }
        };

        // Fazer backup imediatamente
        performBackup();

        // Agendar backups periódicos
        const intervalId = setInterval(performBackup, intervalMs);

        // Retornar função para cancelar
        return () => clearInterval(intervalId);
    }

    /**
     * Remove backup específico
     */
    deleteBackup(timestamp: string): void {
        try {
            const backups = this.getLocalBackups();
            const filtered = backups.filter(b => b.timestamp !== timestamp);
            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('Erro ao deletar backup:', error);
            throw error;
        }
    }

    /**
     * Limpa todos os backups
     */
    clearAllBackups(): void {
        localStorage.removeItem(this.BACKUP_KEY);
    }
}

export const backupService = new BackupService();
