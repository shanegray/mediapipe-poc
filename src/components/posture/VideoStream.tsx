import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { MediaPipeService } from "@/services/mediapipe";
import { PostureAnalyzer } from "@/services/postureAnalysis";
import type { PostureAnalysisResult } from "@/services/postureAnalysis";
import type {
	FaceLandmarkerResult,
	PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

export function VideoStream() {
	const { videoRef, isLoading, error, hasPermission } = useCamera();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mediaPipeRef = useRef<MediaPipeService | null>(null);
	const analyzerRef = useRef<PostureAnalyzer | null>(null);
	const animationRef = useRef<number | null>(null);

	const [isInitializing, setIsInitializing] = useState(true);
	const [postureResult, setPostureResult] =
		useState<PostureAnalysisResult | null>(null);
	const [showVideoFeed, setShowVideoFeed] = useState(true);

	useEffect(() => {
		async function initialize() {
			try {
				mediaPipeRef.current = new MediaPipeService();
				analyzerRef.current = new PostureAnalyzer();
				await mediaPipeRef.current.initialize();
				setIsInitializing(false);
			} catch (err) {
				console.error("Failed to initialize MediaPipe:", err);
			}
		}

		initialize();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			mediaPipeRef.current?.cleanup();
		};
	}, []);

	useEffect(() => {
		if (!hasPermission || !videoRef.current || isInitializing) return;

		function processFrame() {
			if (!videoRef.current || !mediaPipeRef.current || !analyzerRef.current)
				return;

			const timestamp = performance.now();
			const poseResult = mediaPipeRef.current.detectPose(
				videoRef.current,
				timestamp,
			);
			const faceResult = mediaPipeRef.current.detectFace(
				videoRef.current,
				timestamp,
			);

			const analysis = analyzerRef.current.analyze(poseResult, faceResult);
			setPostureResult(analysis);

			// Debug logging
			if (analysis.status !== "unknown" && Math.random() < 0.05) {
				// Log 5% of frames
				console.log("Posture Debug:", {
					status: analysis.status,
					confidence: analysis.confidence,
					cva: analysis.details.cva,
					shoulderZDiff: analysis.metrics?.shoulderZDiff,
					issues: analysis.issues,
				});
			}

			drawLandmarks(poseResult, faceResult, showVideoFeed);

			animationRef.current = requestAnimationFrame(processFrame);
		}

		function drawLandmarks(
			poseResult: PoseLandmarkerResult | null,
			faceResult: FaceLandmarkerResult | null,
			drawVideo: boolean,
		) {
			if (!canvasRef.current || !videoRef.current) return;

			const ctx = canvasRef.current.getContext("2d");
			if (!ctx) return;

			canvasRef.current.width = videoRef.current.videoWidth;
			canvasRef.current.height = videoRef.current.videoHeight;

			ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

			if (!drawVideo) {
				ctx.fillStyle = "#09090b";
				ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
			}

			if (poseResult?.landmarks?.[0]) {
				ctx.fillStyle = "#00ff00";
				ctx.strokeStyle = "#00ff00";
				ctx.lineWidth = 2;

				for (const landmark of poseResult.landmarks[0]) {
					const x = landmark.x * canvasRef.current.width;
					const y = landmark.y * canvasRef.current.height;
					ctx.beginPath();
					ctx.arc(x, y, 5, 0, 2 * Math.PI);
					ctx.fill();
				}
			}

			if (faceResult?.faceLandmarks?.[0]) {
				ctx.fillStyle = "#0099ff";
				for (const landmark of faceResult.faceLandmarks[0]) {
					const x = landmark.x * canvasRef.current.width;
					const y = landmark.y * canvasRef.current.height;
					ctx.beginPath();
					ctx.arc(x, y, 2, 0, 2 * Math.PI);
					ctx.fill();
				}
			}
		}

		processFrame();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [hasPermission, isInitializing, showVideoFeed, videoRef]);

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-96 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
				<p className="text-red-500 mb-2">Camera Error</p>
				<p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
			</div>
		);
	}

	if (isLoading || isInitializing) {
		return (
			<div className="flex items-center justify-center h-96 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
				<p className="text-zinc-600 dark:text-zinc-400">
					Initializing camera and MediaPipe...
				</p>
			</div>
		);
	}

	return (
		<div className="relative">
			<div className="mb-4">
				<Button
					onClick={() => setShowVideoFeed(!showVideoFeed)}
					variant="outline"
				>
					{showVideoFeed ? "Hide" : "Show"} Camera Feed
				</Button>
			</div>

			<div className="relative inline-block">
				<video
					ref={videoRef}
					className="rounded-lg mirror"
					style={{
						transform: "scaleX(-1)",
						display: showVideoFeed ? "block" : "none",
					}}
					playsInline
					muted
				/>
				<canvas
					ref={canvasRef}
					className={`rounded-lg ${!showVideoFeed ? "" : "absolute top-0 left-0"}`}
					style={{ transform: "scaleX(-1)" }}
				/>
			</div>

			{postureResult && (
				<div
					className={`mt-4 p-4 rounded-lg ${
						postureResult.status === "good"
							? "bg-green-100 dark:bg-green-900"
							: postureResult.status === "warning"
								? "bg-yellow-100 dark:bg-yellow-900"
								: postureResult.status === "bad"
									? "bg-red-100 dark:bg-red-900"
									: "bg-gray-100 dark:bg-gray-900"
					}`}
				>
					<h3 className="font-semibold text-lg mb-2">
						Posture Status: {postureResult.status.toUpperCase()}
					</h3>
					<p className="text-sm mb-2">
						Confidence: {(postureResult.confidence * 100).toFixed(0)}%
					</p>
					{postureResult.details.cva !== undefined && (
						<p className="text-sm mb-2">
							CVA Angle: {postureResult.details.cva.toFixed(1)}°{" "}
							{postureResult.details.cva < 45 ? "(Forward head)" : "(Normal)"}{" "}
							[threshold: 45°]
						</p>
					)}
					{postureResult.metrics?.shoulderZDiff !== undefined && (
						<p className="text-sm mb-2">
							Shoulder Protraction:{" "}
							{(postureResult.metrics.shoulderZDiff * 100).toFixed(1)}cm{" "}
							{postureResult.metrics.shoulderZDiff > 0.05
								? "(Rounded)"
								: "(Normal)"}{" "}
							[threshold: 5cm]
						</p>
					)}
					{postureResult.metrics?.neckAngleDegrees !== undefined && (
						<p className="text-xs mb-1 text-gray-600 dark:text-gray-400">
							Neck Angle: {postureResult.metrics.neckAngleDegrees.toFixed(1)}°
							[normal: 140-180°]
						</p>
					)}
					{postureResult.metrics?.shoulderHeightDiff !== undefined && (
						<p className="text-xs mb-1 text-gray-600 dark:text-gray-400">
							Shoulder Level Diff:{" "}
							{postureResult.metrics.shoulderHeightDiff.toFixed(1)}% [threshold:
							8%]
						</p>
					)}
					{postureResult.metrics?.headForwardDistance !== undefined && (
						<p className="text-xs mb-1 text-gray-600 dark:text-gray-400">
							Head Forward:{" "}
							{postureResult.metrics.headForwardDistance.toFixed(1)}%
							[threshold: 20%]
						</p>
					)}
					{postureResult.issues.length > 0 && (
						<>
							<h4 className="font-medium mb-1">Issues detected:</h4>
							<ul className="list-disc list-inside text-sm">
								{postureResult.issues.map((issue) => (
									<li key={issue}>{issue}</li>
								))}
							</ul>
						</>
					)}
				</div>
			)}
		</div>
	);
}
