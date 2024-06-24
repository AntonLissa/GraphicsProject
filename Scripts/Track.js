
import * as THREE from "three";

class Track {
    constructor() {
      this.points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 100),
        new THREE.Vector3(50, 0, 150),
        new THREE.Vector3(100, 0, 100),
        new THREE.Vector3(150, 0, 80),
        new THREE.Vector3(160, 0, 150),
        new THREE.Vector3(200, 0, 200),
        new THREE.Vector3(250, 0, 180),
        new THREE.Vector3(400, 0, 300),
        new THREE.Vector3(400, 0, -100),
        new THREE.Vector3(200, 0, -150),
        new THREE.Vector3(100, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 100)
      ];
      this.trackWidth = 25;
      this.wallHeight = 5;
      this.wallThickness = 0.5;
      this.textureUrl = 'textures/asphalt.jpg';
      this.trackGroup = new THREE.Group();
      this.createTrack();
    }
  
    
    createTrack() {
        // Load the asphalt texture
        const textureLoader = new THREE.TextureLoader();
        const asphaltTexture = textureLoader.load(this.textureUrl);
        asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
        asphaltTexture.repeat.set(1, 1);
    
        // Create spline from points
        const spline = new THREE.CatmullRomCurve3(this.points);
        const splinePoints = spline.getPoints(1000);
    
        // Create track geometry
        const trackShape = new THREE.Shape();
        const halfWidth = this.trackWidth / 2;
    
        for (let i = 0; i < splinePoints.length; i++) {
          const point = splinePoints[i];
          const tangent = spline.getTangent(i / (splinePoints.length - 1)).normalize();
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
          
          if (i === 0) {
            trackShape.moveTo(point.x + normal.x * halfWidth, point.z + normal.z * halfWidth);
          }
    
          trackShape.lineTo(point.x + normal.x * halfWidth, point.z + normal.z * halfWidth);
        }
    
        for (let i = splinePoints.length - 1; i >= 0; i--) {
          const point = splinePoints[i];
          const tangent = spline.getTangent(i / (splinePoints.length - 1)).normalize();
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    
          trackShape.lineTo(point.x - normal.x * halfWidth, point.z - normal.z * halfWidth);
        }
    
        // Extrude the shape to create the track surface
        const extrudeSettings = {
          steps: 1,
          depth: 0.1,
          bevelEnabled: false
        };
    
        const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
        const trackMaterial = new THREE.MeshPhongMaterial({ map: asphaltTexture });
        const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        trackMesh.rotation.x = -Math.PI / 2;
        this.trackGroup.add(trackMesh);
      }
    
      addWalls() {
        // Create spline from points
        const spline = new THREE.CatmullRomCurve3(this.points);
        const splinePoints = spline.getPoints(100);
    
        // Create walls
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
        for (let i = 0; i < splinePoints.length - 1; i++) {
          const point1 = splinePoints[i];
          const point2 = splinePoints[i + 1];
          const tangent = spline.getTangent(i / (splinePoints.length - 1)).normalize();
          const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    
          const left1 = point1.clone().add(normal.clone().multiplyScalar(this.trackWidth / 2));
          const left2 = point2.clone().add(normal.clone().multiplyScalar(this.trackWidth / 2));
          const right1 = point1.clone().add(normal.clone().multiplyScalar(-this.trackWidth / 2));
          const right2 = point2.clone().add(normal.clone().multiplyScalar(-this.trackWidth / 2));
    
          const leftWallGeometry = new THREE.BoxGeometry(this.wallThickness, this.wallHeight, left1.distanceTo(left2));
          const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
          leftWall.position.copy(left1.clone().add(left2).divideScalar(2));
          leftWall.lookAt(left2);
          leftWall.rotateY(Math.PI / 2);
          this.trackGroup.add(leftWall);
    
          const rightWallGeometry = new THREE.BoxGeometry(this.wallThickness, this.wallHeight, right1.distanceTo(right2));
          const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
          rightWall.position.copy(right1.clone().add(right2).divideScalar(2));
          rightWall.lookAt(right2);
          rightWall.rotateY(Math.PI / 2);
          this.trackGroup.add(rightWall);
        }
      }
    
      getTrack() {
        return this.trackGroup;
      }
    }








  export default Track;