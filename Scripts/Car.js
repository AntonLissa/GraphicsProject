

import * as THREE from "three";
import Physics from './Physics.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
class Car {
    constructor(game, mass, engine, gearRatios, diffRatios, wheelRadius, startPoint, startOrientation) {
      this.game = game;
      this.mass = mass;
      this.mesh = null;
      this.engine = engine;
      this.speed = new THREE.Vector3(0,0,0);
      this.acceleration = new THREE.Vector3(0,0,0);
      this.gear = 0;
      this.brakeForce = 9000;
      this.gearRatios = gearRatios;
      this.diffRatios = diffRatios;
      this.wheelRadius = wheelRadius;
      this.maxSteeringAngle = 40;
      this.length = 5;
      this.width = 2;
      this.com_height = 0.4;
      this.angular_velocity = 0;
      this.steeringAngle = 0;
      this.yawRate = 0;
      this.grip = 15
      this.corneringStiffness = 30;
      this.accelerating = false;
      this.velocityLocal = new THREE.Vector3(0,0,0);


      this.inertia = (1/12*this.mass*(this.length*this.length + this.width * this.width))

      this.wheelsOnMaterial = []
      this.goingOutMap = false
      this.wheelsOutRoad = false

      
      this.sliding = false

      this.gearEnabled = 1
      this.timePenalty = 0


      this.loadModel(startPoint, startOrientation);

    }
  

