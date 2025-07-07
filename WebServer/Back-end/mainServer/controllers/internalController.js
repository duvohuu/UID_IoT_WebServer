export const handleMachineUpdate = (req, res) => {
    const machineUpdate = req.body;
    const io = req.app.get('io');
    
    io.emit("machineStatusUpdate", machineUpdate);
    res.json({ success: true, message: "Machine update broadcasted" });
};

export const handleShiftCompleted = (req, res) => {
    const shiftData = req.body;
    const io = req.app.get('io');
    
    io.emit("SaltMachineCompleted", shiftData);
    res.json({ success: true, message: "Shift completion broadcasted" });
};

export const handleShiftStarted = (req, res) => {
    const shiftData = req.body;
    const io = req.app.get('io');
    
    // Broadcast to Frontend via Socket.IO
    io.emit("SaltMachineUpdate", {
        type: 'shift_started',
        shift: shiftData,
        timestamp: new Date()
    });
    
    res.json({ success: true, message: "Shift start broadcasted" });
};

export const handleShiftChanged = async (req, res) => {
    try {
        const { 
            shiftId, 
            machineId, 
            machineName,
            userId,
            operatorName,
            machineNumber,
            status, 
            machineStatus,
            saltTankStatus,
            saltType,
            targetWeight, 
            totalWeightFilled,
            totalBottlesProduced,
            activeLinesCount,
            shiftNumber, 
            errorCode,
            motorControl,
            timeTracking,
            efficiency,
            pauseTracking,
            loadcellConfigs,
        } = req.body;
        
        console.log(`📡 Received shift status change: ${shiftId} (${machineName}) -> ${status}`);
        
        const io = req.app.get('io');
        
        io.emit("shiftStatusChanged", {
            shiftId, 
            machineId, 
            machineName,
            userId,
            operatorName,
            machineNumber,
            status, 
            machineStatus,
            saltTankStatus,
            saltType,
            targetWeight, 
            totalWeightFilled,
            totalBottlesProduced,
            activeLinesCount,
            shiftNumber, 
            errorCode,
            motorControl,
            timeTracking,
            efficiency,
            pauseTracking,
            loadcellConfigs,
        });
        
        res.json({ success: true, message: "Shift status change broadcasted" });
        
    } catch (error) {
        console.error("❌ Error handling shift status change:", error.message);
        res.status(500).json({ message: "Error handling shift status change" });
    }
};