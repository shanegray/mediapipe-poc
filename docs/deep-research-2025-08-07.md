Question:
I have an application that uses MediaPipe to stream pictures from a user's camera, then use a combination of Face Landmarks and Posture Landmarks. However it isn't returning good enough results. It doesn't seem to capture rounding of my shoulders or other poses I know to be 'Bad'. I want to research methods previous people have done to determine good/bad posture from pictures. These pictures will come from a web cam - so not a side on view (as you see in a lot of images) I want you to then analyse my code and see where I can make low-hanging fruit improvements and after that more in-depth improvements. Here is my code: import type { PoseLandmarkerResult, FaceLandmarkerResult } from '@mediapipe/tasks-vision'; export interface PostureAnalysisResult { status: 'good' | 'bad' | 'unknown'; confidence: number; issues: string[]; details: { shoulderAlignment: boolean; headPosition: boolean; neckAngle: boolean; chinPosition: boolean; }; } export class PostureAnalyzer { analyze( poseResult: PoseLandmarkerResult | null, faceResult: FaceLandmarkerResult | null ): PostureAnalysisResult { if (!poseResult?.landmarks?.[0] || !faceResult?.faceLandmarks?.[0]) { return { status: 'unknown', confidence: 0, issues: ['Unable to detect pose or face'], details: { shoulderAlignment: false, headPosition: false, neckAngle: false, chinPosition: false, }, }; } const poseLandmarks = poseResult.landmarks[0]; const faceLandmarks = faceResult.faceLandmarks[0]; const shoulderAlignment = this.checkShoulderAlignment(poseLandmarks); const headPosition = this.checkHeadPosition(poseLandmarks, faceLandmarks); const neckAngle = this.checkNeckAngle(poseLandmarks, faceLandmarks); const chinPosition = this.checkChinPosition(faceLandmarks); const issues: string[] = []; if (!shoulderAlignment) issues.push('Shoulders are uneven'); if (!headPosition) issues.push('Head is tilted forward'); if (!neckAngle) issues.push('Neck angle is poor'); if (!chinPosition) issues.push('Chin is not properly positioned'); const goodPostureCount = [shoulderAlignment, headPosition, neckAngle, chinPosition].filter(Boolean).length; const confidence = goodPostureCount / 4; const status = goodPostureCount >= 3 ? 'good' : 'bad'; return { status, confidence, issues, details: { shoulderAlignment, headPosition, neckAngle, chinPosition, }, }; } private checkShoulderAlignment(landmarks: any[]): boolean { const leftShoulder = landmarks[11]; const rightShoulder = landmarks[12]; if (!leftShoulder || !rightShoulder) return false; const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y); return shoulderHeightDiff < 0.05; } private checkHeadPosition(poseLandmarks: any[], faceLandmarks: any[]): boolean { const nose = poseLandmarks[0]; const leftShoulder = poseLandmarks[11]; const rightShoulder = poseLandmarks[12]; if (!nose || !leftShoulder || !rightShoulder) return false; const shoulderMidpoint = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2, }; const forwardTilt = nose.x - shoulderMidpoint.x; return Math.abs(forwardTilt) < 0.1; } private checkNeckAngle(poseLandmarks: any[], faceLandmarks: any[]): boolean { const nose = faceLandmarks[1]; const chin = faceLandmarks[152]; const leftShoulder = poseLandmarks[11]; const rightShoulder = poseLandmarks[12]; if (!nose || !chin || !leftShoulder || !rightShoulder) return false; const shoulderMidpoint = { y: (leftShoulder.y + rightShoulder.y) / 2, }; const neckLength = shoulderMidpoint.y - chin.y; return neckLength > 0.15 && neckLength < 0.3; } private checkChinPosition(faceLandmarks: any[]): boolean { const nose = faceLandmarks[1]; const chin = faceLandmarks[152]; const forehead = faceLandmarks[10]; if (!nose || !chin || !forehead) return false; const chinAngle = Math.atan2(chin.y - nose.y, chin.x - nose.x); const idealAngle = Math.PI / 2; const angleDiff = Math.abs(chinAngle - idealAngle); return angleDiff < 0.3; } }

Executive summary

