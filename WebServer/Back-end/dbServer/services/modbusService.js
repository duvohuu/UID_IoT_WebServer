import net from "net";
import Machine from "../models/Machine.js";
import { MODBUS_CONFIG, NETWORK_CONFIG } from "../config/modbus.js";
import { workShiftService } from "./workShiftService.js";
import { notificationService } from "./notificationService.js";

class ModbusService {
    constructor() {
        this.machineTransactionIds = new Map();
        this.machineConnectionLocks = new Map();
        this.isPolling = false;
    }

    async startPolling() {
        if (this.isPolling) return;
        
        console.log('Starting Modbus polling system...');
        console.log(`Scan interval: ${MODBUS_CONFIG.scanInterval/1000}s`);
        console.log(`Timeout per machine: ${MODBUS_CONFIG.timeout/1000}s`);
        
        this.isPolling = true;
        
        setTimeout(() => {
            console.log('Starting first scan cycle...');
            this.scanAllMachines();
        }, 2000);
        
        setInterval(() => {
            this.scanAllMachines();
        }, MODBUS_CONFIG.scanInterval);
        
        console.log('Modbus polling system initialized');
    }

    async scanAllMachines() {
        try {
            console.log('Starting scan cycle for all machines...');
            const allMachines = await Machine.find({});
            
            if (allMachines.length === 0) {
                console.log('No machines found to scan');
                return;
            }

            console.log(`Scanning ${allMachines.length} machines...`);
            for (let i = 0; i < allMachines.length; i++) {
                const machine = allMachines[i];
                const wasOnline = machine.isConnected;
                
                console.log(`[${i+1}/${allMachines.length}] Scanning ${machine.name} (${machine.ip}) - Current: ${machine.status}`);
                
                await this.readMachineData(machine);
                
                const updatedMachine = await Machine.findById(machine._id);
                const isNowOnline = updatedMachine.isConnected;

                if (wasOnline && !isNowOnline) {
                    console.log(`[${machine.name}] Connection loss detected - handling shift update`);
                    await this.handleConnectionLoss(machine);
                }
                
                this.logStatusChange(machine.name, wasOnline, isNowOnline);
                
                if (i < allMachines.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, NETWORK_CONFIG.delayBetweenScans));
                }
            }
            
            
            const onlineCount = await Machine.countDocuments({ isConnected: true });
            const offlineCount = allMachines.length - onlineCount;
            
