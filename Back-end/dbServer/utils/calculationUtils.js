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
        if (!duration || duration <= 0) {
            if (typeof totalWeightFilled === 'object' && totalWeightFilled !== null && 
                (totalWeightFilled.hasOwnProperty('onionPowderWeight') || 
                totalWeightFilled.hasOwnProperty('garlicPowderWeight'))) {
                return {
                    onionEfficiency: 0,
                    garlicEfficiency: 0
                };
            }
            return 0; // Máy muối
        }
        const durationInHours = duration / 60;

        if (typeof totalWeightFilled === 'object' && totalWeightFilled !== null && 
            (totalWeightFilled.hasOwnProperty('onionPowderWeight') || 
            totalWeightFilled.hasOwnProperty('garlicPowderWeight'))) {
            
            const onionWeight = totalWeightFilled.onionPowderWeight || 0;
            const garlicWeight = totalWeightFilled.garlicPowderWeight || 0;
            
            return {
                onionEfficiency: Number((onionWeight / durationInHours).toFixed(2)),
                garlicEfficiency: Number((garlicWeight / durationInHours).toFixed(2))
            };
        }

        if (!totalWeightFilled) return 0;
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