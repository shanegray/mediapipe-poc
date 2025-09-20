# MediaPipe Posture POC Findings

## TL;DR
- The current `PostureAnalyzer` mixes MediaPipe world-space pose landmarks with 2D face landmarks, so several angle calculations (especially the neck metrics) never settle on realistic values.
- MediaPipe Pose only exposes two clavicle/shoulder points (indices 11 and 12). Without scapular or spine references it is extremely hard to score rounded shoulders purely from a single front-facing camera.
- Even with perfect math, the lightweight Pose Landmarker Lite model drifts on depth (`z`) and loses shoulder detail when the subject turns, which caps the reliability of “good vs. bad” posture calls.
- We can tighten up the current logic, but for production-grade posture grading we likely need richer sensors (multi-view RGB, depth) or a model that is trained end-to-end for posture quality.
- Alternatives range from heavier pose estimators (MoveNet, OpenPose, MMPose/ViTPose) to transformer-based sequence models on HuggingFace (PoseFormerV2, MotionBERT, PhysFormer). Each comes with compute and integration trade-offs.

## Why `PostureAnalyzer` misclassifies right now
1. **Mixed coordinate frames** – When world landmarks are available we feed meters-based pose joints into `checkNeckAngle` while the face landmarks remain normalized image coordinates (`src/services/postureAnalysis.ts:257-302`). The subtraction and dot products therefore mix units, driving the computed neck angles towards nonsense (often near 180° or NaN) and marking posture as "bad".
2. **Shoulder rounding proxy is too weak** – `checkShoulderProtraction` only compares the averaged shoulder `z` value to hip `z` (`src/services/postureAnalysis.ts:321-335`). In MediaPipe, the shoulder joints sit on the chest plane; without scapula points, the z-offset between shoulders and hips barely shifts when a person rounds their shoulders. On top of that the Lite model’s `z` jitter is often >5 cm, so the 5 cm threshold fires randomly.
3. **Forward head / CVA based on surrogate joints** – We approximate C7 using the shoulder midpoint with a fixed 5 cm y-offset (`src/services/postureAnalysis.ts:338-375`). This assumption breaks on taller or shorter subjects and whenever the pose landmark confidence drops, so the Craniovertebral Angle skews small and always triggers "forward head posture".
4. **Normalization ambiguities** – Several checks divide by shoulder width (`checkHeadPosition`, `getHeadForwardDistance`) but the numerator uses 2D normalized `x` when we are in world-space, or vice versa (`src/services/postureAnalysis.ts:233-462`). Depending on camera zoom, the normalized ratios either shrink toward zero (never flagging issues) or blow past thresholds (always flagging issues).
5. **Binary scoring masks uncertainty** – Missing landmarks default to "good" (`checkShoulderProtraction`, `checkUpperBodyAlignment`) so frames with partial detections inflate the confidence score. Conversely, a single noisy metric can drop the global status to "bad" even when other cues look fine.

## What MediaPipe can and cannot give us today
- **Available joints** – Pose Landmarker yields 33 body joints; only two describe the shoulder girdle (11/12). There is no explicit C7, sternum, or scapula point, so neck flexion and thoracic curvature must be inferred indirectly.
- **Depth quality** – World landmarks are estimated from a monocular camera and assume the subject faces the lens. Depth (z) is relative, not metric without calibration, and the Lite model keeps errors low near the pelvis but not at the neck/shoulders.
- **Face landmarks** – Face Landmarker returns 468 points in image-normalized coordinates. It does not output real-world depth, which is why combining them with pose world landmarks is unstable.
- **Orientation sensitivity** – When the user rotates even 20–30°, Pose Landmarker swaps the near/far shoulder and collapses `shoulderWidth`, which destabilizes every normalized ratio.
- **Temporal jitter** – MediaPipe runs frame-by-frame. The added smoothing buffer (5 frames) helps but introduces latency and still cannot remove sporadic spikes—especially in the z-axis.

Because of these limits, MediaPipe alone is best suited for trend visualisation or gentle feedback (“keep your head aligned”) rather than binary "good/bad" posture grading.

## Can we recover rounded shoulder signals with only two points?
Only partially. To detect scapular protraction we would ideally track:
- The scapula or acromion trajectory relative to the thorax.
- The angle between shoulders and a torso plane (e.g., formed by shoulders and hips).

