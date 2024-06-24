class Controls {
  constructor(car) {
      this.car = car;
      this.keysPressed = {};
      this.keysReleased = {};

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
  }

  update() {
      if (this.car.mesh) {
       if (this.keysPressed['s']) {
            this.car.brake();
        } else {
            this.car.accelerate(Math.sign(this.car.speed.length()), 1); // 0 = no power from engine
            //this.car.engine.decreaseRpm(200); // Riduci gradualmente gli RPM quando non si accelera
        }
          
          if (this.keysPressed['a']) {
            this.car.steer(1, 1);

          }
          
          if (this.keysPressed['d']){
              this.car.steer(1, -1);
          }
          
          if (this.keysReleased['arrowright']) 
              this.car.gearUp();
          
          if (this.keysReleased['arrowleft']) 
              this.car.gearDown();

          if (this.keysReleased['r']) 
              this.car.retro();
      }

      // Reset keysReleased after update
      this.keysReleased = {};
  }
}

  
  export default Controls;