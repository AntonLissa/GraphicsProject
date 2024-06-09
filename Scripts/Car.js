

/*
ALPHA TAURI
- 797 Kg
-15000 RPM
- 161 000 BHP
*/
import * as THREE from "three"
import Physics from './Physics.js';

class Car {
    constructor(game, mass, engine, gearRatios, diffRatios, wheelRadius, maxSteeringAngle) {
        this.game = game;
        this.mass = mass;
        this.mesh = null;
        this.engine = engine;
        this.speed = new Vector3(0, 0, 0);
        this.acceleration = new Vector3(0, 0, 0);
        this.gear = 0;
        this.brakeForce = 5000;
        this.gearRatios = gearRatios;
        this.diffRatios = diffRatios;
        this.wheelRadius = wheelRadius;
        this.maxSteeringAngle = maxSteeringAngle; // Massimo angolo di sterzata
        this.steeringCoefficient = 0; // Coefficiente di sterzata [-1, 1]
        this.loadModel();
    }

    loadModel() {
        const loader = new THREE.GLTFLoader();
        loader.load('scene.gltf', (gltf) => {
            this.mesh = gltf.scene;
            this.mesh.position.set(0, 10, 0);
            this.mesh.scale.set(1, 1, 1);
            this.game.scene.add(this.mesh);
        }, undefined, (error) => {
            console.error(error);
        });
    }

    calculateTurnRadius() {
        if (this.steeringCoefficient === 0) {
            return null; // Nessuna curva
        }
        // Calcolo del raggio di sterzata basato sul coefficiente di sterzata
        const steeringAngle = this.steeringCoefficient * this.maxSteeringAngle;
        const turnRadius = this.mesh.scale.x / Math.tan(MathUtils.degToRad(steeringAngle));
        return turnRadius;
    }

    setSteeringCoefficient(coefficient) {
        this.steeringCoefficient = MathUtils.clamp(coefficient, -1, 1);
    }

    accelerate(coeff1, coeff2) {
        const motorPower = coeff2 * this.engine.getTorque(this.speed.length(), this.gearRatios[this.gear], this.diffRatios, this.wheelRadius) * this.gearRatios[this.gear] * this.diffRatios;
        
        const turnRadius = this.calculateTurnRadius();
        const accelerationData = Physics.getAcceleration(
            motorPower,
            this.speed,
            this.mass,
            this.acceleration,
            this.wheelRadius,
            turnRadius,
            this.mesh.position,
            this.mesh.quaternion
        );
        
        this.acceleration.copy(accelerationData.acceleration);
        this.speed.addScaledVector(this.acceleration, coeff1);

        if (this.speed.length() < 0.05) {
            this.speed.set(0, 0, 0);
        }

        console.log('power:', motorPower);
        console.log('accel:', this.acceleration);
        console.log('speed:', this.speed);

        this.move();
    }

    brake() {
        const turnRadius = this.calculateTurnRadius();
        const accelerationData = Physics.getAcceleration(
            -this.brakeForce,
            this.speed,
            this.mass,
            this.acceleration,
            this.wheelRadius,
            turnRadius,
            this.mesh.position,
            this.mesh.quaternion
        );

        this.acceleration.copy(accelerationData.acceleration);
        this.speed.add(this.acceleration);

        this.engine.updateRpm(this.speed.length(), this.gearRatios[this.gear], this.diffRatios, this.wheelRadius);

        if (this.speed.length() < 1) {
            this.speed.set(0, 0, 0);
        }

        this.move();
    }

    gearUp() {
        if (this.gear < (this.gearRatios.length - 2)) {
            this.gear++;
        }
    }

    gearDown() {
        if (this.gear >= 1) {
            this.gear--;
        }
    }

    retro() {
        console.log('_____________________retro');
        if (this.speed.length() < 1 && this.gear === 0) {
            this.gear = this.gearRatios.length - 1;
        }
    }

    move() {
        const deltaPos = this.speed.clone().multiplyScalar(Physics.dT);
        this.mesh.position.add(deltaPos);
    }
}

export default Car;

