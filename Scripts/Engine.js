class Engine {
    constructor(rpm, torqueCurves) {
        this.minRpm = rpm[0];
        this.maxRpm = rpm[1];
        this.torqueCurves = torqueCurves;
        this.currentRpm = this.minRpm;
    }

    // Metodo per ottenere la coppia dati gli RPM con diminuzione oltre l'80% dei max RPM
    getTorque(speed, gearRatio, finalDriveRatio, diameter) {
        //.log('data', speed, gear, gearRatio, finalDriveRatio, diameter)
        const rpm = this.getRpmFromSpeed(speed, gearRatio, finalDriveRatio, diameter); // real rpm

        if(speed > 0){
        this.currentRpm = rpm; //visible rpm
        }

        const minTorque = this.torqueCurves[0];
        const maxTorque = this.torqueCurves[1];

        if (rpm < this.minRpm) 
            return minTorque;

        if (rpm >= this.maxRpm){
            return -(rpm-this.maxRpm)/4; // freno motore?
        }
    
        // Calcola l'80% dei max RPM
        const eightyPercentMaxRpm = 0.8 * this.maxRpm; 
    
        if (rpm <= eightyPercentMaxRpm) {
            // Non siamo oltre l'80% dei max RPM, quindi usiamo la curva di coppia normale
            //console.log('interp',this.interpolateTorque(rpm, minTorque, maxTorque), rpm);
            const torque = this.interpolateTorque(rpm, minTorque, maxTorque);
            return torque ;
        } else {
            // Siamo oltre l'80% dei max RPM, quindi diminuiamo gradualmente la coppia
            const reductionFactor = (rpm - eightyPercentMaxRpm) / (this.maxRpm - eightyPercentMaxRpm);
            const reducedTorque = Math.max(minTorque, minTorque + (maxTorque - minTorque) * (1 - reductionFactor));
            return reducedTorque;
        }
    }

    // Metodo per interpolare la coppia in base agli RPM
    interpolateTorque(rpm, minTorque, maxTorque) {
        const torqueRange = maxTorque - minTorque;
        const rpmRange = this.maxRpm - this.minRpm;
        const normalizedRpm = (rpm - this.minRpm) / rpmRange;
        return minTorque + torqueRange * normalizedRpm;
    }

    updateRpm(carSpeed, gearRatio, finalDriveRatio, wheelDiameter){
        this.currentRpm = this.getRpmFromSpeed(carSpeed, gearRatio, finalDriveRatio, wheelDiameter);
    }

    // Metodo per calcolare gli RPM dati la velocità del veicolo
    getRpmFromSpeed(carSpeed, gearRatio, finalDriveRatio, wheelDiameter) {
        const speed = Math.abs(carSpeed);
        const wheelCircumference = Math.PI * wheelDiameter; // Circonferenza della ruota in metri
        const speedInMetersPerMinute = speed * 60; // Conversione da m/s a m/min
        if (speedInMetersPerMinute === 0) {
            return this.minRpm;
        }
        const rpm = Math.round((speedInMetersPerMinute * gearRatio * finalDriveRatio) / wheelCircumference);

        /*if (rpm > this.maxRpm) {
            return this.maxRpm;
        }*/
        //console.log('rpm', rpm, speedInMetersPerMinute, finalDriveRatio, wheelCircumference);
            // Verifichiamo se gli RPM sono un numero valido
        return Math.max(this.minRpm, rpm);
    }

    getCurrentRpm(){
        return this.currentRpm;
    }

    increaseRpm(rate) {
        this.currentRpm = Math.min(this.currentRpm + rate, this.maxRpm);
    
    }

    decreaseRpm(rate) {
        this.currentRpm = Math.max(this.currentRpm - rate, this.minRpm);
    }
}


export default Engine;
