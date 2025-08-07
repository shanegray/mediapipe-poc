# Spec Tasks

## Tasks

- [x] 1. Quick Wins Implementation (Based on o3-pro Research)
  - [x] 1.1 Write tests for new detection functions
  - [x] 1.2 Switch to worldLandmarks for 3D coordinates
  - [x] 1.3 Implement shoulder width normalization
  - [x] 1.4 Implement CVA (Craniovertebral Angle) calculation
  - [x] 1.5 Add z-axis shoulder protraction detection
  - [x] 1.6 Fix angle calculations (use vectors not distances)
  - [x] 1.7 Add 3-5 frame landmark smoothing (now 5 frames)
  - [x] 1.8 Verify all tests pass

- [ ] 2. Google Model Evaluation
  - [ ] 2.1 Test MediaPipe server-side (Python/Node.js) for better accuracy
  - [ ] 2.2 Evaluate Google Cloud Vision API pose detection
  - [ ] 2.3 Test MoveNet (TensorFlow.js) in browser
  - [ ] 2.4 Compare BlazePose variants (full/lite/heavy)
  - [ ] 2.5 Document accuracy, latency, and costs for each

- [ ] 3. Advanced Model Research
  - [ ] 3.1 MMPose evaluation (server deployment requirements)
  - [ ] 3.2 OpenPose testing (GPU requirements and costs)
  - [ ] 3.3 ViTPose assessment (accuracy vs infrastructure needs)
  - [ ] 3.4 Apple Vision Framework (iOS-only limitations)
  - [ ] 3.5 Create comparison matrix: accuracy, cost, latency, deployment complexity

- [ ] 4. Interval vs Real-time Analysis
  - [ ] 4.1 Prototype interval capture (every 30s/60s/5min)
  - [ ] 4.2 Test batch processing on server (cost per image)
  - [ ] 4.3 Compare with real-time streaming costs
  - [ ] 4.4 Evaluate privacy implications of each approach
  - [ ] 4.5 Calculate monthly costs for typical 8-hour workday usage

- [ ] 5. Browser-Compatible Alternatives
  - [ ] 5.1 MoveNet.js implementation and testing
  - [ ] 5.2 ONNX Runtime Web with pre-trained models
  - [ ] 5.3 TensorFlow.js with existing posture models
  - [ ] 5.4 WebAssembly-based pose detection options
  - [ ] 5.5 Accuracy vs MediaPipe comparison

- [ ] 6. Cost Analysis & Recommendations
  - [ ] 6.1 Create cost breakdown per model/approach
  - [ ] 6.2 Define accuracy thresholds for "good enough"
  - [ ] 6.3 Document deployment complexity for each option
  - [ ] 6.4 Recommend top 3 solutions based on cost/accuracy ratio
  - [ ] 6.5 Create decision matrix for stakeholders