
import * as THREE from "three";
import Track from "./Track.js";


class Utils{

    static initializePBRTexture(textureUrls, repeatX = 1, repeatY = 1) {
        
        const textureLoader = new THREE.TextureLoader();
        const albedoMap = textureLoader.load(textureUrls.albedo);
        const roughnessMap = textureLoader.load(textureUrls.roughness);
        const metalnessMap = textureLoader.load(textureUrls.metalness);
        const normalMap = textureLoader.load(textureUrls.normal);
        const aoMap = textureLoader.load(textureUrls.ao);
        const displacement = textureLoader.load(textureUrls.displacement);
    
        const maps = [albedoMap, roughnessMap, metalnessMap, normalMap, aoMap, displacement];
        maps.forEach(map => {
            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.repeat.set(repeatX, repeatY);
        });
    
        return new THREE.MeshStandardMaterial({
            map: albedoMap,
            roughnessMap: roughnessMap,
            normalMap: normalMap,
            aoMap: aoMap,
            displacement: displacement,
            roughness:1,
            metalness: 0,
            displacementScale: 0.1,
            side: THREE.DoubleSide
        });
    }

    static async loadTrack(trackName, numberOfCheckpoints) {
        try {
            console.log(`loading from ../tracks/${trackName}.js`);
            const trackData = await import(`../tracks/${trackName}.js`);
            const { trackPoints, startPoint, startOrientation } = trackData;
            const track = new Track(trackPoints, 15, startPoint, numberOfCheckpoints);
            return { track: track, orientation: startOrientation, start: startPoint };
        } catch (error) {
            throw new Error(`Failed to load track: ${error.message}`);
        }
    }
}


export default Utils;