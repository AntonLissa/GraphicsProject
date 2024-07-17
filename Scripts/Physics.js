
import {Vector3, MathUtils, Quaternion} from "three";
class Physics {
    static init() {
        Physics.dragCoeff = .2;
        Physics.rollCoeffRoad = .1;
        Physics.dT = 0;
        Physics.gravity = 9.8;
    }

    static setDeltaTime(dt) {
        Physics.dT = dt;
    }

    static getFdrag(v) {
        return -Math.sign(v) * Physics.dragCoeff * v * Math.abs(v);
    }


    static getFroll(speed, Wf, Wr) {
        if(speed== 0) return 0;
        const f1 = Physics.rollCoeffRoad*Wf
        const f2 = Physics.rollCoeffRoad*Wr
        return -Math.sign(speed) * (f1+f2) // opposes to speed
    }




    static getLowSpeedAcceleration(enginePower, car) {
        //console.log('low speed turning')
        const Wf =  Physics.getWheelWeight(-1, car); // weight front wheel
        const Wr =  Physics.getWheelWeight(1, car);
        let Froll = Physics.getFroll(car.velocityLocal.z, Wf, Wr);
        let Fdrag = Physics.getFdrag(car.velocityLocal.z); 

        const totalForceZ = enginePower + Froll + Fdrag ;
        const accZ = totalForceZ / car.mass;
       
        var angular_velocity = 0
        var AccX = 0;
        if(car.steeringAngle != 0){
            const turning_radius = car.length / Math.sin(car.steeringAngle)
            angular_velocity = car.velocityLocal.z / turning_radius
            //car.mesh.rotation.y += angular_velocity * Physics.dT;
            AccX += angular_velocity*angular_velocity*turning_radius
            car.mesh.applyQuaternion(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angular_velocity * Physics.dT));
        }

        var acc =  new Vector3(AccX, 0, accZ)
        // world coords 
        return acc.applyQuaternion(car.mesh.quaternion);  

    }


    
    static doPhysics(enginePower, car){

        var velocity_cz = car.velocityLocal.z
        var velocity_cx = car.velocityLocal.x

        // low speed turning
        if(Math.abs(velocity_cz)*3.6 < 100 && !car.sliding){
            //console.log('debug')
            return Physics.getLowSpeedAcceleration(enginePower, car)
        }

    

        const Wf =  Physics.getWheelWeight(-1, car); // weight front wheel
        const Wr =  Physics.getWheelWeight(1, car);
        
        //assuming COM balanced between rear and front
        var yawSpeedFront = car.length/2 * car.yawRate;
        var yawSpeedRear = - yawSpeedFront;

        // Calculate slip angles for front and rear wheels (a.k.a. alpha)
        var slipAngleFront = Math.atan2(velocity_cx + yawSpeedFront, Math.abs(velocity_cz)) - Math.sign(velocity_cz)  * car.steeringAngle;
        var slipAngleRear  = Math.atan2(velocity_cx + yawSpeedRear,  Math.abs(velocity_cz));

        var frictionForceFront_cx = MathUtils.clamp(-car.corneringStiffness * slipAngleFront, -car.grip, car.grip) * Wf;
        var frictionForceRear_cx = MathUtils.clamp(-car.corneringStiffness * slipAngleRear, -car.grip, car.grip) * Wr;
    
        var dragForce_cz = Physics.getFroll(car.velocityLocal.z, Wf, Wr) + Physics.getFdrag(velocity_cz);
        var dragForce_cx = Physics.getFroll(car.velocityLocal.x, Wf, Wr) + Physics.getFdrag(velocity_cx);

        //console.log('debig', enginePower, dragForce_cz)
        var extraDrag = 0
        if(car.wheelsOutRoad){
            enginePower = 0 //slow down if out of track
            extraDrag = -car.velocityLocal.z*300
        }    
        
        var totalForce_cz = enginePower + dragForce_cz + extraDrag ;
        var totalForce_cx = dragForce_cx * Math.sign(velocity_cx) + Math.cos(car.steeringAngle) * frictionForceFront_cx + frictionForceRear_cx;
        //console.log('debug',frictionForceFront_cx, frictionForceRear_cx)
        // acceleration along car axes
        var accel_cz = totalForce_cz / car.mass;  // forward/reverse accel
        var accel_cx = totalForce_cx / car.mass;  // sideways accel

        
        var accel = new Vector3(accel_cx, 0, accel_cz)

        // calculate rotational forces
        var angularTorque = (frictionForceFront_cx - frictionForceRear_cx) * car.length/2;
       
        var angularAccel = angularTorque /  car.inertia;

        car.yawRate += angularAccel * Physics.dT;
        
        if(Math.abs(car.yawRate) < 0.2) car.yawRate = 0

        car.mesh.applyQuaternion(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), car.yawRate * Physics.dT));
        
        accel.applyQuaternion(car.mesh.quaternion.clone())
        //console.log('az', accel)
        return accel; 

    }


    // the weight on the wheels depend on the acceleration
    static getWheelWeight(coeff, car){
        const car_length = car.length;
        const com_heigth = car.com_height;
        const previousAcc = car.acceleration.clone().applyQuaternion(car.mesh.quaternion.clone().invert()).z // car coords acceleration
        return 0.5 * car.mass * 9.8 + coeff * (com_heigth/car_length)*car.mass*previousAcc;
    }

    


}


export default Physics;