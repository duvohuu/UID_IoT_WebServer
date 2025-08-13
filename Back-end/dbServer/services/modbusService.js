import net from "net";
import Machine from "../models/Machine.js";
import { MODBUS_CONFIG, NETWORK_CONFIG } from "../config/modbus.js";
import { saltMachineService } from "./saltMachineService.js";
import { powderMachineService } from "./powderMachineService.js";
import { mainServerSyncService } from "./mainServerSyncService.js";
import SaltMachine from "../models/SaltMachine.js";
import PowderMachine from "../models/PowderMachine.js";

class ModbusService {
    constructor() {
        this.machineTransactionIds = new Map();
        this.machineConnectionLocks = new Map();
        this.isPolling = false;
    }

    logMachine(machine, message, level = 'info') {
        const prefix = `[${machine.name}]`;
        switch (level) {
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }

    // ========================================
    // START THE MODBUS POLLING SYSTEM
    // ========================================
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

    // ========================================
    // START SCANNING ALL MACHINES
    // ========================================
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
                    this.logMachine(machine, `Connection loss detected - handling shift update`);
                    await this.handleConnectionLoss(machine);
                }
                                
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

    // ========================================
    // READ DATA FROM A MACHINE
    // ========================================
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

    // ========================================
    // HANDLE READING DATA FROM A MACHINE
    // ========================================
    async performModbusRead(machine) {
        return new Promise(async (resolve) => {
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

            const completeWithError = async (error, message) => {
                if (isResolved) return;
                
                this.logMachine(machine, message, 'error');
                await this.handleConnectionLoss(machine);
                
                await this.updateMachineStatus(machine._id, {
                    isConnected: false,
                    status: 'offline',
                    lastError: error,
                    disconnectedAt: new Date()
                });
                
                isResolved = true;
                cleanup();
                resolve({ success: false, error });
            };

            connectionTimer = setTimeout(() => 
                completeWithError('timeout', 'Connection timeout - updating status to offline'), 
                MODBUS_CONFIG.timeout
            );

            try {
                // Kết nối đến thiết bị
                await new Promise((connectResolve, connectReject) => {
                    client.connect(MODBUS_CONFIG.port, machine.ip, () => connectResolve());
                    client.once('error', (err) => connectReject(err));
                });
                // Đọc 70 thanh ghi đầu tiên (40001-40070)
                const mainRegistersResult = await this.readModbusRegisters(machine, 0, 70, { 
                    useExistingClient: client 
                });
                if (!mainRegistersResult || isResolved) {
                    if (!isResolved) {
                        await completeWithError('Failed to read main registers', 'Failed to read main registers');
                    }
                    return;
                }
                // Thêm độ trễ nhỏ giữa các lần đọc
                await new Promise(r => setTimeout(r, 100));
                // Đọc riêng thanh ghi 40100 để tránh xung đột
                const backupRegisterResult = await this.readModbusRegisters(machine, 99, 1, {
                    returnSingleValue: true
                });
                if (backupRegisterResult === null && !isResolved) {
                    this.logMachine(machine, `Warning: can't read the 40100 register privately`, 'warn');
                }

                const allRegisters = mainRegistersResult.registers;
                const backupRegister = backupRegisterResult !== null ? backupRegisterResult : 0;
                this.logMachine(machine, `Register 40100: ${backupRegister} (${backupRegister.toString(2).padStart(16, '0')})`);

                try {
                    this.logMachine(machine, `Processing current shift...`);
                    if (machine.type === 'Salt Filling Machine') {
                        await saltMachineService.handleTracking(machine, allRegisters);
                    }
                    else if (machine.type === 'Powder Filling Machine') {
                        await powderMachineService.handleTracking(machine, allRegisters);
                    }

                    this.logMachine(machine, `Processing backup shifts...`);
                    await this.processBackupShifts(machine, null, backupRegister);

                } catch (shiftError) {
                    this.logMachine(machine, `MachineService error: ${shiftError.message}`, 'error');
                }

                const parameters = {
                    // Monitoring data (40001-40011)
                    monitoringData: Object.fromEntries(
                        Array.from({length: 11}, (_, i) => [`4000${i + 1}`, allRegisters[i] || 0])
                    ),
                    // Admin data (40012-40070)
                    adminData: Object.fromEntries(
                        Array.from({length: 59}, (_, i) => [(40012 + i).toString(), allRegisters[i + 11] || 0])
                    ),
                    // Backup status register
                    backupStatus: {
                        '40100': backupRegister,
                    }
                };
                
                await this.updateMachineStatus(machine._id, { 
                    isConnected: true, 
                    status: 'online', 
                    lastHeartbeat: new Date(), 
                    parameters, 
                    lastError: null 
                });
                
                if (!isResolved) {
                    isResolved = true; 
                    cleanup(); 
                    resolve({ success: true });
                }
            } catch (err) {
                await completeWithError(err.message, `Connection error - checking last machine status`);
            }
        });
    }

