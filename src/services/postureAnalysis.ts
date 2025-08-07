import type {
	FaceLandmarkerResult,
	NormalizedLandmark,
	PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface PostureAnalysisResult {
	status: "good" | "warning" | "bad" | "unknown";
	confidence: number;
	issues: string[];
	details: {
		shoulderAlignment: boolean;
		headPosition: boolean;
		neckAngle: boolean;
		chinPosition: boolean;
		shoulderProtraction?: boolean;
		forwardHeadPosture?: boolean;
		cva?: number; // Craniovertebral angle in degrees
	};
	metrics?: {
		shoulderWidth?: number;
		shoulderZDiff?: number;
		neckAngleDegrees?: number;
		shoulderHeightDiff?: number;
		headForwardDistance?: number;
	};
}

export class PostureAnalyzer {
	private smoothingBuffer: {
		pose: NormalizedLandmark[][];
		face: NormalizedLandmark[][];
	} = { pose: [], face: [] };
	private readonly SMOOTHING_FRAMES = 5; // Increased from 3 to 5 for better smoothing

	analyze(
		poseResult: PoseLandmarkerResult | null,
		faceResult: FaceLandmarkerResult | null,
	): PostureAnalysisResult {
		if (!poseResult?.landmarks?.[0] || !faceResult?.faceLandmarks?.[0]) {
			return {
				status: "unknown",
				confidence: 0,
				issues: ["Unable to detect pose or face"],
				details: {
					shoulderAlignment: false,
					headPosition: false,
					neckAngle: false,
					chinPosition: false,
				},
			};
		}

		// Prefer worldLandmarks for 3D analysis, fallback to 2D landmarks
		const use3D = poseResult.worldLandmarks?.[0];
		const poseLandmarks = use3D
			? poseResult.worldLandmarks[0]
			: poseResult.landmarks[0];
		const faceLandmarks = faceResult.faceLandmarks[0];

		// Apply smoothing
		const smoothedPose = this.smoothLandmarks(poseLandmarks, "pose");
		const smoothedFace = this.smoothLandmarks(faceLandmarks, "face");

		// Calculate shoulder width for normalization
		const shoulderWidth = this.calculateShoulderWidth(smoothedPose);

		const shoulderAlignment = this.checkShoulderAlignment(
			smoothedPose,
			shoulderWidth,
		);
		const headPosition = this.checkHeadPosition(
			smoothedPose,
			smoothedFace,
			shoulderWidth,
		);
		const neckAngle = this.checkNeckAngle(
			smoothedPose,
			smoothedFace,
			shoulderWidth,
		);
		const chinPosition = this.checkChinPosition(smoothedFace, shoulderWidth);

		// New detection methods
		const shoulderProtraction = use3D
			? this.checkShoulderProtraction(smoothedPose)
			: undefined;
		const cva = this.calculateCVA(smoothedPose, smoothedFace);
		const forwardHeadPosture = cva !== undefined && cva < 45; // Adjusted threshold from 48 to 45

		const issues: string[] = [];
		if (!shoulderAlignment) issues.push("Shoulders are uneven");
		if (!headPosition) issues.push("Head is tilted forward");
		if (!neckAngle) issues.push("Neck angle is poor");
		if (!chinPosition) issues.push("Chin is not properly positioned");
		if (forwardHeadPosture) issues.push("Forward head posture (CVA < 45°)");
		if (shoulderProtraction === false)
			issues.push("Rounded shoulders (protraction)");

		const checks = [
			shoulderAlignment,
			headPosition,
			neckAngle,
			chinPosition,
			shoulderProtraction !== false,
			!forwardHeadPosture,
		];
		const goodPostureCount = checks.filter(Boolean).length;
		const confidence = goodPostureCount / checks.length;
		const status =
			confidence >= 0.8 ? "good" : confidence >= 0.6 ? "warning" : "bad";

		return {
			status,
			confidence,
			issues,
			details: {
				shoulderAlignment,
				headPosition,
				neckAngle,
				chinPosition,
				shoulderProtraction,
				forwardHeadPosture,
				cva,
			},
			metrics: {
				shoulderWidth: use3D ? shoulderWidth : undefined,
				shoulderZDiff:
					use3D && shoulderProtraction !== undefined
						? this.getShoulderZDiff(smoothedPose)
						: undefined,
				neckAngleDegrees: this.getNeckAngleDegrees(smoothedPose, smoothedFace),
				shoulderHeightDiff: this.getShoulderHeightDiff(
					smoothedPose,
					shoulderWidth,
				),
				headForwardDistance: this.getHeadForwardDistance(
					smoothedPose,
					shoulderWidth,
				),
			},
		};
	}

	private smoothLandmarks(
		landmarks: NormalizedLandmark[],
		type: "pose" | "face",
	): NormalizedLandmark[] {
		const buffer =
			type === "pose" ? this.smoothingBuffer.pose : this.smoothingBuffer.face;

		// Add current frame to buffer
		buffer.push([...landmarks]);

		// Keep only last N frames
		if (buffer.length > this.SMOOTHING_FRAMES) {
			buffer.shift();
		}

		// If not enough frames, return current
		if (buffer.length < 2) {
			return landmarks;
		}

		// Average landmarks across frames
		return landmarks.map((landmark, idx) => {
			const sumX = buffer.reduce((sum, frame) => sum + frame[idx].x, 0);
			const sumY = buffer.reduce((sum, frame) => sum + frame[idx].y, 0);
			const sumZ = buffer.reduce((sum, frame) => sum + frame[idx].z, 0);
			const sumVisibility = buffer.reduce(
				(sum, frame) => sum + (frame[idx].visibility || 0),
				0,
			);

			return {
				x: sumX / buffer.length,
				y: sumY / buffer.length,
				z: sumZ / buffer.length,
				visibility:
					landmark.visibility !== undefined ? sumVisibility / buffer.length : 0,
			};
		});
	}

	private calculateShoulderWidth(landmarks: NormalizedLandmark[]): number {
		const leftShoulder = landmarks[11];
		const rightShoulder = landmarks[12];

		if (!leftShoulder || !rightShoulder) return 1; // Default to 1 to avoid division by zero

		// Calculate Euclidean distance
		const dx = rightShoulder.x - leftShoulder.x;
		const dy = rightShoulder.y - leftShoulder.y;
		const dz = rightShoulder.z - leftShoulder.z;

		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	private checkShoulderAlignment(
		landmarks: NormalizedLandmark[],
		shoulderWidth: number,
	): boolean {
		const leftShoulder = landmarks[11];
		const rightShoulder = landmarks[12];

		if (!leftShoulder || !rightShoulder) return false;

		const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
		const normalizedDiff = shoulderHeightDiff / shoulderWidth;

		// Threshold: 8% of shoulder width (relaxed from 5%)
		return normalizedDiff < 0.08;
	}

	private checkHeadPosition(
		poseLandmarks: NormalizedLandmark[],
		_faceLandmarks: NormalizedLandmark[],
		shoulderWidth: number,
	): boolean {
		const nose = poseLandmarks[0];
		const leftShoulder = poseLandmarks[11];
		const rightShoulder = poseLandmarks[12];

		if (!nose || !leftShoulder || !rightShoulder) return false;

		const shoulderMidpoint = {
			x: (leftShoulder.x + rightShoulder.x) / 2,
			y: (leftShoulder.y + rightShoulder.y) / 2,
			z: (leftShoulder.z + rightShoulder.z) / 2,
		};

		const forwardTilt = nose.x - shoulderMidpoint.x;
		const normalizedTilt = forwardTilt / shoulderWidth;

		// Normalized threshold (relaxed from 0.15 to 0.2)
		return Math.abs(normalizedTilt) < 0.2;
	}

	private checkNeckAngle(
		poseLandmarks: NormalizedLandmark[],
		faceLandmarks: NormalizedLandmark[],
		_shoulderWidth: number,
	): boolean {
		const nose = faceLandmarks[1];
		const chin = faceLandmarks[152];
		const leftShoulder = poseLandmarks[11];
		const rightShoulder = poseLandmarks[12];

		if (!nose || !chin || !leftShoulder || !rightShoulder) return false;

		const shoulderMidpoint = {
			x: (leftShoulder.x + rightShoulder.x) / 2,
			y: (leftShoulder.y + rightShoulder.y) / 2,
			z: (leftShoulder.z + rightShoulder.z) / 2,
		};

		// Calculate proper angle using vectors
		const v1 = {
			x: nose.x - chin.x,
			y: nose.y - chin.y,
			z: nose.z - chin.z,
		};

		const v2 = {
			x: shoulderMidpoint.x - chin.x,
			y: shoulderMidpoint.y - chin.y,
			z: shoulderMidpoint.z - chin.z,
		};

		// Calculate angle between vectors
		const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
		const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
		const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

		if (mag1 === 0 || mag2 === 0) return false;

		const angleRad = Math.acos(
			Math.min(1, Math.max(-1, dotProduct / (mag1 * mag2))),
		);
		const angleDeg = angleRad * (180 / Math.PI);

		// Normal range: 140-180 degrees (relaxed from 150-175)
		return angleDeg >= 140 && angleDeg <= 180;
	}

	private checkChinPosition(
		faceLandmarks: NormalizedLandmark[],
		_shoulderWidth: number,
	): boolean {
		const nose = faceLandmarks[1];
		const chin = faceLandmarks[152];
		const forehead = faceLandmarks[10];

		if (!nose || !chin || !forehead) return false;

		const chinAngle = Math.atan2(chin.y - nose.y, chin.x - nose.x);
		const idealAngle = Math.PI / 2;
		const angleDiff = Math.abs(chinAngle - idealAngle);

		return angleDiff < 0.3;
	}

	private checkShoulderProtraction(landmarks: NormalizedLandmark[]): boolean {
		const leftShoulder = landmarks[11];
		const rightShoulder = landmarks[12];
		const leftHip = landmarks[23];
		const rightHip = landmarks[24];

		if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return true;

		// Calculate average z-difference between shoulders and hips
		const shoulderZ = (leftShoulder.z + rightShoulder.z) / 2;
		const hipZ = (leftHip.z + rightHip.z) / 2;
		const zDiff = shoulderZ - hipZ;

		// Threshold: 0.05m (5cm) indicates rounded shoulders (relaxed from 4cm)
		return zDiff <= 0.05;
	}

	private calculateCVA(
		poseLandmarks: NormalizedLandmark[],
		_faceLandmarks: NormalizedLandmark[],
	): number | undefined {
		// Approximate C7 as shoulder midpoint with Y offset
		const leftShoulder = poseLandmarks[11];
		const rightShoulder = poseLandmarks[12];
		const leftEar = poseLandmarks[7]; // Using left ear landmark

		if (!leftShoulder || !rightShoulder || !leftEar) return undefined;

		const c7Approx = {
			x: (leftShoulder.x + rightShoulder.x) / 2,
			y: (leftShoulder.y + rightShoulder.y) / 2 - 0.05, // Slight offset up
			z: (leftShoulder.z + rightShoulder.z) / 2,
		};

		// Vector from C7 to ear
		const v = {
			x: leftEar.x - c7Approx.x,
			y: leftEar.y - c7Approx.y,
		};

		// CVA is the angle between C7-ear line and horizontal
		// In MediaPipe, Y increases downward, so we need to handle this correctly
		// Good posture: ear is above and slightly behind C7 (larger angle)
		// Forward head: ear is forward of C7 (smaller angle)

		// Calculate angle from horizontal
		// atan2(y, x) where x is horizontal component, y is vertical component
		// We want the angle to be measured from horizontal through C7
		const angleRad = Math.atan2(-v.y, Math.abs(v.x)); // Negative because Y increases downward
		let angleDeg = angleRad * (180 / Math.PI);

		// Ensure positive angle
		if (angleDeg < 0) angleDeg = -angleDeg;

		return angleDeg;
	}

	private getShoulderZDiff(landmarks: NormalizedLandmark[]): number {
		const leftShoulder = landmarks[11];
		const rightShoulder = landmarks[12];
		const leftHip = landmarks[23];
		const rightHip = landmarks[24];

		if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;

		const shoulderZ = (leftShoulder.z + rightShoulder.z) / 2;
		const hipZ = (leftHip.z + rightHip.z) / 2;

		return shoulderZ - hipZ;
	}

	private getNeckAngleDegrees(
		poseLandmarks: NormalizedLandmark[],
		faceLandmarks: NormalizedLandmark[],
	): number | undefined {
		const nose = faceLandmarks[1];
		const chin = faceLandmarks[152];
		const leftShoulder = poseLandmarks[11];
		const rightShoulder = poseLandmarks[12];

		if (!nose || !chin || !leftShoulder || !rightShoulder) return undefined;

		const shoulderMidpoint = {
			x: (leftShoulder.x + rightShoulder.x) / 2,
			y: (leftShoulder.y + rightShoulder.y) / 2,
			z: (leftShoulder.z + rightShoulder.z) / 2,
		};

		const v1 = {
			x: nose.x - chin.x,
			y: nose.y - chin.y,
			z: nose.z - chin.z,
		};

		const v2 = {
			x: shoulderMidpoint.x - chin.x,
			y: shoulderMidpoint.y - chin.y,
			z: shoulderMidpoint.z - chin.z,
		};

		const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
		const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
		const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

		if (mag1 === 0 || mag2 === 0) return undefined;

		const angleRad = Math.acos(
			Math.min(1, Math.max(-1, dotProduct / (mag1 * mag2))),
		);
		return angleRad * (180 / Math.PI);
	}

	private getShoulderHeightDiff(
		landmarks: NormalizedLandmark[],
		shoulderWidth: number,
	): number {
		const leftShoulder = landmarks[11];
		const rightShoulder = landmarks[12];

		if (!leftShoulder || !rightShoulder) return 0;

		const heightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
		return (heightDiff / shoulderWidth) * 100; // Return as percentage
	}

	private getHeadForwardDistance(
		landmarks: NormalizedLandmark[],
		shoulderWidth: number,
	): number {
		const nose = landmarks[0];
		const leftShoulder = landmarks[11];
		const rightShoulder = landmarks[12];

		if (!nose || !leftShoulder || !rightShoulder) return 0;

		const shoulderMidpoint = {
			x: (leftShoulder.x + rightShoulder.x) / 2,
		};

		const forwardTilt = nose.x - shoulderMidpoint.x;
		return (forwardTilt / shoulderWidth) * 100; // Return as percentage
	}
}
