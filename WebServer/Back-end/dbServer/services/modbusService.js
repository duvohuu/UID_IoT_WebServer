import net from "net";
import Machine from "../models/Machine.js";
import { MODBUS_CONFIG, NETWORK_CONFIG } from "../config/modbus.js";
import { saltMachineService } from "./saltMachineService.js";
import { notificationService } from "./notificationService.js";
import SaltMachine from "../models/SaltMachine.js";

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
                
                // this.logStatusChange(machine.name, wasOnline, isNowOnline);
                
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

                const expectedDataLength = 9 + (570 * 2);
                if (data.length >= expectedDataLength) {
                    const allRegisters = [];
                    for (let i = 0; i < 570; i++) {
                        allRegisters[i] = data.readUInt16BE(9 + (i * 2));
                    }

                    const currentRegisters = allRegisters.slice(0, 70);
                    const backupRegisters = this.extractBackupShifts(allRegisters);
                    try {
                        console.log(`[${machine.name}] Processing current shift...`);
                        await saltMachineService.handleTracking(machine, currentRegisters);
                        
                        console.log(`[${machine.name}] Processing backup shifts...`);
                        await saltMachineService.handleBackupShifts(machine, backupRegisters);

                        console.log(`[${machine.name}] saltMachineService completed`);
                    } catch (shiftError) {
                        console.error(`[${machine.name}] saltMachineService error:`, shiftError.message);
                    }
                    const parameters = {
                        // Monitoring data (40001-40011)
                        monitoringData: Object.fromEntries(
                            Array.from({length: 11}, (_, i) => [
                                `4000${i + 1}`, 
                                allRegisters[i] || 0
                            ])
                        ),
                        // Admin data (40012-40070)
                        adminData: Object.fromEntries(
                            Array.from({length: 59}, (_, i) => [
                                (40012 + i).toString(), 
                                allRegisters[i + 11] || 0
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
                    await saltMachineService.handleConnectionLoss(machine);
                }
                
                await notificationService.notifyMainServer(machine);
            }
        } catch (error) {
            console.error('Error updating machine status:', error.message);
        }
    }

    async handleConnectionLoss(machine) {
        try {            
            let lastMachineStatus = saltMachineService.lastMachinesStatus.get(machine.machineId);
            if (lastMachineStatus === undefined) {
                lastMachineStatus = saltMachineService.lastMachinesStatus.get(machine._id.toString());
            }
            
            const activeOrPausedShifts = await SaltMachine.find({ 
                machineId: machine.machineId, 
                status: { $in: ['active', 'paused'] }
            }).sort({ createdAt: -1 });
            
            if (activeOrPausedShifts.length > 0) {
                for (const shift of activeOrPausedShifts) {
                    let newStatus;
                    
                    if (lastMachineStatus === 1) {
                        newStatus = 'incomplete';
                        console.log(`[${machine.name}] Shift ${shift.shiftId}: Machine was RUNNING before disconnect -> INCOMPLETE`);
                    } else if (lastMachineStatus === 0) {
                        newStatus = 'complete';
                        shift.endTime = new Date();
                        console.log(`[${machine.name}] Shift ${shift.shiftId}: Machine was STOPPED before disconnect -> COMPLETED`);
                    } else {
                        newStatus = 'incomplete';
                        console.log(`[${machine.name}] Shift ${shift.shiftId}: No machine status available -> INCOMPLETE (default)`);
                    }
                    
                    shift.status = newStatus;
                    
                    await shift.save();
                    console.log(`[${machine.name}] Updated shift ${shift.shiftId} status to: ${newStatus}`);
                    
                    try {
                        await notificationService.notifyMainServerShiftChanged(shift);
                    } catch (notifyError) {
                        console.error(`[${machine.name}] Failed to notify shift change:`, notifyError.message);
                    }
                }
                
                console.log(`[${machine.name}] Completed updating ${activeOrPausedShifts.length} active/paused shifts`);
            } else {
                console.log(`[${machine.name}] No active or paused shifts found to update`);
            }
                        
        } catch (error) {
            console.error(`[${machine.name}] Error handling connection loss:`, error.message);
        }
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
        buffer.writeUInt16BE(570, 10);
        return { buffer, transactionId };
    }

    getNextTransactionId(machineId) {
        if (!this.machineTransactionIds.has(machineId)) this.machineTransactionIds.set(machineId, 1);
        let currentId = this.machineTransactionIds.get(machineId);
        currentId++;
        this.machineTransactionIds.set(machineId, currentId);
        return currentId;
    }

    extractBackupShifts(allRegisters) {
        const backupShifts = [];
        
        console.log(`Total registers available: ${allRegisters.length}`);
        
        for (let shiftIndex = 0; shiftIndex < 5; shiftIndex++) {
            const startIdx = 100 + (shiftIndex * 100); 
            
            if (startIdx + 70 > allRegisters.length) {
                console.log(`Backup shift ${shiftIndex + 1}: Not enough data (need ${startIdx + 70}, have ${allRegisters.length})`);
                continue;
            }
            
            const shiftRegisters = allRegisters.slice(startIdx, startIdx + 70);
            
            const shiftIdLow = shiftRegisters[8] || 0; 
            const shiftIdHigh = shiftRegisters[9] || 0;  
                        
            if (shiftIdLow !== 0 || shiftIdHigh !== 0) {
                backupShifts.push({
                    index: shiftIndex + 1,
                    registers: shiftRegisters
                });
                console.log(`Found valid backup shift ${shiftIndex + 1}: ${shiftIdLow}-${shiftIdHigh}`);
            } else {
                console.log(`Backup shift ${shiftIndex + 1}: No valid shift ID (both Low and High are 0)`);
            }
        }
        
        console.log(`Total backup shifts found: ${backupShifts.length}`);
        return backupShifts;
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