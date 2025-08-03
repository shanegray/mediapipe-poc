import type { PoseLandmarkerResult, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface PostureAnalysisResult {
  status: 'good' | 'bad' | 'unknown';
  confidence: number;
  issues: string[];
  details: {
    shoulderAlignment: boolean;
    headPosition: boolean;
    neckAngle: boolean;
    chinPosition: boolean;
  };
}

export class PostureAnalyzer {
  analyze(
    poseResult: PoseLandmarkerResult | null,
    faceResult: FaceLandmarkerResult | null
  ): PostureAnalysisResult {
    if (!poseResult?.landmarks?.[0] || !faceResult?.faceLandmarks?.[0]) {
      return {
        status: 'unknown',
        confidence: 0,
        issues: ['Unable to detect pose or face'],
        details: {
          shoulderAlignment: false,
          headPosition: false,
          neckAngle: false,
          chinPosition: false,
        },
      };
    }

    const poseLandmarks = poseResult.landmarks[0];
    const faceLandmarks = faceResult.faceLandmarks[0];

    const shoulderAlignment = this.checkShoulderAlignment(poseLandmarks);
    const headPosition = this.checkHeadPosition(poseLandmarks, faceLandmarks);
    const neckAngle = this.checkNeckAngle(poseLandmarks, faceLandmarks);
    const chinPosition = this.checkChinPosition(faceLandmarks);

    const issues: string[] = [];
    if (!shoulderAlignment) issues.push('Shoulders are uneven');
    if (!headPosition) issues.push('Head is tilted forward');
    if (!neckAngle) issues.push('Neck angle is poor');
    if (!chinPosition) issues.push('Chin is not properly positioned');

    const goodPostureCount = [shoulderAlignment, headPosition, neckAngle, chinPosition].filter(Boolean).length;
    const confidence = goodPostureCount / 4;
    const status = goodPostureCount >= 3 ? 'good' : 'bad';

    return {
      status,
      confidence,
      issues,
      details: {
        shoulderAlignment,
        headPosition,
        neckAngle,
        chinPosition,
      },
    };
  }

  private checkShoulderAlignment(landmarks: any[]): boolean {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    if (!leftShoulder || !rightShoulder) return false;
    
    const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    return shoulderHeightDiff < 0.05;
  }

  private checkHeadPosition(poseLandmarks: any[], faceLandmarks: any[]): boolean {
    const nose = poseLandmarks[0];
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    
    if (!nose || !leftShoulder || !rightShoulder) return false;
    
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    
    const forwardTilt = nose.x - shoulderMidpoint.x;
    return Math.abs(forwardTilt) < 0.1;
  }

  private checkNeckAngle(poseLandmarks: any[], faceLandmarks: any[]): boolean {
    const nose = faceLandmarks[1];
    const chin = faceLandmarks[152];
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    
    if (!nose || !chin || !leftShoulder || !rightShoulder) return false;
    
    const shoulderMidpoint = {
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    
    const neckLength = shoulderMidpoint.y - chin.y;
    return neckLength > 0.15 && neckLength < 0.3;
  }

  private checkChinPosition(faceLandmarks: any[]): boolean {
    const nose = faceLandmarks[1];
    const chin = faceLandmarks[152];
    const forehead = faceLandmarks[10];
    
    if (!nose || !chin || !forehead) return false;
    
    const chinAngle = Math.atan2(chin.y - nose.y, chin.x - nose.x);
    const idealAngle = Math.PI / 2;
    const angleDiff = Math.abs(chinAngle - idealAngle);
    
    return angleDiff < 0.3;
  }
}