
import * as THREE from "three";
import Car from './Car.js';
import Controls from './Controls.js';
import Physics from './Physics.js';
import Engine from './Engine.js';
import Stats from 'stats.js'
import Utils from "./Utils.js";
import { lerp } from "three/src/math/MathUtils.js";

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            gammaInput: true,
            gammaOutput: true,
            physicallyCorrectLights: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

        

        document.body.appendChild(this.renderer.domElement);

        this.stats = new Stats()
        this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(this.stats.dom)


        this.numberOfCheckpoints = 3
        this.maxLaps = 1;
        this.lapCounter = 1;
        
        this.elapsedTime = 0 // timer
        this.countdownDuration = 3000; 
        
        this.framesBeforeCheckingCheckpoints = 15 // number of frames to wait before checking checkpoints
        this.waitedFrames = 0; // number of frames we waited till now

        this.initializeGUI()

        const params = this.getQueryParams();
        const circuitName = params.circuit || 'Sconosciuto';

        this.initializeGame(this.numberOfCheckpoints, circuitName)

      
        this.controls = null;

        this.gameover = false

        this.gameStart = false
        this.startTime = null

        this.thirdPersonCamera = true
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
        //this.animate()
       
    }

    getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const paramPairs = queryString.split('&');
        paramPairs.forEach(paramPair => {
            const [key, value] = paramPair.split('=');
            params[key] = decodeURIComponent(value);
        });
        return params;
    }

    initializeGUI(){
        this.speedElement = document.getElementById('speed');
        this.rpmElement = document.getElementById('rpm');
        this.gearElement = document.getElementById('gear');
        this.timeCounterElement = document.getElementById('timeCounter');
        this.lapCounterElement = document.getElementById('lapCounter');
        this.timeTextElement = document.getElementById('timeText');
        this.penaltyTimeTextElement = document.getElementById('penaltyTimeText');
        this.finalTimeTextElement = document.getElementById('finalTimeText');
        this.gameoverElement = document.getElementById('gameover');

    }

    async initializeGame(checkPoints, name) {
        try {
            
            console.log('initializing', name)
            if(name === 'Sconosciuto' || !name){ name = 'shanghai'}
            const data = await Utils.loadTrack(name, checkPoints);
            this.track = data.track;
            this.scene.add(this.track.getTrack());
    
            // Get checkpoints from the track
            const checks = this.track.checkpoints;
    
            /*
            for(const c of checks) {
                this.addSphere(c, this.track.checkpointRadius);
            }*/
            
    
            // Initialize lights and skybox
            this.addLights();
            this.addSkybox();
            
            this.lastTime = 0;
            Physics.init();
    
            // Set up engine and car parameters
            const rpmRange = [1000, 15000];
            const torqueCurves = [400, 800];
            const gearRatios = [2.7, 2.1, 1.7, 1.5, 1.3, 1.1, 0.9, 0.8, 4];
            const engine = new Engine(rpmRange, torqueCurves);
            const diffRatio = 4.5;


            this.car = new Car(this, 797, engine, gearRatios, diffRatio, 0.4, data.start, data.orientation);
        } catch (error) {
            console.error('Failed to initialize the game:', error);
        }
    }
    
    

    carMeshLoaded() {
        this.renderer.render(this.scene, this.camera);
        this.updateCamera(); 
        this.animate();
        this.startCountdown().then(() => {
            console.log('start time');
            this.startTime = Date.now();
            this.animate();
        }).catch(error => {
            console.error('Error starting countdown:', error);
        });
    }

    startCountdown() {
        return new Promise((resolve, reject) => { 
            const countdownElement = document.getElementById('countdown');
            const countdownTime = document.getElementById('countdown-text');
            const startTimeInterval = Date.now();
    
            const countdownInterval = setInterval(() => {
                const elapsedTime = Date.now() - startTimeInterval;
                const remainingTime = Math.max(this.countdownDuration - elapsedTime, 0);
    
                if (remainingTime > 0) {
                    const formattedTime = this.formatTime(remainingTime);
                    countdownTime.innerText = `${formattedTime.seconds}:${formattedTime.milliseconds}`;
                } else {
                    clearInterval(countdownInterval);
                    countdownElement.style.visibility = 'hidden'; 
                    this.controls = new Controls(this.car);
                    resolve();
                }
            }, 10); 
        });
    }
    

    formatTime(time){
        return {
            minutes: parseInt((time % 3600000) / 60000), 
            seconds: parseInt((time % 60000) / 1000), 
            milliseconds: parseInt((time % 1000))
        }
    }


    // for visualizing checkpoints
    addSphere(position, radius = 1, color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        this.scene.add(sphere);
    }



    addLights() {
        // track bounding box is useful for creating the plane
        const box = this.track.getBbox()
        const boxGeometry = new THREE.BoxGeometry();
        const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        boxMesh.geometry.boundingBox = box;
        
        const bboxHelper = new THREE.Box3Helper(box, 0xff0000); 
        //this.scene.add(bboxHelper)
        
        let size = new THREE.Vector3();
        size = box.getSize(size)
        let center = new THREE.Vector3();
        center = box.getCenter(center);


        const ambientLight = new THREE.AmbientLight( 0xffffff, .5);
        this.scene.add(ambientLight);
      
        const directionalLight = new THREE.DirectionalLight(0xFBE06B, 2);
        directionalLight.position.set(center.x+size.x/2, 100, center.z);
        directionalLight.target.position.set(center.x, 0, center.z)
        directionalLight.target.updateMatrixWorld()

        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 5000; // Aumentiamo la risoluzione della mappa delle ombre
        directionalLight.shadow.mapSize.height = 5000;

        directionalLight.shadow.camera.near = 40;
        directionalLight.shadow.camera.far = 2000;
        directionalLight.shadow.camera.left = -(size.x*1.1)/2
        directionalLight.shadow.camera.right = (size.x*1.1)/2
        directionalLight.shadow.camera.top = -200
        directionalLight.shadow.camera.bottom = 200
        this.scene.add(directionalLight);
       
        const skyLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20,  .5);
        this.scene.add(skyLight);


        const textureUrls = {
            albedo: '/textures/grass/color.jpg',
            roughness: '/textures/grass/roughness.jpg',
            normal: '/textures/grass/normalgl.jpg',
            ao: '/textures/grass/ambient_occlusion.jpg',
            displacement: '/textures/grass/displacement.jpg'
        };
    
        const material = Utils.initializePBRTexture(textureUrls, 300, 300);
        

        const planeGeometry = new THREE.PlaneGeometry(size.x*1.1, size.z*1.1);
        const plane = new THREE.Mesh(planeGeometry, material);
        plane.position.set(center.x, -0.5, center.z)
        plane.rotateX(-Math.PI / 2);
        plane.receiveShadow = true;
        plane.name = 'plane'
        this.scene.add(plane);

        const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
        //this.scene.add(shadowHelper);   
      }



    addSkybox() {
        const loader = new THREE.CubeTextureLoader();
        const src = 'textures/mountain-skyboxes/Teide/'
        console.log(src + 'negx.jpg',)
        const texture = loader.load([
            src + 'posx.jpg',  // Destra
            src + 'negx.jpg',  // Sinistra
            src + 'posy.jpg',  // Su
            src + 'negy.jpg',  // Giù
            src + 'posz.jpg',  // Davanti
            src + 'negz.jpg'   // Dietro
        ]);

        this.scene.background = texture; // Imposta la texture come sfondo della scena

        
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }



    updateConsoleElements(){
        this.speedElement.textContent = `${Math.round(this.car.velocityLocal.z * 3.6)} km/h`; 
        const rpmValue = Math.round(this.car.engine.getCurrentRpm())
        this.rpmElement.textContent = `${rpmValue}`; 
        this.gearElement.textContent = `${this.car.gearEnabled}`;
        window.setRpmValue((rpmValue / this.car.engine.maxRpm) * 100); 
        this.lapCounterElement.textContent = `${this.lapCounter}/${this.maxLaps}`;
    }



    updateTimeCounter(elapsedTime) {
        const formattedTime = this.formatTime(elapsedTime)
        const formattedTimePenalty = this.formatTime(this.car.timePenalty*1000)
        this.timeCounterElement.textContent = `${formattedTime.minutes}:${formattedTime.seconds}:${formattedTime.milliseconds} - ${formattedTimePenalty.minutes}:${formattedTimePenalty.seconds}:${formattedTimePenalty.milliseconds} `;
    }

    updateCamera(){
        if(this.thirdPersonCamera){
           var cameraOffset =  new THREE.Vector3(0, 1.5, -4).applyMatrix4(this.car.mesh.matrixWorld);
           var lookAtPosition = new THREE.Vector3(0, 2, 0).add(this.car.mesh.position);
           this.camera.position.copy(cameraOffset);
        }
        else{
            var cameraOffset =  new THREE.Vector3(0, 0.8, 0.1).applyMatrix4(this.car.mesh.matrixWorld);
            var lookAtPosition = new THREE.Vector3(0, 1, 10).applyMatrix4(this.car.mesh.matrixWorld);
            this.camera.position.copy(cameraOffset);
         }

        this.camera.lookAt(lookAtPosition);
    }

    animate(currentTime) {
        this.stats.begin();
        requestAnimationFrame(this.animate.bind(this));
            
        if(currentTime && this.controls && !this.gameover && currentTime!=this.lastTime){
            Physics.setDeltaTime((currentTime - this.lastTime) / 1000);
            this.lastTime = currentTime;
            
            if(this.controls.keysReleased['c'] && this.thirdPersonCamera) this.thirdPersonCamera = false
            else if(this.controls.keysReleased['c'] && !this.thirdPersonCamera) this.thirdPersonCamera = true
            
            
            this.car.update()
            this.updateCamera()

            this.controls.update();

            const elapsedTime = Date.now() - this.startTime
            
            this.updateTimeCounter(elapsedTime) // update elapsed time in the GUI


            this.updateConsoleElements()

            if(this.waitedFrames >= this.framesBeforeCheckingCheckpoints){
                this.track.checkCheckpoints(this.car.mesh.position)
                this.waitedFrames = 0
                
                if(this.track.checkPointToReach == this.numberOfCheckpoints+1){
                    this.lapCounter++;
                    console.log('lap ', this.lapCounter)
                    this.track.checkPointToReach = 0

                    if (this.lapCounter > this.maxLaps) {
                        this.gameover = true;
                        this.car.reset()

                        console.log('Well done, your time is:', elapsedTime)
                        const formattedTime = this.formatTime(elapsedTime)
                        const penaltyFormattedTime = this.formatTime(this.car.timePenalty*1000)
                        const finalFormattedTime = this.formatTime(elapsedTime + this.car.timePenalty*1000)
                        this.timeTextElement.textContent = ` ${formattedTime.minutes} : ${formattedTime.seconds} : ${formattedTime.milliseconds} +`;
                        this.penaltyTimeTextElement.textContent = ` ${penaltyFormattedTime.minutes} : ${penaltyFormattedTime.seconds} : ${penaltyFormattedTime.milliseconds} = `;
                        this.finalTimeTextElement.textContent = ` ${finalFormattedTime.minutes} : ${finalFormattedTime.seconds} : ${finalFormattedTime.milliseconds} `;
                        
                        this.gameoverElement.style.visibility = 'visible'
                    }
                }

            }

            
            this.waitedFrames++;

            

        }


        this.renderer.render(this.scene, this.camera);

        this.stats.end();
    }


}

const game = new Game();

  