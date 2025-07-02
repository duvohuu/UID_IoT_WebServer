export class CalculationUtils {
    // Calculate shift duration in minutes
    static calculateDuration(startTime, endTime, pausedIntervals = []) {
        if (!startTime) return 0;
        // Total time elapsed
        const totalTime = Math.round((endTime - startTime) / (1000 * 60));
        
        // Calculate total paused time
        const totalPausedTime = this.calculateTotalPausedTime(pausedIntervals, start, end);
        
        // Active duration = Total time - Paused time
        const activeDuration = Math.max(0, totalTime - totalPausedTime);
        
        console.log(`⏱️ Duration calculation for shift:`);
        console.log(`   Total time: ${totalTime} minutes`);
        console.log(`   Paused time: ${totalPausedTime} minutes`);
        console.log(`   Active duration: ${activeDuration} minutes`);
        
        return activeDuration;
    }

    // Calculate total paused time from intervals
    static calculateTotalPausedTime(pausedIntervals = [], shiftStart, shiftEnd) {
        if (!pausedIntervals || pausedIntervals.length === 0) return 0;
        
        let totalPausedMinutes = 0;
        
        pausedIntervals.forEach((interval, index) => {
            const pauseStart = new Date(interval.pauseStart);
            const pauseEnd = interval.pauseEnd ? new Date(interval.pauseEnd) : shiftEnd;
            
            // Ensure pause times are within shift boundaries
            const effectivePauseStart = pauseStart < shiftStart ? shiftStart : pauseStart;
            const effectivePauseEnd = pauseEnd > shiftEnd ? shiftEnd : pauseEnd;
            
            if (effectivePauseStart < effectivePauseEnd) {
                const pauseDuration = Math.round((effectivePauseEnd - effectivePauseStart) / (1000 * 60));
                totalPausedMinutes += pauseDuration;
                
                console.log(`   Pause ${index + 1}: ${pauseDuration} minutes (${effectivePauseStart.toLocaleString()} - ${effectivePauseEnd.toLocaleString()})`);
            }
        });
        
        return totalPausedMinutes;
    }

    // Track machine pause/resume events
    static addPauseInterval(shift, pauseStart, pauseEnd = null) {
        if (!shift.pausedIntervals) {
            shift.pausedIntervals = [];
        }
        
        // Check if there's an ongoing pause
        const ongoingPause = shift.pausedIntervals.find(interval => !interval.pauseEnd);
        
        if (pauseEnd === null) {
            // Starting a new pause
            if (!ongoingPause) {
                shift.pausedIntervals.push({
                    pauseStart: pauseStart,
                    pauseEnd: null,
                    reason: 'Machine stopped'
                });
                console.log(`⏸️ Pause started at: ${new Date(pauseStart).toLocaleString()}`);
            }
        } else {
            // Ending a pause
            if (ongoingPause) {
                ongoingPause.pauseEnd = pauseEnd;
                ongoingPause.duration = Math.round((new Date(pauseEnd) - new Date(ongoingPause.pauseStart)) / (1000 * 60));
                console.log(`▶️ Pause ended at: ${new Date(pauseEnd).toLocaleString()} (Duration: ${ongoingPause.duration} minutes)`);
            }
        }
        
        return shift;
    }

    //Calculate production efficiency (kg/hour)
    static calculateEfficiency(totalWeightFilled, duration) {
        if (!totalWeightFilled || !duration || duration <= 0) return 0;
        
        const durationInHours = duration / 60;
        return Number((totalWeightFilled / durationInHours).toFixed(2));
    }
    
    // Calculate all metrics for a shift
    static calculateAllMetrics(shift) {
        // Calculate duration if not set
        if (shift.startTime && !shift.duration) {
            shift.duration = this.calculateDuration(shift.startTime, shift.endTime);
        }

        // Calculate all metrics
        shift.efficiency = this.calculateEfficiency(shift.totalWeightFilled, shift.duration);
        return shift;
    }
}