With the current landmarks we can only:
- Monitor the shoulder-to-hip pitch angle (already implemented as `shoulderHipAngle`).
- Infer head vs. shoulder alignment.
- Track elbow drift as an indirect sign of rounding (already approximated by `elbowShoulderRatio`).

Without additional joints or a learned posture classifier, MediaPipe will consistently confuse relaxed shoulders with rounded shoulders, especially on subjects with broader chests or loose clothing. Multi-view cameras or depth sensors (Azure Kinect, RealSense) would give us scapula coverage.

## Alternative pose & posture stacks worth evaluating
| Option | Type | Pros | Cons | Integration notes |
| --- | --- | --- | --- | --- |
| **MoveNet Thunder / Lightning (TensorFlow Lite/JS)** | 17-keypoint CNN | Fast, well-supported on web/mobile, consistent 2D keypoints | No world landmarks, limited shoulder detail, depth inferred heuristically | Drop-in via TF.js or TFLite. Could swap into current pipeline with minor changes.
| **MediaPipe BlazePose GHUM Heavy** | 33-keypoint CNN | Higher fidelity than Lite, better depth stability, still browser-friendly | Heavier, requires WebGL2/WebGPU; still lacks scapula joints | Replace Lite model URL; re-tune thresholds.
| **OpenPose / Detectron2 Keypoint R-CNN** | 2D multi-person | Richer shoulder/torso cues, trained on COCO | GPU-heavy; browser deployment difficult | Run server-side, stream joints to client.
| **OpenMMLab MMPose (e.g., ViTPose, RTMPose)** | Model zoo (CNN + transformer) | SOTA accuracy, includes ViT-based models for high-precision shoulders | Large checkpoints (hundreds of MB), needs PyTorch backend | Host inference API; leverage transformer variants like ViTPose-B.
| **Ultralytics YOLOv8-Pose** | Anchor-free detector | Single-shot detection + keypoints, decent shoulder scoring | 17 keypoints only; depth absent | Lightweight PyTorch backend; export to ONNX/TFLite.
| **PoseFormerV2 (HuggingFace)** | Transformer for 3D pose from 2D sequences | Uses temporal context to hallucinate 3D joints incl. spine line | Requires high-quality 2D keypoints input; needs sequence buffering | Pipeline: run 2D pose (e.g., ViTPose) → PoseFormerV2 → analyze posture.
| **MotionBERT (HuggingFace)** | Transformer for monocular 3D pose | Strong on upper-body articulation, trained on large datasets | Heavy inference (multi-frame transformer); PyTorch only | Similar two-stage setup; provides consistent torso depth.
| **PhysFormer / Posture GPT (research transformers)** | Transformer posture classifiers | Directly output posture quality or exercise form | Usually research-quality, limited documentation | Might bootstrap posture scoring once pretrained weights are public.

Additional HuggingFace leads:
- `ViTPose` repository hosts multiple transformer backbones for 2D keypoints (Large/Huge variants).
- `SwinTF`-based keypoint detectors (e.g., `Swin2SR` adaptations) offer better shoulder precision than MediaPipe.
- Sequence transformers like `ST-GCN`, `DiffPose` and `T-POSE` are emerging for action/posture recognition; many have demo checkpoints on HuggingFace.

## Recommendations
1. **Fix coordinate handling** – Branch the pipeline so that any metric mixing face and pose landmarks runs entirely in normalized image space, or project face landmarks into world space using camera intrinsics. This should stabilise neck angle and CVA readings.
2. **Instrument metrics** – Log raw distances/angles before thresholding to calibrate realistic ranges per user. Otherwise we are tuning against synthetic expectations.
3. **Experiment with BlazePose GHUM Heavy** – It is the cheapest upgrade and provides more stable shoulders without leaving MediaPipe.
4. **Prototype a 2D→3D stack** – Combine a high-accuracy 2D model (ViTPose) with PoseFormerV2 or MotionBERT to recover spine orientation and scapular cues. Run server-side first to validate posture scoring improvements.
5. **Consider hardware augmentation** – If posture grading must be reliable, add a second camera (side view) or depth sensor. Even simple stereo depth would unlock more robust rounding detection.

## Open questions
- What latency budget do we have if we move heavy models server-side?
- Can we capture calibration footage (T-pose, neutral stance) per user to personalise thresholds?
- Do we need medical-grade posture scoring, or is qualitative feedback adequate?

Resolving these will help decide whether we keep iterating on MediaPipe or invest in a transformer-based pipeline.
