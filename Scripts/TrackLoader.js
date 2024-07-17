import Track from "./Track";


class TrackLoader {
    async loadTrack(trackName) {
        try {
            const trackData = await import(`../tracks/${trackName}.js`);
            const { trackPoints, startPoint, startOrientation } = trackData;
            const track = new Track(trackPoints, 15, startPoint, 3);

            return {track: track, orientation: startOrientation, point:startPoint};
        } catch (error) {
            throw new Error(`Failed to load track: ${error.message}`);
        }
    }
}