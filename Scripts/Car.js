

import * as THREE from "three";
import Physics from './Physics.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
class Car {
    constructor(game, mass, engine, gearRatios, diffRatios, wheelRadius, rotationSpeed) {
      this.game = game;
      this.mass = mass;
      this.mesh = null;
      this.engine = engine;
      this.speed = new THREE.Vector3(0,0,0);
      this.acceleration = new THREE.Vector3(0,0,0);
      this.gear = 0;
      this.brakeForce = 5000;
      this.gearRatios = gearRatios;
      this.diffRatios = diffRatios;
      this.wheelRadius = wheelRadius;
      this.rotationSpeed = rotationSpeed;
      this.maxSteeringAngle = 60;
      this.length = 5;
      this.com_height = 0.4;
      this.angular_velocity = 0;
      this.steeringAngle = 0;
      this.yawRate = 0;
      this.grip = 2;
      this.corneringStiffness = 30;
      this.accelerating = false;
      this.velocityLocal = new THREE.Vector3(0,0,0);
      this.loadModel();
      this.skid = new SkidMarks(game.scene);
    }
  

    loadModel() {
        const loader = new GLTFLoader();
        loader.load('scene.gltf', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.position.set(0, 0, 0);
            this.mesh.scale.set(1, 1, 1);
            this.mesh.rotation.y = 3.14;
                    // Aggiungi gli assi al modello
        const axesHelper = new THREE.AxesHelper(5);
        this.mesh.add(axesHelper);
        
            this.game.scene.add(this.mesh);
        }, undefined, (error) => {
            console.error(error);
        });
    }

    checkShouldStop(){

    
    }


    accelerate(coeff1, coeff2){

      if(coeff1 == 1)  this.accelerating = true;
      else this.accelerating = false;

      const motorPower = coeff2*this.engine.getTorque(this.velocityLocal.z, this.gearRatios[this.gear], this.diffRatios, this.wheelRadius) * this.gearRatios[this.gear]*this.diffRatios;

      const traction = motorPower*Math.cos(this.steeringAngle);
      //this.acceleration.copy(Physics.doPhysics(traction, this).multiplyScalar(coeff1));
      this.acceleration.copy(Physics.doPhysics(traction, this));
      
      this.speed.add(this.acceleration.clone());
      this.velocityLocal = this.speed.clone().applyQuaternion(this.mesh.quaternion.clone().conjugate())


      
      //this.velocityLocal = this.speed.clone().applyQuaternion(this.mesh.quaternion.clone().conjugate())

      //this.checkShouldStop();

     // console.log('accel:', this.acceleration);
      //console.log('speed:', this.speed);

      this.mesh.position.add(this.speed.clone().multiplyScalar(Physics.dT));

      //this.moveForward();

      this.steeringAngle = 0;
    }

    brake(){
      if(this.speed.z == 0) return;
      this.acceleration.copy(Physics.doPhysics(-this.brakeForce, this));
      this.speed.add(this.acceleration.clone());
      this.velocityLocal = this.speed.clone().applyQuaternion(this.mesh.quaternion.clone().conjugate())

      this.engine.updateRpm(this.speed.z, this.gearRatios[this.gear], this.diffRatios, this.wheelRadius);
      
      this.checkShouldStop();
      
      this.mesh.position.add(this.speed.clone().multiplyScalar(Physics.dT));
    }


    gearUp(){
      if(this.gear < (this.gearRatios.length-2))
          this.gear++;
    }

    gearDown(){
      if(this.gear>=1)
        this.gear--;
    }

    retro(){
      console.log('_____________________retro');
      if(Math.abs(this.speed) < 1 && this.gear == 0)
       this.gear = this.gearRatios.length-1;
    }

    steer(intensity, leftOrRight) {
        this.steeringAngle = THREE.MathUtils.clamp(intensity*THREE.MathUtils.degToRad(leftOrRight*this.maxSteeringAngle)*Physics.dT*10, -this.maxSteeringAngle, this.maxSteeringAngle);
       // this.updateSteering()
    }


    updateSteering(){
      if (this.steeringAngle != 0){
          let turning_radius = this.length / Math.sin(this.steeringAngle)
          this.angular_velocity = this.speed.z / turning_radius
      }
      else{
          this.angular_velocity = 0
      }

      this.mesh.rotation.y += this.angular_velocity * Physics.dT;
    }



    moveForward(){
        const deltaPosition = this.speed.clone().multiplyScalar(Physics.dT);

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        forward.multiplyScalar(deltaPosition.z);

        const lateral = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);
        lateral.multiplyScalar(deltaPosition.x);
        
        this.mesh.position.add(lateral).add(forward);
    
    }






  }
  






  class SkidMarks {
    constructor(scene) {
        this.scene = scene;
        this.skidMarks = [];
        this.skidMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
    }

    addSkidMark(position, direction) {
      const skidLength = 0.1; // Lunghezza di ogni segmento di sgommata
      const skidWidth = 0.6;  // Larghezza della sgommata

      // Creazione della geometria della sgommata
      const geometry = new THREE.PlaneGeometry(skidLength, skidWidth);
      const mesh = new THREE.Mesh(geometry, this.skidMaterial);

      // Imposta la posizione della sgommata
      mesh.position.copy(position);
      
      // Allinea la sgommata nella direzione del movimento
      mesh.lookAt(position.clone().add(direction));
      
      

      this.scene.add(mesh);
      this.skidMarks.push(mesh);
  }

    clearSkidMarks() {
        this.skidMarks.forEach(mark => {
            this.scene.remove(mark);
        });
        this.skidMarks = [];
    }
}



  export default Car;

