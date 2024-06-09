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
        if (this.keysPressed['w']) {
            this.car.accelerate(1, 1);
            this.car.engine.increaseRpm(200); // Aumenta gli RPM quando si accelera
        } else if (this.keysPressed[' ']) {
            this.car.brake();
        } else {
            this.car.accelerate(Math.sign(this.car.speed), 0); // 0 = no power from engine
            this.car.engine.decreaseRpm(200); // Riduci gradualmente gli RPM quando non si accelera
        }
          
          if (this.keysPressed['a']) {
            this.car.setSteeringCoefficient(0.5); // Sterzare a metà del massimo angolo

            //this.car.mesh.rotation.y += this.car.rotationSpeed;

          }
          
          if (this.keysPressed['d']){

            this.car.setSteeringCoefficient(-0.5); 
              //this.car.mesh.rotation.y += this.car.rotationSpeed;
          }
              this.car.mesh.rotation.y -= this.car.rotationSpeed;
          
          if (this.keysReleased['e']) 
              this.car.gearUp();
          
          if (this.keysReleased['q']) 
              this.car.gearDown();

          if (this.keysReleased['r']) 
              this.car.retro();
      }

      // Reset keysReleased after update
      this.keysReleased = {};
  }
}

  
  export default Controls;