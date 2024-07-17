import SoundManager from "./SoundManager.js";

class Controls {
    constructor(car) {
      this.car = car;
      this.keysPressed = {};
      this.keysReleased = {};

      this.previousGamepadState = null;

      this.sound = new SoundManager();
   
      document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        this.keysPressed[key] = true;
        this.keysReleased[key] = false;
      });
  
      document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        this.keysPressed[key] = false;
        this.keysReleased[key] = true;
      });
  
      window.addEventListener("gamepadconnected", (event) => {
        this.gamepad = event.gamepad;
        console.log(`Gamepad connected at index ${this.gamepad.index}: ${this.gamepad.id}.`);
      });
  
      window.addEventListener("gamepaddisconnected", (event) => {
        this.gamepad = null;
        console.log(`Gamepad disconnected from index ${event.gamepad.index}: ${event.gamepad.id}.`);
      });
    }
  vibrateGamepad(intensity, duration) {
    if (this.gamepad && this.gamepad.vibrationActuator) {
      this.gamepad.vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration: duration,
        weakMagnitude: intensity,
        strongMagnitude: intensity
      });
    } else if (this.gamepad && this.gamepad.hapticActuators) {
      for (let actuator of this.gamepad.hapticActuators) {
        actuator.pulse(intensity, duration);
      }
    }
  }
  
    update() {

        if(!this.gamepad){

            // Controlli da tastiera
            if (this.keysPressed['w']) {
              this.car.accelerate(1, 1); // 1 = accelerate, 1 = full throttle
            } else if (this.keysPressed['s']) {
                this.car.brake(1)
            } else {
              this.car.accelerate(0, 1); // 0 = no power from engine
            }
      
            if (this.keysPressed['a']) {
              this.car.smoothSteer(1); // 1 = max intensity
            }else if (this.keysPressed['d']) {
              this.car.smoothSteer(-1);
            }
            else{
                this.car.smoothSteer(0) // go back to 0
            }
      
            if (this.keysReleased['arrowright']) {
              this.car.gearUp();
              SoundManager.gearShiftSound()
            }
      
            if (this.keysReleased['arrowleft']) {
              this.car.gearDown();
              SoundManager.gearShiftSound()
            }
        }
        else{
          // gamepad connected     

          if(this.car.engine.over80){
            this.vibrateGamepad(0.2, 10) //vibration when it's time to change gear
          }
          if(this.car.wheelsOutRoad){
            this.vibrateGamepad(1, 10) // vibration if out of road
          }
          
          const gp = navigator.getGamepads()[this.gamepad.index];
  
          // Accelerazione e frenata
          const r2 = gp.buttons[7].value; // R2 button (accelerate)
          const l2 = gp.buttons[6].value; // L2 button (brake)

          if(l2 > 0){
            this.car.brake(l2) // l2 value = pressure on the brake pedal
          }
          else if(r2 > 0){
            this.car.accelerate(1, r2); // r2 = pressure on gas pedal
          } else {
            this.car.accelerate(0, 1); // 0 = no power from engine
          }
  
          // Left stick X axis for how much we want to steer
          this.car.steer(-gp.axes[0]);
  
          // gears
          if (this.previousGamepadState) {
              if (!this.previousGamepadState.buttons[5].pressed && gp.buttons[5].pressed) { // R1 button (gear up)
                this.car.gearUp();
                SoundManager.gearShiftSound()
              }
              if (!this.previousGamepadState.buttons[4].pressed && gp.buttons[4].pressed) { // L1 button (gear down)
                this.car.gearDown();
                SoundManager.gearShiftSound()
              }
            }
    
            this.previousGamepadState = gp;
        }
  
        
        // Reset keysReleased after update
        this.keysReleased = {};
      }
    
  }
  
  
  export default Controls;