    // ========================================
    // READ MODBUS REGISTERS
    // ========================================
    async readModbusRegisters(machine, startRegister, count, options = {}) {
        const { 
            useExistingClient = null, 
            timeout = 5000, 
            returnSingleValue = false 
        } = options;
        
        let client = useExistingClient;
        let needToCleanup = false;
        
        if (!client) {
            client = new net.Socket();
            client.setTimeout(timeout);
            needToCleanup = true;
            
            try {
                await new Promise((connectResolve, connectReject) => {
                    client.connect(MODBUS_CONFIG.port, machine.ip, () => connectResolve());
                    client.once('error', (err) => connectReject(err));
                });
            } catch (err) {
                if (needToCleanup && !client.destroyed) client.destroy();
                this.logMachine(machine, `Error connecting when reading: ${err.message}`, 'error');
                return null;
            }
        }
        
        return new Promise((resolve) => {
            const { buffer } = this.createModbusReadRequest(machine, startRegister, count);
            let readResolved = false;
            
            const cleanup = () => {
                if (needToCleanup && !client.destroyed) {
                    client.removeAllListeners();
                    client.destroy();
                }
            };
            
            const readTimeout = setTimeout(() => {
                if (!readResolved) {
                    this.logMachine(machine, `Time out when reading from ${startRegister + 1} to ${startRegister + count} hết thời gian`, 'warn');
                    readResolved = true;
                    cleanup();
                    resolve(null);
                }
            }, timeout);
            
            const onReadResponse = (data) => {
                if (readResolved) return;
                
                if (data.length >= 9 && data[7] > 0x80) {
                    this.logMachine(machine, `Error in Modbus when reading: ${data[8]}`, 'error');
                    readResolved = true;
                    clearTimeout(readTimeout);
                    client.removeListener('data', onReadResponse);
                    cleanup();
                    resolve(null);
                    return;
                }
                
                const expectedDataLength = 9 + (count * 2);
                if (data.length >= expectedDataLength) {
                    const registers = [];
                    for (let i = 0; i < count; i++) {
                        registers[i] = data.readUInt16BE(9 + (i * 2));
                    }
                    
                    readResolved = true;
                    clearTimeout(readTimeout);
                    client.removeListener('data', onReadResponse);
                    cleanup();
                    
                    if (returnSingleValue && count === 1) {
                        resolve(registers[0]);  
                    } else {
                        resolve({
                            registers,
                            raw: data
                        });
                    }
                }
            };
            
            client.on('data', onReadResponse);
            client.on('error', (err) => {
                if (!readResolved) {
                    this.logMachine(machine, `Error when reading register: ${err.message}`, 'error');
                    readResolved = true;
                    clearTimeout(readTimeout);
                    cleanup();
                    resolve(null);
                }
            });
            
            client.write(buffer);
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
                    this.logMachine(machine, `Detected connection loss - Notifying work shift service`);
                    if (machine.type === 'Salt Filling Machine') {
                        await saltMachineService.handleConnectionLoss(machine);
                    } else if (machine.type === 'Powder Filling Machine') {
                        await powderMachineService.handleConnectionLoss(machine);
                    }
                }
                
                await mainServerSyncService.notifyMainServer(machine);
            }
        } catch (error) {
            console.error('Error updating machine status:', error.message);
        }
    }
    // ========================================
    // HANDLE CONNECTION LOSS
    // ========================================
    async handleConnectionLoss(machine) {
        try {
            const isSalt = machine.type === 'Salt Filling Machine';
            const service = isSalt ? saltMachineService : powderMachineService;
            const Model = isSalt ? SaltMachine : PowderMachine;

            let lastMachineStatus = service.lastMachinesStatus.get(machine.machineId);
            if (lastMachineStatus === undefined) {
                lastMachineStatus = service.lastMachinesStatus.get(machine._id.toString());
            }

            const activeOrPausedShifts = await Model.find({
                machineId: machine.machineId,
                status: { $in: ['active', 'paused'] }
            }).sort({ createdAt: -1 });

            if (activeOrPausedShifts.length === 0) {
                this.logMachine(machine, `No active or paused shifts found to update`);
                return;
            }

            for (const shift of activeOrPausedShifts) {
                let newStatus;
                if (lastMachineStatus === 1) {
                    newStatus = 'incomplete';
                    this.logMachine(machine, `Shift ${shift.shiftId}: Machine was RUNNING before disconnect -> INCOMPLETE`);
                } else if (lastMachineStatus === 0) {
                    newStatus = 'complete';
                    shift.endTime = new Date();
                    this.logMachine(machine, `Shift ${shift.shiftId}: Machine was STOPPED before disconnect -> COMPLETED`);
                } else {
                    newStatus = 'incomplete';
                    this.logMachine(machine, `Shift ${shift.shiftId}: No machine status available -> INCOMPLETE (default)`);
                }
                shift.status = newStatus;
                await shift.save();
                this.logMachine(machine, `Updated shift ${shift.shiftId} status to: ${newStatus}`);
                try {
                    await mainServerSyncService.notifyMainServerShiftChanged(shift);
                } catch (notifyError) {
                    this.logMachine(machine, `Failed to notify shift change: ${notifyError.message}`, 'error');
                }
            }
            this.logMachine(machine, `Completed updating ${activeOrPausedShifts.length} active/paused shifts`);
        } catch (error) {
            this.logMachine(machine, `Error handling connection loss: ${error.message}`, 'error');
        }
    }
    
    async processBackupShifts(machine, client, backupRegister) {
        let localClient = client;
        let needToCleanup = false;
        
        if (!localClient) {
            localClient = new net.Socket();
            needToCleanup = true;
            
            try {
                await new Promise((resolve, reject) => {
                    localClient.connect(MODBUS_CONFIG.port, machine.ip, () => resolve());
                    localClient.once('error', (err) => reject(err));
                });
            } catch (err) {
                this.logMachine(machine, `Lỗi kết nối khi xử lý backup: ${err.message}`, 'error');
                if (needToCleanup && !localClient.destroyed) localClient.destroy();
                return;
            }
        }
        
        try {
            const lastBackupRegister = machine.parameters?.backupStatus?.['40100'];
            if (lastBackupRegister > 0 && backupRegister === 0) {
                this.logMachine(machine, `PHÁT HIỆN LỖI: Thanh ghi 40100 đột ngột từ ${lastBackupRegister.toString(2).padStart(16, '0')} thành 0`, 'warn');
            }
            
            if (backupRegister === 0) {
                this.logMachine(machine, `CẢNH BÁO: Phát hiện thanh ghi 40100 = 0, tiến hành xác minh trực tiếp`, 'warn');
                try {
                    const verifiedRegister = await this.readModbusRegisters(machine, 99, 1, {returnSingleValue: true});
                    if (verifiedRegister) {
                        this.logMachine(machine, `Đã xác minh thanh ghi 40100 = ${verifiedRegister.toString(2).padStart(16, '0')}`);
                        backupRegister = verifiedRegister;
                        this.logMachine(machine, `LỖI ĐỌC: Đã sửa giá trị thanh ghi từ 0 thành ${verifiedRegister}`);
                    }
                } catch (err) {
                    this.logMachine(machine, `Lỗi khi xác minh thanh ghi 40100: ${err.message}`, 'error');
                }
            }
            
            const shiftStatusBits = backupRegister & 0x3FF; 
            let updatedbackupRegister = backupRegister;
            let hasUnreadShifts = false;
            
            // Xử lý các ca chưa đọc
            for (let shiftIndex = 0; shiftIndex < 10; shiftIndex++) {
                const bitPosition = shiftIndex; 
                const isShiftRead = (shiftStatusBits >> bitPosition) & 1;
                
                if (isShiftRead === 0) { 
                    this.logMachine(machine, `Found unread shift at position ${shiftIndex + 1} (bit ${bitPosition})`);
                    hasUnreadShifts = true;
                    
                    try {
                        // Đọc dữ liệu ca backup
                        const startRegister = 100 + (shiftIndex * 100);
                        const shiftData = await this.readModbusRegisters(machine, startRegister, 100, {
                            useExistingClient: localClient,
                            timeout: 5000
                        });
                        
                        if (shiftData) {
                            const relevantData = {
                                index: shiftIndex + 1,
                                registers: shiftData.registers.slice(0, 70)
                            };
                            const service = machine.type === 'Salt Filling Machine'
                                ? saltMachineService
                                : powderMachineService;
                            await service.handleBackupShift(machine, relevantData, shiftIndex);
                            this.logMachine(machine, `Marked shift ${shiftIndex + 1} as read`);
                        } else {
                            this.logMachine(machine, `Failed to read backup shift ${shiftIndex + 1} - marking as read anyway`, 'warn');
                        }
            
                        updatedbackupRegister |= (1 << bitPosition);
                        this.logMachine(machine, `Updated register 40100: ${updatedbackupRegister.toString(2).padStart(16, '0')}`);
                    } catch (error) {
                        this.logMachine(machine, `Error reading backup shift ${shiftIndex + 1}: ${error.message}`, 'error');
                    }
                }
            }
            
            // Ghi lại giá trị thanh ghi đã cập nhật
            if (hasUnreadShifts && updatedbackupRegister !== backupRegister) {
                this.logMachine(machine, `Đang ghi lại thanh ghi 40100 = ${updatedbackupRegister.toString(2).padStart(16, '0')} vào thiết bị`);
                await this.writeModbusRegister(machine, 99, updatedbackupRegister, { 
                    useExistingClient: localClient 
                });
                // Xác minh sau khi ghi
                const verifiedAfterWrite = await this.readModbusRegisters(machine, 99, 1, {
                    useExistingClient: localClient,
                    returnSingleValue: true
                });
                this.logMachine(machine, `Xác minh sau khi ghi: 40100 = ${verifiedAfterWrite !== null ? 
                    verifiedAfterWrite.toString(2).padStart(16, '0') : 'null'}`);
            }
        } finally {
            if (needToCleanup && localClient && !localClient.destroyed) {
                localClient.destroy();
            }
        }
    }
    // WRITE TO A MODBUS REGISTER
    async writeModbusRegister(machine, registerAddress, value, options = {}) {
        const { useExistingClient = null, timeout = 3000 } = options;
        let client = useExistingClient;
        let needToCleanup = false;
        
        if (!client) {
            client = new net.Socket();
            needToCleanup = true;
            
            try {
                await new Promise((resolve, reject) => {
                    client.connect(MODBUS_CONFIG.port, machine.ip, () => resolve());
                    client.once('error', (err) => reject(err));
                });
            } catch (err) {
                this.logMachine(machine, `Lỗi kết nối khi ghi thanh ghi: ${err.message}`, 'error');
                if (needToCleanup && !client.destroyed) client.destroy();
                return false;
            }
        }
        
        return new Promise((resolve) => {
            const { buffer } = this.createModbusWriteRequest(machine, registerAddress, value);
            let writeResolved = false;
            
            const cleanup = () => {
                if (needToCleanup && !client.destroyed) {
                    client.removeAllListeners();
                    client.destroy();
                }
            };
            
            const writeTimeout = setTimeout(() => {
                if (!writeResolved) {
                    this.logMachine(machine, `Write timeout for register ${registerAddress + 1}`, 'warn');
                    writeResolved = true;
                    cleanup();
                    resolve(false);
                }
            }, timeout);

            const onWriteResponse = (data) => {
                if (writeResolved) return;
                
                if (data.length >= 8) {
                    this.logMachine(machine, `Successfully updated register ${registerAddress + 1} = ${value} (${value.toString(2).padStart(16, '0')})`);
                    writeResolved = true;
                    clearTimeout(writeTimeout);
                    client.removeListener('data', onWriteResponse);
                    client.removeListener('error', onWriteError);
                    cleanup();
                    resolve(true);
                }
            };

            const onWriteError = (err) => {
                if (!writeResolved) {
                    this.logMachine(machine, `Error writing register ${registerAddress + 1}: ${err.message}`, 'error');
                    writeResolved = true;
                    clearTimeout(writeTimeout);
                    client.removeListener('data', onWriteResponse);
                    client.removeListener('error', onWriteError);
                    cleanup();
                    resolve(false);
                }
            };

            client.on('data', onWriteResponse);
            client.on('error', onWriteError);
            client.write(buffer);
        });
    }

    createModbusReadRequest(machine, startRegister = 0, registerCount = 70) {
        const buffer = Buffer.alloc(12);
        const transactionId = this.getNextTransactionId(machine._id);
        buffer.writeUInt16BE(transactionId, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(6, 4);
        buffer.writeUInt8(1, 6);
        buffer.writeUInt8(3, 7);
        buffer.writeUInt16BE(startRegister, 8);
        buffer.writeUInt16BE(registerCount, 10);
        return { buffer, transactionId };
    }

    createModbusWriteRequest(machine, registerAddress, value) {
        const buffer = Buffer.alloc(12);
        const transactionId = this.getNextTransactionId(machine._id);
        buffer.writeUInt16BE(transactionId, 0);
        buffer.writeUInt16BE(0, 2);
        buffer.writeUInt16BE(6, 4);
        buffer.writeUInt8(1, 6);
        buffer.writeUInt8(6, 7); 
        buffer.writeUInt16BE(registerAddress, 8);
        buffer.writeUInt16BE(value, 10);
        return { buffer, transactionId };
    }

    getNextTransactionId(machineId) {
        if (!this.machineTransactionIds.has(machineId)) this.machineTransactionIds.set(machineId, 1);
        let currentId = this.machineTransactionIds.get(machineId);
        currentId++;
        this.machineTransactionIds.set(machineId, currentId);
        return currentId;
    }  
}

export const modbusService = new ModbusService();