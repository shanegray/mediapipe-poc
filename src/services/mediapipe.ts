import {
  FilesetResolver,
  PoseLandmarker,
  FaceLandmarker,
  type PoseLandmarkerResult,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

export class MediaPipeService {
  private poseLandmarker: PoseLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  detectPose(videoElement: HTMLVideoElement, timestamp: number): PoseLandmarkerResult | null {
    if (!this.poseLandmarker) return null;
    return this.poseLandmarker.detectForVideo(videoElement, timestamp);
  }

  detectFace(videoElement: HTMLVideoElement, timestamp: number): FaceLandmarkerResult | null {
    if (!this.faceLandmarker) return null;
    return this.faceLandmarker.detectForVideo(videoElement, timestamp);
  }

  cleanup() {
    this.poseLandmarker?.close();
    this.faceLandmarker?.close();
    this.poseLandmarker = null;
    this.faceLandmarker = null;
    this.isInitialized = false;
  }
}