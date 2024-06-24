
import * as THREE from "three";
import Car from './Car.js';
import Controls from './Controls.js';
import Physics from './Physics.js';
import Engine from './Engine.js';
import Track from './Track.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xffffff, 1); // Imposta il colore di sfondo a bianco
        document.body.appendChild(this.renderer.domElement);
    
        this.addLights();
        this.addGrid();
        const rpmRange = [1000, 15000];
        const torqueCurves = [400, 600];
        const gearRatios = [3.1, 2.47, 2.02, 1.68, 1.43, 1.23, 1.1, 0.99, 2];
        const engine = new Engine(rpmRange, torqueCurves);

        const diffRatio = 4.9;
        this.car = new Car(this, 797, engine, gearRatios, diffRatio, 0.4, 0.01, 60);
        this.controls = new Controls(this.car);

        this.lastTime = 0;
        Physics.init();
        this.scene.add(new Track().getTrack());

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.animate();
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 100, 10);
        this.scene.add(directionalLight);
    }

    addGrid() {
        const gridHelper = new THREE.GridHelper(1000, 100, 0x0000ff, 0x808080); // dimensione, divisioni, colore centro, colore linee
        this.scene.add(gridHelper);
        const axesHelper = new THREE.AxesHelper(5000);
        this.scene.add(axesHelper);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate(currentTime) {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = (currentTime - this.lastTime) / 1000; // Converti da millisecondi a secondi
        Physics.setDeltaTime(deltaTime);
        this.lastTime = currentTime;

        if (this.car.mesh) {
            this.controls.update();

            const relativeCameraOffset = new THREE.Vector3(0, 4, -4);
            const cameraOffset = relativeCameraOffset.applyMatrix4(this.car.mesh.matrixWorld);

            this.camera.position.lerp(cameraOffset, 0.1);

            const lookAtPosition = new THREE.Vector3(0, 2, 0).add(this.car.mesh.position);
            this.camera.lookAt(lookAtPosition);
        }

        // Trova gli elementi HTML per la velocità e gli RPM
        const speedElement = document.getElementById('speed');
        const rpmElement = document.getElementById('rpm');
        const gearElement = document.getElementById('gear');

        // Aggiorna la velocità, gli RPM e la marcia nella pagina
        if (speedElement && rpmElement && gearElement) {
            speedElement.textContent = `${Math.round(this.car.velocityLocal.z * 3.6)} km/h`; // Converti m/s a km/h
            const rpmValue = Math.round(this.car.engine.getCurrentRpm());
            rpmElement.textContent = `${rpmValue}`; // Valore approssimativo per RPM
            gearElement.textContent = `${this.car.gear + 1}`;
            window.setRpmValue((rpmValue / 15000) * 100); // Converti RPM in percentuale e aggiorna lo slider
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();

  