
import {Vector3, MathUtils} from "three";
import Car from "./Car";
class Physics {
    static init() {
        // Imposta le proprietà statiche iniziali della classe
        Physics.dragCoeff = 1;
        Physics.rollCoeff = 10;
        Physics.dT = 0;
        Physics.gravity = 9.8;
    }

    static setDeltaTime(dt) {
        Physics.dT = dt;
    }

    static getFdrag(v) {
        return Physics.dragCoeff * v * v;
    }

    static getFroll(car) {
        if(car.speed.z == 0) return 0;
        const Wf =  Physics.getWheelWeight(-1, car); // weight front wheel
        const Wr =  Physics.getWheelWeight(1, car);
        //console.log('front wheel mass: ', Wf, ' back wheel mass :', Wr);
        return Physics.rollCoeff * 2 * (Wf + Wr) ; // total friction of all wheels
    }

    static getAcceleration(enginePower, car) {
        
        let Froll = Physics.getFroll(car);
        let Fdrag = Physics.getFdrag(car.speed.z); 

        
        const gripF =  Physics.getWheelWeight(-1, car)*car.grip;
        const gripR =  Physics.getWheelWeight(1, car)*car.grip;

        // Resulting velocity of the wheels as result of the yaw rate of the car body.
        // v = yawrate * r where r is distance from axle to CG and yawRate (angular velocity) in rad/s.
        var yawSpeedFront = car.length/2 * this.yawRate;
        var yawSpeedRear = -car.length/2 * this.yawRate;

        // Calculate slip angles for front and rear wheels (a.k.a. alpha)
        var slipAngleFront = Math.atan2(car.speed.x + yawSpeedFront, Math.abs(car.speed.z)) - GMath.sign(car.speed.z) * car.steeringAngle;
        var slipAngleRear  = Math.atan2(car.speed.x + yawSpeedRear,  Math.abs(car.speed.z));

        var frictionForceFront_cx = GMath.clamp(-5 * slipAngleFront, -gripF, gripF) * Physics.getWheelWeight(-1, car);
        var frictionForceRear_cx = GMath.clamp(-5 * slipAngleRear, -gripR, gripR) * Physics.getWheelWeight(1, car);

        var dragForce_cz = -Physics.rollCoeff * 2 * car.speed.z - Physics.dragCoeff * car.speed.z * Math.abs(car.speed.z);
        var dragForce_cx = -Physics.rollCoeff * 2 * car.speed.x - Physics.dragCoeff * car.speed.x * Math.abs(car.speed.x);
    
    

    


        const totalForceZ = enginePower - Froll - Fdrag - car.mass*Math.sin(car.mesh.rotation.x)*Physics.gravity;
        const accZ = totalForceZ / car.mass / car.wheelRadius;


        return new Vector3(0, 0, accZ).multiplyScalar(Physics.dT);  // quando accelero con una coppia bassa torna una accelerazione negativa
    }


    static doPhysics(enginePower, car){

    var velocity_cz = car.velocityLocal.z
    var velocity_cx = car.velocityLocal.x

    const Wf =  Physics.getWheelWeight(-1, car); // weight front wheel
    const Wr =  Physics.getWheelWeight(1, car);
    // Resulting velocity of the wheels as result of the yaw rate of the car body.
    // v = yawrate * r where r is distance from axle to CG and yawRate (angular velocity) in rad/s.
    var yawSpeedFront = car.length/2 * car.yawRate;
    var yawSpeedRear = - car.length/2 * car.yawRate;

    // Calculate slip angles for front and rear wheels (a.k.a. alpha)
    var slipAngleFront = Math.atan2(velocity_cx + yawSpeedFront, Math.abs(velocity_cz)) - Math.sign(velocity_cz) * car.steeringAngle;
    var slipAngleRear  = Math.atan2(velocity_cx + yawSpeedRear,  Math.abs(velocity_cz));

    var frictionForceFront_cx = MathUtils.clamp(-car.corneringStiffness * slipAngleFront, -car.grip, car.grip) * Wf;
    var frictionForceRear_cx = MathUtils.clamp(-car.corneringStiffness * slipAngleRear, -car.grip, car.grip) * Wr;
    

    var dragForce_cz = -Physics.rollCoeff * 2 * velocity_cz - Physics.dragCoeff * velocity_cz * Math.abs(velocity_cz);
    var dragForce_cx = -Physics.rollCoeff  * 2 * velocity_cx - Physics.dragCoeff * velocity_cx * Math.abs(velocity_cx);


    // total force in car coordinates
	var totalForce_cz = dragForce_cz + enginePower;
	var totalForce_cx = dragForce_cx  + Math.cos(car.steeringAngle) * frictionForceFront_cx + frictionForceRear_cx;

    const Fcent = car.mass*velocity_cz*velocity_cz/(car.length/Math.sin(car.steeringAngle))
    
    /*
    if ((Math.abs(Fcent) > Math.abs(totalForce_cx))){
    const pos = car.mesh.position.clone();
     car.skid.addSkidMark(pos.clone().add(new Vector3(0.5, 0, 0.5)),  new Vector3(0, 0, -1).applyQuaternion(car.mesh.quaternion.clone()));
     car.skid.addSkidMark(pos.clone().add(new Vector3(-0.5, 0, 0.5)),  new Vector3(0, 0, -1).applyQuaternion(car.mesh.quaternion.clone()));
     car.skid.addSkidMark(pos.clone().add(new Vector3(0.5, 0, -0.5)),  new Vector3(0, 0, -1).applyQuaternion(car.mesh.quaternion.clone()));
     car.skid.addSkidMark(pos.clone().add(new Vector3(-0.5, 0, -0.5)),  new Vector3(0, 0, -1).applyQuaternion(car.mesh.quaternion.clone()));
    }
    
*/
	// acceleration along car axes
	var accel_cz = totalForce_cz / car.mass;  // forward/reverse accel
	var accel_cx = totalForce_cx / car.mass;  // sideways accel

    /*accel_cz = cs * accel_cz - sn * accel_cx;
	accel_cx = sn * accel_cz + cs * accel_cx;*/
    var accel = new Vector3(accel_cx, 0, accel_cz).applyQuaternion(car.mesh.quaternion.clone())
    //console.log('accel', accel)


	// calculate rotational forces
	var angularTorque = frictionForceFront_cx  * car.length/2 - frictionForceRear_cx * car.length/2;

    
    if( Math.abs(car.speed.length()) < 1 && !car.accelerating )
    {
      car.speed.x = car.speed.z  = 0;
      angularTorque = car.yawRate = 0;
    }

	var angularAccel = angularTorque / car.mass;

	car.yawRate += angularAccel * Physics.dT;
	car.mesh.rotation.y += car.yawRate * Physics.dT;

    return accel.multiplyScalar(Physics.dT); 

    }


    static getCentrifugalForce(car){
        
        let turning_radius = car.length / Math.sin(car.steeringAngle)
        const Fc = (car.mass * car.speed.z*car.speed.z) / turning_radius
        return Fc;
    }

    static getWheelWeight(coeff, car){
        
        const car_length = car.length;
        const com_heigth = car.com_height;
        const previousAcc = car.acceleration.clone().applyQuaternion(car.mesh.quaternion.clone().conjugate()).z // local acceleration
        return 0.5*car.mass*9.8 + coeff * (com_heigth/car_length)*car.mass*previousAcc;
    }


}


export default Physics;