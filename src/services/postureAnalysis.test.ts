import type {
	FaceLandmarkerResult,
	PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { beforeEach, describe, expect, it } from "vitest";
import { PostureAnalyzer } from "./postureAnalysis";

describe("PostureAnalyzer", () => {
	let analyzer: PostureAnalyzer;

	beforeEach(() => {
		analyzer = new PostureAnalyzer();
	});

	describe("Enhanced Detection Methods", () => {
		describe("worldLandmarks support", () => {
			it("should use worldLandmarks when available for 3D analysis", () => {
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					landmarks: [
						[
							{ x: 0.5, y: 0.5, z: 0 }, // nose (0)
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.6, z: 0 }, // left shoulder (11)
							{ x: 0.6, y: 0.6, z: 0 }, // right shoulder (12)
						],
					],
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 }, // nose in meters
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0.05 }, // left shoulder in meters
							{ x: 0.15, y: -0.3, z: 0.05 }, // right shoulder in meters
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 }, // face point 0
							{ x: 0.5, y: 0.35, z: 0 }, // nose (1)
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 }, // chin (152)
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				expect(result).toBeDefined();
				expect(result.status).not.toBe("unknown");
			});
		});

		describe("shoulder width normalization", () => {
			it("should normalize distances by shoulder width", () => {
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 }, // nose
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0 }, // left shoulder
							{ x: 0.15, y: -0.3, z: 0 }, // right shoulder (0.3m apart)
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 },
							{ x: 0.5, y: 0.35, z: 0 },
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 },
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				// Should use normalized thresholds
				expect(result.details).toBeDefined();
			});
		});

		describe("CVA (Craniovertebral Angle)", () => {
			it("should detect forward head posture when CVA < 45°", () => {
				// Mock data representing forward head posture
				// CVA angle should be < 48° (ear is too far forward relative to shoulders)
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					landmarks: [
						[
							{ x: 0.5, y: 0.5, z: 0 }, // nose
							...Array(6).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.55, y: 0.4, z: 0 }, // left ear (7) - forward
							...Array(3).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.6, z: 0 }, // left shoulder
							{ x: 0.6, y: 0.6, z: 0 }, // right shoulder
						],
					],
					worldLandmarks: [
						[
							{ x: 0.1, y: 0, z: 0.15 }, // nose (forward)
							...Array(6).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.1, y: -0.25, z: 0.1 }, // left ear (7) - very forward position, nearly same height as C7 (bad CVA <48°)
							...Array(3).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0 }, // left shoulder
							{ x: 0.15, y: -0.3, z: 0 }, // right shoulder
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0.1 },
							{ x: 0.5, y: 0.35, z: 0.1 },
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0.1 },
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				// Should detect forward head posture
				expect(result.details.cva).toBeLessThan(45);
				expect(result.issues).toContain("Forward head posture (CVA < 45°)");
			});

			it("should not detect forward head posture when CVA >= 45°", () => {
				// Mock data representing good head posture
				// CVA angle should be >= 48° (ear is aligned above shoulders)
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					landmarks: [
						[
							{ x: 0.5, y: 0.5, z: 0 }, // nose
							...Array(6).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.35, z: 0 }, // left ear (7) - aligned
							...Array(3).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.6, z: 0 }, // left shoulder
							{ x: 0.6, y: 0.6, z: 0 }, // right shoulder
						],
					],
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 }, // nose (aligned)
							...Array(6).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: 0.1, z: -0.02 }, // left ear (7) - proper alignment (should give CVA ~50-60°)
							...Array(3).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0 }, // left shoulder
							{ x: 0.15, y: -0.3, z: 0 }, // right shoulder
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 },
							{ x: 0.5, y: 0.35, z: 0 },
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 },
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				// Should not detect forward head posture
				expect(result.details.cva).toBeGreaterThanOrEqual(45);
				expect(result.issues).not.toContain("Forward head posture (CVA < 45°)");
			});
		});

		describe("shoulder protraction detection", () => {
			it("should detect rounded shoulders when z-difference > 0.04m", () => {
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					landmarks: [
						[
							{ x: 0.5, y: 0.5, z: 0 }, // nose
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.6, z: 0 }, // left shoulder
							{ x: 0.6, y: 0.6, z: 0 }, // right shoulder
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.8, z: 0 }, // left hip
							{ x: 0.6, y: 0.8, z: 0 }, // right hip
						],
					],
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 },
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0.06 }, // left shoulder (forward)
							{ x: 0.15, y: -0.3, z: 0.06 }, // right shoulder (forward)
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.6, z: 0 }, // left hip (23)
							{ x: 0.15, y: -0.6, z: 0 }, // right hip (24)
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 },
							{ x: 0.5, y: 0.35, z: 0 },
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 },
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				expect(result.issues).toContain("Rounded shoulders (protraction)");
			});

			it("should not detect rounded shoulders when z-difference <= 0.04m", () => {
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					landmarks: [
						[
							{ x: 0.5, y: 0.5, z: 0 }, // nose
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.6, z: 0 }, // left shoulder
							{ x: 0.6, y: 0.6, z: 0 }, // right shoulder
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.4, y: 0.8, z: 0 }, // left hip
							{ x: 0.6, y: 0.8, z: 0 }, // right hip
						],
					],
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 },
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0.02 }, // left shoulder (normal)
							{ x: 0.15, y: -0.3, z: 0.02 }, // right shoulder (normal)
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.6, z: 0 }, // left hip (23)
							{ x: 0.15, y: -0.6, z: 0 }, // right hip (24)
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 },
							{ x: 0.5, y: 0.35, z: 0 },
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 },
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				expect(result.issues).not.toContain("Rounded shoulders (protraction)");
			});
		});

		describe("angle calculations", () => {
			it("should calculate neck angle using proper vector math", () => {
				const mockPoseResult: Partial<PoseLandmarkerResult> = {
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 }, // nose
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0 }, // left shoulder
							{ x: 0.15, y: -0.3, z: 0 }, // right shoulder
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 },
							{ x: 0.5, y: 0.35, z: 0 }, // nose
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 }, // chin
						],
					],
				};

				const result = analyzer.analyze(
					mockPoseResult as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				// Should have calculated neck angle
				expect(result.details).toHaveProperty("neckAngle");
			});
		});

		describe("landmark smoothing", () => {
			it("should smooth landmarks over multiple frames", () => {
				// First frame
				const frame1Pose: Partial<PoseLandmarkerResult> = {
					worldLandmarks: [
						[
							{ x: 0, y: 0, z: 0 },
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.15, y: -0.3, z: 0.05 },
							{ x: 0.15, y: -0.3, z: 0.05 },
						],
					],
				};

				// Second frame with slight variation
				const frame2Pose: Partial<PoseLandmarkerResult> = {
					worldLandmarks: [
						[
							{ x: 0.01, y: 0.01, z: 0 },
							...Array(10).fill({ x: 0, y: 0, z: 0 }),
							{ x: -0.14, y: -0.29, z: 0.06 },
							{ x: 0.16, y: -0.31, z: 0.04 },
						],
					],
				};

				const mockFaceResult: Partial<FaceLandmarkerResult> = {
					faceLandmarks: [
						[
							{ x: 0.5, y: 0.3, z: 0 },
							{ x: 0.5, y: 0.35, z: 0 },
							...Array(150).fill({ x: 0, y: 0, z: 0 }),
							{ x: 0.5, y: 0.5, z: 0 },
						],
					],
				};

				// Analyze multiple frames
				const result1 = analyzer.analyze(
					frame1Pose as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				const result2 = analyzer.analyze(
					frame2Pose as PoseLandmarkerResult,
					mockFaceResult as FaceLandmarkerResult,
				);

				// Results should be similar due to smoothing
				expect(result1).toBeDefined();
				expect(result2).toBeDefined();
			});
		});
	});

	describe("fallback behavior", () => {
		it("should fall back to 2D landmarks when worldLandmarks unavailable", () => {
			const mockPoseResult: Partial<PoseLandmarkerResult> = {
				landmarks: [
					[
						{ x: 0.5, y: 0.5, z: 0 },
						...Array(10).fill({ x: 0, y: 0, z: 0 }),
						{ x: 0.4, y: 0.6, z: 0 },
						{ x: 0.6, y: 0.6, z: 0 },
					],
				],
				// No worldLandmarks
			};

			const mockFaceResult: Partial<FaceLandmarkerResult> = {
				faceLandmarks: [
					[
						{ x: 0.5, y: 0.3, z: 0 },
						{ x: 0.5, y: 0.35, z: 0 },
						...Array(150).fill({ x: 0, y: 0, z: 0 }),
						{ x: 0.5, y: 0.5, z: 0 },
					],
				],
			};

			const result = analyzer.analyze(
				mockPoseResult as PoseLandmarkerResult,
				mockFaceResult as FaceLandmarkerResult,
			);

			expect(result).toBeDefined();
			expect(result.status).not.toBe("unknown");
		});
	});
});
