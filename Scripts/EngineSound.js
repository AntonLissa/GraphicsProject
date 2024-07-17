class EngineSound {
    constructor(minFrequency, maxFrequency) {
        this.context = Tone.context;
        this.minFrequency = minFrequency;
        this.maxFrequency = maxFrequency;

        // Oscillator setup
        this.engineOscillator = new Tone.Oscillator({
            frequency: this.minFrequency,
            type: 'sawtooth' // Default waveform
        }).start();

        // Noise setup
        this.engineNoise = new Tone.Noise('brown').start();

        // Filter setup
        this.engineFilter = new Tone.Filter({
            frequency: 800,
            type: 'notch' // Default filter type
        });

        // Effects setup
        this.engineDistortion = new Tone.Distortion(0.1); // Distortion effect
        this.engineTremolo = new Tone.Tremolo({
            frequency: 2,
            depth: 0.2
        }).start(); // Tremolo effect
        this.engineDelay = new Tone.FeedbackDelay({
            delayTime: 0.1,
            feedback: 0.1
        }); // Delay effect

        // Volume setup
        this.engineVolume = new Tone.Volume(-12);

        // Connect nodes
        this.engineOscillator.chain(this.engineFilter, this.engineDistortion, this.engineTremolo, this.engineDelay, this.engineVolume, this.context.destination);
        this.engineNoise.chain(this.engineFilter, this.engineDistortion, this.engineTremolo, this.engineDelay, this.engineVolume, this.context.destination);
    }


    start(rpm = 60) {
        this.updateEngineSound(rpm);
    }

    stop() {
        if (this.engineOscillator) {
            this.engineOscillator.stop();
        }
        if (this.engineNoise) {
            this.engineNoise.stop();
        }
    }

    updateEngineSound(rpm) {
        // Adjust frequency range from 50 to 700 based on rpm
        if (typeof rpm !== 'number' || isNaN(rpm)) {
            console.error('Invalid rpm value:', rpm);
            return; // Exit early if rpm is not a valid number
        }
        if (this.engineOscillator) {
            this.engineOscillator.frequency.value = rpm;
        }

        if (this.engineFilter) {
            this.engineFilter.frequency.value = rpm;
        }

    }
}


export default EngineSound;