            console.log(`Scan cycle completed: ${onlineCount} online, ${offlineCount} offline`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        } catch (error) {
            console.error('Error in scan cycle:', error.message);
        }
    }

    async readMachineData(machine) {
        const lockKey = `${machine._id}`;
        if (this.machineConnectionLocks.has(lockKey)) return;
        
        this.machineConnectionLocks.set(lockKey, true);
        try {
            await this.performModbusRead(machine);
        } 
        finally {
            this.machineConnectionLocks.delete(lockKey);
        }
    }

    async performModbusRead(machine) {
        return new Promise((resolve) => {
            const client = new net.Socket();
            client.setTimeout(MODBUS_CONFIG.timeout);
            let isResolved = false;
            let connectionTimer;

            const cleanup = () => {
                try {
                    if (connectionTimer) clearTimeout(connectionTimer);
                    client.removeAllListeners();
                    if (!client.destroyed) client.destroy();
                } catch {}
            };

            connectionTimer = setTimeout(async () => {
                if (!isResolved) {
                    console.log(`[${machine.name}] Connection timeout - updating status to offline`);
                
                    await this.handleConnectionLoss(machine);
                    
                    await this.updateMachineStatus(machine._id, { 
                        isConnected: false, 
                        status: 'offline', 
                        lastError: 'Connection timeout - No response from machine', 
                        disconnectedAt: new Date() 
                    });
                    
                    isResolved = true; 
                    cleanup();
                    resolve({ success: false, error: 'timeout' });
                }
            }, MODBUS_CONFIG.timeout);

            client.connect(MODBUS_CONFIG.port, machine.ip, () => {
                const { buffer } = this.createModbusRequest(machine);
                client.write(buffer);
            });

            client.on('data', async (data) => {
                if (isResolved) return;
                
                if (data.length >= 9 && data[7] > 0x80) {
                    await this.updateMachineStatus(machine._id, { 
                        isConnected: false, 
                        status: 'error', 
                        lastError: `ModBus error ${data[8]}`, 
                        disconnectedAt: new Date() 
                    });
                    isResolved = true; 
                    cleanup(); 
                    resolve();
                    return;
                }

                const expectedDataLength = 9 + (70 * 2);
                if (data.length >= expectedDataLength) {
                    const registers = [];
                    for (let i = 0; i < 70; i++) {
                        registers[i] = data.readUInt16BE(9 + (i * 2));
                    }
                    try {
                        console.log(`[${machine.name}] Calling workShiftService.handleTracking...`);
                        await workShiftService.handleTracking(machine, registers);
                        console.log(`[${machine.name}] workShiftService completed`);
                    } catch (shiftError) {
                        console.error(`[${machine.name}] workShiftService error:`, shiftError.message);
                    }
                    const parameters = {
                        // Monitoring data (40001-40011)
                        monitoringData: Object.fromEntries(
                            Array.from({length: 11}, (_, i) => [
                                `4000${i + 1}`, 
                                registers[i] || 0
                            ])
                        ),
                        // Admin data (40012-40070)
                        adminData: Object.fromEntries(
                            Array.from({length: 59}, (_, i) => [
                                (40012 + i).toString(), 
                                registers[i + 11] || 0
                            ])
                        )
                    };
                    
                    await this.updateMachineStatus(machine._id, { 
                        isConnected: true, 
                        status: 'online', 
                        lastHeartbeat: new Date(), 
                        parameters, 
                        lastError: null 
                    });
                    
                    isResolved = true; 
                    cleanup(); 
                    resolve();
                }
            });

            client.on('error', async (err) => {
                if (!isResolved) {
                    console.log(`[${machine.name}] Connection error - checking last machine status`);
                    
                    await this.handleConnectionLoss(machine);
                    
                    await this.updateMachineStatus(machine._id, {
                        isConnected: false,
                        status: 'offline',
                        lastError: err.message,
                        disconnectedAt: new Date()
                    });
                    
                    isResolved = true;
                    cleanup();
                    resolve({ success: false, error: err.message });
                }
            });

            client.on('timeout', async () => {
                if (isResolved) return;
                await this.updateMachineStatus(machine._id, { 
                    isConnected: false, 
                    status: 'timeout', 
                    lastError: 'Socket timeout', 
                    disconnectedAt: new Date() 
                });
                isResolved = true; 
                cleanup(); 
                resolve();
            });

            client.on('close', () => {
                if (!isResolved) { 
                    isResolved = true; 
                    cleanup(); 
                    resolve(); 
                }
            });
        });
    }

    createModbusRequest(machine) {
        const buffer = Buffer.alloc(12);
        const transactionId = this.getNextTransactionId(machine._id);
        buffer.writeUInt16BE(transactionId, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(6, 4);
        buffer.writeUInt8(1, 6);
        buffer.writeUInt8(3, 7);
        buffer.writeUInt16BE(0, 8);
        buffer.writeUInt16BE(70, 10);
        return { buffer, transactionId };
    }

    getNextTransactionId(machineId) {
        if (!this.machineTransactionIds.has(machineId)) this.machineTransactionIds.set(machineId, 1);
        let currentId = this.machineTransactionIds.get(machineId);
        currentId++;
        this.machineTransactionIds.set(machineId, currentId);
        return currentId;
    }

    async updateMachineStatus(machineId, updateData) {
        try {
            const machine = await Machine.findByIdAndUpdate(
                machineId, 
                { ...updateData, lastUpdate: new Date() }, 
                { new: true }
            );
            
            if (machine) {
                if (!updateData.isConnected && machine.isConnected) {
                    console.log(`[${machine.name}] Detected connection loss - Notifying work shift service`);
                    await workShiftService.handleConnectionLoss(machine);
                }
                
                await notificationService.notifyMainServer(machine);
            }
        } catch (error) {
            console.error('Error updating machine status:', error.message);
        }
    }

    async handleConnectionLoss(machine) {
        try {
            console.log(`🔍 [${machine.name}] Checking machine status before connection loss...`);
            
            const lastMachineStatus = machine.parameters?.monitoringData?.['40001'];
            console.log(`[${machine.name}] Last machine status (40001): ${lastMachineStatus}`);
            
            if (lastMachineStatus !== undefined) {
                // Cập nhật status của ca đang active
                await this.updateActiveShiftStatus(machine, lastMachineStatus);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error handling connection loss:`, error.message);
        }
    }

    async updateActiveShiftStatus(machine, lastMachineStatus) {
        try {
            const WorkShift = (await import('../models/Workshift.js')).default;
            
            // Tìm ca đang active của máy này
            const activeShift = await WorkShift.findOne({ 
                machineId: machine.machineId,
                status: 'active'
            });
            
            if (activeShift) {
                let newStatus;
                
                if (lastMachineStatus === 1) {
                    // Máy đang hoạt động trước khi mất kết nối -> ca chưa hoàn thiện
                    newStatus = 'incomplete';
                    console.log(`[${machine.name}] Shift ${activeShift.shiftId}: Machine was RUNNING before disconnect -> INCOMPLETE`);
                } else {
                    // Máy đã dừng trước khi mất kết nối -> ca hoàn thiện
                    newStatus = 'complete';
                    activeShift.endTime = new Date(); 
                    console.log(`[${machine.name}] Shift ${activeShift.shiftId}: Machine was STOPPED before disconnect -> COMPLETED`);
                }
                
                activeShift.status = newStatus;
                activeShift.updatedAt = new Date();
                
                // Recalculate duration if completd
                if (newStatus === 'complete' && activeShift.startTime) {
                    const endTime = activeShift.endTime || new Date();
                    activeShift.duration = Math.round((endTime - new Date(activeShift.startTime)) / (1000 * 60));
                }
                
                await activeShift.save();
                console.log(`[${machine.name}] Updated shift ${activeShift.shiftId} status to: ${newStatus}`);
                
                // Notify mainServer về thay đổi status
                const notificationService = (await import('./notificationService.js')).default;
                await notificationService.notifyMainServerShiftStatusChanged(activeShift);
                
            } else {
                console.log(`[${machine.name}] No active shift found to update`);
            }
            
        } catch (error) {
            console.error(`[${machine.name}] Error updating active shift status:`, error.message);
        }
    }
    
    logStatusChange(machineName, wasOnline, isNowOnline) {
        if (!wasOnline && isNowOnline) {
            console.log(`[${machineName}] Machine came ONLINE - Data updated`);
        } else if (wasOnline && !isNowOnline) {
            console.log(`[${machineName}] Machine went OFFLINE`);
        } else if (isNowOnline) {
            console.log(`[${machineName}] Online - Data refreshed`);
        } else {
            console.log(`[${machineName}] Still offline`);
        }
    }

}

export const modbusService = new ModbusService();