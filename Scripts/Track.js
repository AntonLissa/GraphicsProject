
import * as THREE from "three";
import { color, metalness, reflect, roughness } from "three/examples/jsm/nodes/Nodes.js";
import Utils from "./Utils.js";

class Track {
    constructor(points, trackWidth, startPoint, checkPointsNumber) {

      this.points = this.loadTrack(points)
      this.spline = new THREE.CatmullRomCurve3(this.points);
      this.spline.closed = true;
      this.splinePoints = null
      this.trackWidth = trackWidth;
      this.wallHeight = 3
      this.trackGroup = new THREE.Group();
      this.trackGroup.castShadow = true
      this.trackGroup.name = 'RoadGroup'
      this.numPoints = 10000;
      this.bbox = null;



      this.checkPointToReach = 0; // next checkpoint to get to
      this.checkpoints = this.spline.getSpacedPoints(checkPointsNumber); // the extra checkpooint will be the start point
      this.checkpoints.pop(); //  The last point corresponds to the first point
      this.checkpoints.push(new THREE.Vector3(startPoint[0], startPoint[1], startPoint[2])) // the last checkpoint is the starting point
      this.checkpointRadius = 20
      console.log(this.checkpoints)
      this.numberOfPillars = 50 // how many pillars on left/right of the road
      
      this.createTrack();
    }




  checkCheckpoints(carPosition) {
    try{
            const distance = carPosition.distanceTo(this.checkpoints[this.checkPointToReach]);
            if (distance < this.checkpointRadius) {
                console.log('Checkpoint ', this.checkPointToReach,' reached');
                this.checkPointToReach++;
            }
          }catch(error){console.log('no check')}
         
  }

  

  loadTrack(points){
    let vectorPoints =[]
    for(const point of points){
      if(point.length < 3)
        vectorPoints.push(new THREE.Vector3(point[0], 0, point[1]))
     else 
        vectorPoints.push(new THREE.Vector3(point[0], point[1], point[2]))
    }

    return vectorPoints;
  }

  

   calculateFaceNormal(vertex1, vertex2, vertex3) {
      const normal = new THREE.Vector3();
      const vA = new THREE.Vector3(vertex1.x, vertex1.y, vertex1.z);
      const vB = new THREE.Vector3(vertex2.x, vertex2.y, vertex2.z);
      const vC = new THREE.Vector3(vertex3.x, vertex3.y, vertex3.z);
  
      normal.crossVectors(vB.clone().sub(vA), vC.clone().sub(vA)).normalize();
  
      return normal;
    }



  createRoad(innerPoints, outerPoints) {

    const textureUrls = {
      albedo: '/textures/asphalt2/color.jpg',
      roughness: '/textures/asphalt2/roughness.jpg',
      normal: '/textures/asphalt2/normal.jpg',
      displacement: '/textures/asphalt2/displacement.jpg'
    };

    const material = Utils.initializePBRTexture(textureUrls, 1, 1); 


    const geometry = new THREE.BufferGeometry();

    const vertices = [];
    const normals = [];
    const uvs = [];

    const textureStretchY = 1 // max level of stretching for the texture in Y direction
    var currentStretchLevel = 0 // level of stretch in Y direction
    const stretchYincrement = this.spline.getLength()/this.numPoints/10 // how much to increment the stretch between points 

    for (let i = 0; i < outerPoints.length - 1; i++) {
        const outerVertex = outerPoints[i];
        const outerVertex2 = outerPoints[i + 1];
        const innerVertex = innerPoints[i];
        const innerVertex2 = innerPoints[i + 1];

        const normal1 = this.calculateFaceNormal(outerVertex, outerVertex2, innerVertex);
        const normal2 = this.calculateFaceNormal(innerVertex, outerVertex2, innerVertex2);

        vertices.push(
            // first triangle
            outerVertex.x, outerVertex.y, outerVertex.z,
            outerVertex2.x, outerVertex2.y, outerVertex2.z,
            innerVertex.x, innerVertex.y, innerVertex.z,
            // second triangle
            innerVertex.x, innerVertex.y, innerVertex.z,
            outerVertex2.x, outerVertex2.y, outerVertex2.z,
            innerVertex2.x, innerVertex2.y, innerVertex2.z
        );

        normals.push(
            normal1.x, normal1.y, normal1.z,
            normal1.x, normal1.y, normal1.z,
            normal1.x, normal1.y, normal1.z,
            normal2.x, normal2.y, normal2.z,
            normal2.x, normal2.y, normal2.z,
            normal2.x, normal2.y, normal2.z
        );

        const nextStretchLevel = currentStretchLevel + stretchYincrement;

        uvs.push(
            0, currentStretchLevel,
            0, nextStretchLevel, 
            1, currentStretchLevel,
            1, currentStretchLevel,
            0, nextStretchLevel,
            1, nextStretchLevel
        );

        currentStretchLevel = nextStretchLevel;
        if (currentStretchLevel >= textureStretchY) {
            currentStretchLevel = 0; // texture limit reached, restart from 0
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'road';
    mesh.receiveShadow = true;
    this.trackGroup.add(mesh);
  }

    
  createTrack() {

    const splinePoints = this.spline.getSpacedPoints(this.numPoints);
        
    const halfWidth = this.trackWidth / 2;
    
    // track outline points
    const outerPoints = [];
    const innerPoints = [];

    for (let i = 0; i < splinePoints.length; i++) {
      const point = splinePoints[i];
      const tangent = this.spline.getTangentAt(i / (splinePoints.length - 1)).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      
      outerPoints.push(new THREE.Vector3(point.x + normal.x * halfWidth, point.y, point.z + normal.z * halfWidth));
      innerPoints.push(new THREE.Vector3(point.x - normal.x * halfWidth, point.y, point.z - normal.z * halfWidth));

    }

    //const points = [new THREE.Vector3(0,0,0), new THREE.Vector3(10,0,10) , new THREE.Vector3(5,0,10) , new THREE.Vector3(10,0,10) ]
    this.makePillars(innerPoints)
    this.makePillars(outerPoints)
    this.createRoad(innerPoints, outerPoints)
  }

  /*
  visualizeVector(origin, vector, color) {
    const arrowHelper = new THREE.ArrowHelper(vector, origin, 10, color);
    this.trackGroup.add(arrowHelper);
  }*/

  makePillars(points){
    const increment = parseInt(points.length / this.numberOfPillars)
    for (let i = 1; i < points.length; i+=increment) {
      const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, this.wallHeight, 32);
      const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity:0.5 });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.name = 'pillar';
      pillar.position.set(points[i].x, points[i].y, points[i].z);  // Posiziona il pilastro sopra il terreno
      this.trackGroup.add(pillar);
    }

  }

    
  getTrack() {
    return this.trackGroup;
  }


  getBbox(){

    let boundingBox = new THREE.Box3();
    const points =  this.spline.getPoints(this.numPoints);
    points.forEach(point => boundingBox.expandByPoint(point));
    return boundingBox

  }
    

}




  export default Track;