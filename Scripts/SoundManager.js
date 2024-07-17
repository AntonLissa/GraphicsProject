class SoundManager {
    constructor() {
        
    }

    static gearShiftSound() {
        this.gearShift = new Audio('/sounds/gear_shift.mp3');
        this.gearShift.play();
    }


}

export default SoundManager
