import * as THREE from 'three';

class Physics {
    static init() {
        Physics.dragCoeff = 0.4;
        Physics.rollCoeff = 0.05;
        Physics.dT = 0;
        Physics.gravity = 9.8;  // Accelerazione di gravità
        Physics.tireGrip = 1.0;  // Coefficiente di attrito delle gomme
    }

    static setDeltaTime(dt) {
        Physics.dT = dt;
    }

    static getFdrag(v) {
        return Physics.dragCoeff * v.lengthSq();
    }

    static getFroll(mass, previousAcc) {
        const car_length = 5;
        const com_height = 0.5;
        const Wf = 0.5 * mass * Physics.gravity - (com_height / car_length) * mass * previousAcc.length();
        const Wr = 0.5 * mass * Physics.gravity + (com_height / car_length) * mass * previousAcc.length();
        return Physics.rollCoeff * 2 * (Wf + Wr);
    }

    static getCentrifugalForce(mass, velocity, radius) {
        return (mass * velocity.lengthSq()) / radius;
    }

    static getMaxLateralForce(mass) {
        return Physics.tireGrip * mass * Physics.gravity;
    }

    static getSlipAngle(mass, velocity, turnRadius) {
        const centrifugalForce = Physics.getCentrifugalForce(mass, velocity, turnRadius);
        const maxLateralForce = Physics.getMaxLateralForce(mass);
        
        if (centrifugalForce > maxLateralForce) {
            return Math.atan(centrifugalForce / maxLateralForce);
        } else {
            return 0;
        }
    }

    static getAcceleration(enginePower, velocity, mass, prevAcc, wheelRad, turnRadius = null, position, orientation) {
        let Froll = Physics.getFroll(mass, prevAcc);
        let Fdrag = Physics.getFdrag(velocity);

        // Calculate accelerations in local car coordinates
        let accX = (enginePower - Froll - Fdrag) / mass * Physics.dT;
        let accY = 0;
        let accZ = -Physics.gravity * Physics.dT;

        // Adjust for ground contact
        if (position.y <= 0) {
            accZ = 0;
        }

        let slipAngleFL = 0, slipAngleFR = 0, slipAngleRL = 0, slipAngleRR = 0;
        let averageSlipAngle = 0;

        if (turnRadius) {
            const centrifugalForce = Physics.getCentrifugalForce(mass, velocity, turnRadius);
            const maxLateralForce = Physics.getMaxLateralForce(mass);
            if (centrifugalForce > maxLateralForce) {
                accY = (centrifugalForce - maxLateralForce) / mass * Physics.dT;

                // Calcola gli angoli di slittamento per le quattro ruote
                slipAngleFL = Physics.getSlipAngle(mass, velocity, turnRadius);
                slipAngleFR = Physics.getSlipAngle(mass, velocity, turnRadius);
                slipAngleRL = Physics.getSlipAngle(mass, velocity, turnRadius);
                slipAngleRR = Physics.getSlipAngle(mass, velocity, turnRadius);

                // Calcola l'angolo medio di slittamento
                averageSlipAngle = (slipAngleFL + slipAngleFR + slipAngleRL + slipAngleRR) / 4;
            }
        }

        // Adjust acceleration for the orientation of the car
        const accVector = new THREE.Vector3(accX, accY, accZ);
        accVector.applyQuaternion(orientation);

        // Return acceleration vector and slip angles
        return {
            acceleration: accVector,
            orientation: averageSlipAngle,
            slipAngles: {
                frontLeft: slipAngleFL,
                frontRight: slipAngleFR,
                rearLeft: slipAngleRL,
                rearRight: slipAngleRR,
            }
        };
    }

    static getResultantAcceleration(acceleration) {
        return acceleration.length();
    }

    static updateWheelRotation(wheel, velocity, slipAngle) {
        wheel.rotation += velocity.length() * Physics.dT;
        wheel.slipAngle = slipAngle;
    }

    static applySkidMarks(wheel, slipAngle) {
        const threshold = 0.1;  // Define a threshold for skid marks
        if (Math.abs(slipAngle) > threshold) {
            console.log('Skid marks applied!');
        }
    }

    static simulateFreeFall(car, dt) {
        car.velocity.y += Physics.gravity * dt;
        car.position.y += car.velocity.y * dt;
    }

    static simulateCurve(car, turnRadius) {
        const slipAngleFL = Physics.getSlipAngle(car.mass, car.velocity, turnRadius);
        const slipAngleFR = Physics.getSlipAngle(car.mass, car.velocity, turnRadius);
        const slipAngleRL = Physics.getSlipAngle(car.mass, car.velocity, turnRadius);
        const slipAngleRR = Physics.getSlipAngle(car.mass, car.velocity, turnRadius);

        Physics.updateWheelRotation(car.frontLeftWheel, car.velocity, slipAngleFL);
        Physics.updateWheelRotation(car.frontRightWheel, car.velocity, slipAngleFR);
        Physics.updateWheelRotation(car.rearLeftWheel, car.velocity, slipAngleRL);
        Physics.updateWheelRotation(car.rearRightWheel, car.velocity, slipAngleRR);

        Physics.applySkidMarks(car.frontLeftWheel, slipAngleFL);
        Physics.applySkidMarks(car.frontRightWheel, slipAngleFR);
        Physics.applySkidMarks(car.rearLeftWheel, slipAngleRL);
        Physics.applySkidMarks(car.rearRightWheel, slipAngleRR);
    }
}

export default Physics;