    loadModel(startPoint, startOrientation) {
        const loader = new GLTFLoader();
        loader.load('./cars/alphatauri/scene.gltf', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.position.set(startPoint[0], startPoint[1], startPoint[2])
            this.mesh.rotation.set(startOrientation[0],startOrientation[1],startOrientation[2])
            this.mesh.scale.set(1, 1, 1);
            this.mesh.castShadow = true
             
            gltf.scene.traverse( function( node ) {
              if ( node.isMesh ) { node.castShadow = true; node.receiveShadow =true}

          } );

          this.game.scene.add(this.mesh);
          this.game.carMeshLoaded();
        }, undefined, (error) => {
            console.error(error);
        });       
    }


  reset(){
    this.engine.sound.stop()
  }

  updateRpm(){
    this.engine.updateRpm(Math.abs(this.velocityLocal.z), this.gearRatios[this.gear], this.diffRatios, this.wheelRadius)
  }


  accelerate(coeff1, coeff2){ 
    
    this.gearEnabled = this.gear+1
    if(coeff1 == 1) this.accelerating = true
    else this.accelerating = false

    let traction = this.engine.getTorque() * this.gearRatios[this.gear]*this.diffRatios;
    if(traction > 0) traction *= coeff1
    //console.log(traction)

    this.acceleration.copy(Physics.doPhysics(traction*coeff2, this)); // world coord

    
  }

  brake(coeff){
    this.gearEnabled = 'R'
    this.accelerating = true
    let traction = -this.engine.getTorque() * this.gearRatios[this.gearRatios.length-1]*this.diffRatios; //must be negative always
    this.acceleration.copy(Physics.doPhysics(traction*coeff, this));

  }

  checkSliding(){
    const beta = Math.atan(this.velocityLocal.x/this.velocityLocal.z)
   
    if (Math.abs(beta) > 0.1 && Math.abs(this.velocityLocal.z) > 1){
        this.sliding = true 
    }
    else{
        this.sliding = false
    }
}

  update(){
    this.checkSliding()
    this.updateRpm()
    this.speed.add(this.acceleration.clone().multiplyScalar(Physics.dT));

    this.velocityLocal.copy(this.speed.clone().applyQuaternion(this.mesh.quaternion.clone().invert())) // car coord

    if(Math.abs(this.velocityLocal.z)<=.5 && !this.accelerating) { 
      this.speed.set(0,0,0)
      this.velocityLocal.set(0,0,0)
      this.yawRate = 0
    }

    
    if(this.goingOutMap){
      this.mesh.position.add(this.speed.clone().multiplyScalar(Physics.dT).multiplyScalar(-10));
    }else{
            //console.log(this.speed.clone(), this.speed.clone().multiplyScalar(Physics.dT))
             this.mesh.position.add(this.speed.clone().multiplyScalar(Physics.dT));
    }
    
    //console.log('accel:', this.acceleration);
    //console.log('accel loc', this.acceleration.clone().applyQuaternion(this.mesh.quaternion.clone().invert()))
    //console.log('speed:', this.speed.clone().multiplyScalar(3.6));
    //console.log('speed loc:', this.velocityLocal.clone().multiplyScalar(3.6));
    //console.log('pos:', this.mesh.position);

    this.performRaycasting()
    
    if(this.wheelsOutRoad)
      this.timePenalty += Physics.dT


  }


  gearUp(){
    if(this.gear < (this.gearRatios.length-2))
        this.gear++;
  }

  gearDown(){
    if(this.gear>=1)
      this.gear--;
  }

  steer(intensity) {
      this.steeringAngle = intensity*THREE.MathUtils.degToRad(this.maxSteeringAngle)
      //this.updateSteering()
  }

  smoothSteer(intensity) {
    const steeringCoeff = 3
    var steer = 0
    if(intensity!=0 )
      {
        steer = THREE.MathUtils.clamp(this.steeringAngle + intensity * Physics.dT * steeringCoeff, -1.0, 1.0); // -inp.right, inp.left);
      }
      else
      {
        //  No steer input - move toward centre (0)
        if( this.steeringAngle > 0 )
        {
          steer = Math.max(this.steeringAngle - Physics.dT * steeringCoeff, 0);
        }
        else if( this.steer < 0 )
        {
          steer = Math.min(this.steeringAngle + Physics.dT * steeringCoeff, 0);
        }
      }
      this.steeringAngle = steer
  }

  addRay(raycaster, rayLength) {
    const arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, rayLength, 0xff0000);
    this.game.scene.add(arrow);
  }

  performRaycast(raycaster) {
    const road = this.game.scene.getObjectByName('RoadGroup').getObjectByName('road');
    const plane = this.game.scene.getObjectByName('plane');

    if (!road || !plane) return null;

    const intersects = raycaster.intersectObjects([road, plane], true); 

    if (intersects.length > 0) {
        return {
            normal: intersects[0].face.normal,
            intersectionPoint: intersects[0].point,
            intersectedObject: intersects[0].object.name
        };
    }
    return null; 
  }

  performRaycasting() {
    const offsetY = 10;
    const offsetZ = 1;
    const offsetX = 0.7;

    const direction = new THREE.Vector3(0, -1, 0);

    const raycasters = [
        { name: 'FrontRight', position: new THREE.Vector3(offsetX, offsetY, offsetZ) },
        { name: 'FrontLeft', position: new THREE.Vector3(-offsetX, offsetY, offsetZ) },
        { name: 'BackRight', position: new THREE.Vector3(offsetX, offsetY, -offsetZ) },
        { name: 'BackLeft', position: new THREE.Vector3(-offsetX, offsetY, -offsetZ) }
    ];

    const results = {};

    raycasters.forEach(r => {
        const raycaster = new THREE.Raycaster();
        const position = this.mesh.localToWorld(r.position.clone());
        raycaster.set(position, direction.clone());
        results[r.name] = this.performRaycast(raycaster);
    });

    const { FrontRight, FrontLeft, BackRight, BackLeft } = results;

    if (FrontRight && FrontLeft && BackRight && BackLeft) {
        this.goingOutMap = false;

        this.wheelsOnMaterial = [FrontRight.intersectedObject, FrontLeft.intersectedObject, BackRight.intersectedObject, BackLeft.intersectedObject];
        this.wheelsOutRoad = this.allWheelsOut(this.wheelsOnMaterial, 'plane'); // true if all wheels are out of road


        const averageHeight = (FrontRight.intersectionPoint.y + FrontLeft.intersectionPoint.y + BackRight.intersectionPoint.y + BackLeft.intersectionPoint.y) / 4;
        this.mesh.position.y = averageHeight; 

        /*
        const frontHeight = Math.min(FrontRight.intersectionPoint.y, FrontLeft.intersectionPoint.y);
        const backHeight = Math.min(BackRight.intersectionPoint.y, BackLeft.intersectionPoint.y);
        const rightHeight = Math.min(FrontRight.intersectionPoint.y, BackRight.intersectionPoint.y);
        const leftHeight = Math.min(FrontLeft.intersectionPoint.y, BackLeft.intersectionPoint.y);

        const pitch = Math.atan2(frontHeight - backHeight, offsetZ * 2);
        const roll = Math.atan2(leftHeight - rightHeight, offsetX * 2);*/
        
    } else {
      console.log('out of map')
        this.goingOutMap = true;
    }
  }


  allWheelsOut(array, element) {
    const count = array.reduce((count, item) => {
      return item === element ? count + 1 : count;
    }, 0);
    return count == 4 ;
  }



}
  






  export default Car;