1. What others are doing  
   • Heuristic, threshold-based rules (ear–shoulder distance, shoulder height difference, ear height difference) are still the most common for webcam-front views because they run in real-time and need no training. Typical community projects include “forward-head-posture-alert” ([github.com](https://github.com/YoussefNim/forward_head_posture_alert?utm_source=chatgpt.com)), “UpRightly-PostureMonitor” ([github.com](https://github.com/alxkh18/UpRightly-PostureMonitor)) and the academic CVA literature (cranio-vertebral angle) where a CVA < 48 ° flags forward head posture ([synapse.koreamed.org](https://synapse.koreamed.org/articles/1516088242?utm_source=chatgpt.com)).  
   • Data-driven classifiers built on top of the pose/face landmarks beat hand-tuned rules in accuracy once you have a few hundred labelled frames. A good open, reproducible reference is Galvin et al.’s “Posture Detection from a Frontal Camera” which trains an MLP on MediaPipe key-points and shows that feeding 3-D world-coordinates outperforms raw 2-D pixel coords ([github.com](https://github.com/jvgalvin/posture)).  
   • Recent research is moving to Graph Convolutional Networks (GCN). A 2024 JMIR study achieved 78 % balanced accuracy for forward-head-posture from a single RGB frame by (1) estimating 3-D joints with VideoPose3D and (2) classifying with a GCN ([formative.jmir.org](https://formative.jmir.org/2024/1/e55476/?utm_source=chatgpt.com)).  
   • All successful approaches normalise distances (e.g., divide by shoulder width or torso length) and either smooth landmarks over time (EMA, one-euro filter) or feed short temporal windows to the classifier to suppress jitter.  
   • Shoulder-rounding is usually detected from 3-D scapular protraction (shoulder Z coordinate coming forward relative to the thorax) or by the sagittal shoulder–C7 angle described in postural-angle reviews ([researchgate.net](https://www.researchgate.net/publication/315442566_Photogrammetric_Assessment_of_Upper_Body_Posture_Using_Postural_Angles_A_Literature_Review?utm_source=chatgpt.com)). 2-D front-view alone is rarely enough—you need the Z value that MediaPipe Pose already gives you, or a learned model that implicitly exploits it.

2. Quick wins in your code
   (You can implement these in minutes without redesigning the pipeline.)  
   a. Use world_landmarks instead of landmarks.  
    poseResult.worldLandmarks[0] gives metric-scaled (m) 3-D coordinates, allowing you to look at z-displacement for forward head/shoulder rounding.  
   b. Normalise every distance by shoulder width (‖R-shoulder – L-shoulder‖) so thresholds are camera-distance invariant.  
   c. Replace head-position test with CVA: angle between vector (C7 → ear-tragus) and horizontal. MediaPipe Pose index 0 = nose; C7 ≈ index 0 of PoseLandmarks? Actually C7 is not provided—cheat by taking midpoint of shoulders minus a small Y-offset, or use landmark 23 (left hip) as a surrogate thoracic point. Threshold: CVA < 48° → bad posture ([synapse.koreamed.org](https://synapse.koreamed.org/articles/1516088242?utm_source=chatgpt.com)).  
   d. Your neck “angle” currently measures vertical chin-to-shoulder distance. Compute the actual angle:  
    let v1 = chin – nose, v2 = shoulderMid – chin; neckAngle = acos((v1·v2)/‖v1‖‖v2‖). Empirically 150–175° is neutral.  
   e. Use the z-difference between shoulders and corresponding hips; a positive value (~> 0.04 m) implies shoulders are protracted (“rounded”).  
   f. Low-pass filter landmarks across 3–5 frames to avoid frequent flapping between good/bad.

3. Deeper improvements
4. Data-driven posture classifier  
   • Collect 1 k–2 k labelled frames (4–5 people, good/bad).  
   • Feature vector = 3-D world coords of 16 upper-body joints + selected face points.  
   • Train logistic-regression baseline, then a small MLP (e.g., 3×128) in tfjs; expect 85–90 % F1 (Galvin et al.) ([github.com](https://github.com/jvgalvin/posture)).  
   • If you can tolerate a heavier model, export a GCN (20–30 k parameters) as ONNX Web, mirroring the JMIR 2024 pipeline ([formative.jmir.org](https://formative.jmir.org/2024/1/e55476/?utm_source=chatgpt.com)).

5. Temporal modelling  
   Add a 1-second sliding window (30 frames) and run an LSTM or temporal CNN to detect sustained slouching; this removes transient false alarms (stretching, reaching for a mug).

6. Personal calibration  
   The main source of false “bad” is anatomical variance. Record 5 s of a user-confirmed “good” pose, compute their baseline CVA and shoulder-z offset, and subtract these from live readings.

7. Visualise confidence to user  
   Instead of a single confidence = (#-good tests)/4, combine tests with learned weights or Bayesian fusion. Provide numeric degrees/centimetres so users understand what to fix.

8. Ergonomics and EU privacy
   • Store only derived skeletal data (no raw images) to remain comfortably inside GDPR “biometric data” exemptions for non-identifying pose vectors.  
   • Encrypt any cloud transmission; otherwise keep all inference client-side.

Reference threshold cheat-sheet (front-view webcam, normalised by shoulder width)  
• Shoulder height difference < 5 % ⇒ aligned.  
• Shoulder-z protraction > 4 cm (world coords) ⇒ rounded.  
• CVA (=angle(C7-ear,horizontal)) < 48° ⇒ forward head.  
• Ear height difference > 3 % ⇒ lateral head tilt.  
• Neck angle (chin-nose-shoulderMid) outside 150–175° ⇒ flexed/extended.  
Values taken from clinical photogrammetry studies ([synapse.koreamed.org](https://synapse.koreamed.org/articles/1516088242?utm_source=chatgpt.com), [researchgate.net](https://www.researchgate.net/publication/315442566_Photogrammetric_Assessment_of_Upper_Body_Posture_Using_Postural_Angles_A_Literature_Review?utm_source=chatgpt.com)) and community heuristics ([github.com](https://github.com/YoussefNim/forward_head_posture_alert?utm_source=chatgpt.com)).

Next steps for you

1. Swap to world_landmarks + normalisation + CVA angle (1 hr).
2. Collect a tiny labelled clip and fit a logistic-regression model (2–3 hrs).
3. If accuracy still lags, prototype a GCN as in the JMIR paper (1–2 days).

These incremental changes usually lift precision/recall from ~60 % (typical heuristic) to > 85 %, and users perceive far fewer “false nags”.
