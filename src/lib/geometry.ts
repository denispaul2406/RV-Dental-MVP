/* eslint-disable */
export type Point = { x: number; y: number };

export const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calculateAngle = (p1: Point, p2: Point, p3: Point): number => {
    // Calculate angle at p2 formed by p1-p2-p3
    const p12 = calculateDistance(p1, p2);
    const p23 = calculateDistance(p2, p3);
    const p13 = calculateDistance(p1, p3);

    // Law of Cosines
    const angleRad = Math.acos(
        (Math.pow(p12, 2) + Math.pow(p23, 2) - Math.pow(p13, 2)) / (2 * p12 * p23)
    );

    return (angleRad * 180) / Math.PI;
};

// Simplified Wits appraisal (Project A and B onto Occlusal plane)
// Real orthodontic Wits is complex, this is a geometric approximation for the demo.
export const calculateWits = (a: Point, b: Point, occlusalPlaneStart: Point, occlusalPlaneEnd: Point): number => {
    // Project A and B onto the line defined by occlusalPlane
    // Return distance between projections
    // For demo simplicity, we might just return X-diff adjusted for rotation, or generic placeholders.
    // Let's implement point-to-line projection distance.
    return 0; // User can Implement logic later or we use basic ANB as primary metric.
};

export const calculateANB = (s: Point, n: Point, a: Point, b: Point): number => {
    const sna = calculateAngle(s, n, a);
    const snb = calculateAngle(s, n, b);
    return sna - snb;
};

// Calculate Overjet: Horizontal distance between Point A and Point B
// In normalized coordinates, we need to account for the scale
// This is a simplified calculation - real overjet requires dental landmarks
export const calculateOverjet = (a: Point, b: Point, scaleFactor: number = 1): number | null => {
    // Overjet is typically measured horizontally (x-direction)
    // In a lateral ceph, Point A and B represent skeletal points
    // Real overjet requires incisal edge positions, but we can approximate
    // using the horizontal distance between A and B projected onto occlusal plane
    
    // Simplified: horizontal distance in normalized coordinates
    // Assuming 1 unit = ~0.1mm (this is approximate and would need calibration)
    const horizontalDistance = Math.abs(a.x - b.x);
    
    // Convert normalized distance to mm (approximate conversion)
    // This is a rough estimate - would need actual image calibration
    const overjetMm = horizontalDistance * scaleFactor * 0.1;
    
    return overjetMm;
};
