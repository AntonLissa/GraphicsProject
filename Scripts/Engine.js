import EngineSound from "./EngineSound.js";
class Engine {
    constructor(rpm, torqueCurves) {
        this.minRpm = rpm[0];
        this.maxRpm = rpm[1];
        this.torqueCurves = torqueCurves;
        this.currentRpm = this.minRpm;
        this.over80 = false;
        this.sound = new EngineSound(50, 700)
        this.sound.start(this.getSoundFrequency(this.minRpm))
        this.rpm = this.minRpm
    }


    getSoundFrequency(){
        return this.rpm * (this.sound.maxFrequency - this.sound.minFrequency) / this.maxRpm + this.sound.minFrequency;
    }

    updateSound(){
        this.sound.updateEngineSound(this.getSoundFrequency())
    }

    updateRpm(speed, gearRatio, finalDriveRatio, diameter){
        this.rpm = this.getRpmFromSpeed(speed, gearRatio, finalDriveRatio, diameter); // real rpm
        this.updateSound()
    }


    
    getTorque() {
        //.log('data', speed, gear, gearRatio, finalDriveRatio, diameter)
        //athis.updateRpm()
        const minTorque = this.torqueCurves[0];
        const maxTorque = this.torqueCurves[1];

        if (this.rpm < this.minRpm) 
            return minTorque;

        if (this.rpm > this.maxRpm){
            return -(this.rpm-this.maxRpm)/4; // freno motore?
        }
    
        // after 80% max rpm the torque decreases
        const eightyPercentMaxRpm = 0.8 * this.maxRpm; 
    
        if (this.rpm <= eightyPercentMaxRpm) {
            // below 80% 
            //console.log('interp',this.interpolateTorque(rpm, minTorque, maxTorque), rpm);
            this.over80 = false
            const torque = this.interpolateTorque(this.rpm, minTorque, maxTorque);
            return torque ;
        } else {
            // above 80%, torque reduction
            this.over80 = true
            const reductionFactor = (this.rpm - eightyPercentMaxRpm) / (this.maxRpm - eightyPercentMaxRpm);
            const reducedTorque = Math.max(minTorque, minTorque + (maxTorque - minTorque) * (1 - reductionFactor));
            return reducedTorque;
        }
    }

    // get torque given rpm
    interpolateTorque(rpm, minTorque, maxTorque) {
        const torqueRange = maxTorque - minTorque;
        const rpmRange = this.maxRpm - this.minRpm;
        const normalizedRpm = (rpm - this.minRpm) / rpmRange;
        return minTorque + torqueRange * normalizedRpm;
    }



    // get rpm given speed
    getRpmFromSpeed(carSpeed, gearRatio, finalDriveRatio, wheelDiameter) {
        const wheelCircumference = Math.PI * wheelDiameter; 
        const speedInMetersPerMinute = carSpeed * 60; 
        const rpm = Math.round((speedInMetersPerMinute * gearRatio * finalDriveRatio) / wheelCircumference);
        if (typeof rpm !== 'number' || isNaN(rpm)) return this.minRpm
        return Math.max(this.minRpm, rpm);
    }

    getCurrentRpm(){
        return this.rpm;
    }

    increaseRpm(rate) {
        this.currentRpm = Math.min(this.currentRpm + rate, this.maxRpm);
    
    }

    decreaseRpm(rate) {
        this.currentRpm = Math.max(this.currentRpm - rate, this.minRpm);
    }
}


export default Engine;
