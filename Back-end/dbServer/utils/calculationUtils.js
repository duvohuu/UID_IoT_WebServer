export class CalculationUtils {
    // Calculate shift duration in minutes
    static calculateDuration(startTime, endTime, pausedTime) {
        if (!startTime) return 0;

        const start = startTime instanceof Date ? startTime : new Date(startTime);
        const end = endTime instanceof Date ? endTime : new Date(endTime);

        // Calculate total time in minutes
        const totalTimeMs = end - start;
        const totalTimeMinutes = totalTimeMs / (1000 * 60);
        
        // pausedTime is already in minutes (Number)
        const pausedTimeMinutes = pausedTime;
        
        // Active duration = Total time - Paused time
        const activeDuration = totalTimeMinutes - pausedTimeMinutes;
        
        return activeDuration;
    }

    //Calculate production efficiency (kg/hour)
    static calculateEfficiency(totalWeightFilled, duration) {
        // Nếu là object (máy bột), lấy tổng các trường
        if (typeof totalWeightFilled === 'object' && totalWeightFilled !== null) {
            totalWeightFilled = (totalWeightFilled.onionPowderWeight || 0) + (totalWeightFilled.garlicPowderWeight || 0);
        }
        if (!totalWeightFilled || !duration || duration <= 0) return 0;
        const durationInHours = duration / 60;
        return Number((totalWeightFilled / durationInHours).toFixed(2));
    }
    
    // Calculate all metrics for a shift
    static calculateAllMetrics(shift) {
        if (shift.timeTracking) {
            shift.duration = this.calculateDuration(
                shift.timeTracking.shiftStartTime, 
                shift.timeTracking.shiftEndTime,    
                shift.timeTracking.shiftPausedTime 
            );
        }

        shift.efficiency = this.calculateEfficiency(shift.totalWeightFilled, shift.duration);
        return shift;
    }
}