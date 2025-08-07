# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-07-posture-accuracy-improvement/spec.md

## Technical Requirements

### Research Phase
- Compile ergonomic studies on posture assessment criteria
- Analyze existing posture detection applications and their methodologies
- Document practical implementation approaches for computer vision-based posture analysis
- Evaluate MediaPipe Pose landmark capabilities for advanced posture metrics
- Research alternative pose detection libraries and their specific strengths

### Algorithm Requirements (Based on Research)
- **Use worldLandmarks instead of landmarks** - MediaPipe's 3D world coordinates in meters for z-axis analysis
- **Normalize all distances by shoulder width** - Camera-distance invariant thresholds
- **Implement CVA (Craniovertebral Angle)** - Angle between C7-ear vector and horizontal, threshold <48° for forward head
- **Calculate proper vector angles** - Replace distance checks with actual angle calculations
- **Z-axis shoulder protraction** - Measure z-difference between shoulders and hips (>0.04m indicates rounding)
- **Landmark smoothing** - Low-pass filter over 3-5 frames to reduce jitter
- **C7 approximation** - Use shoulder midpoint minus Y-offset since MediaPipe doesn't provide C7

### Detection Metrics (Evidence-Based Thresholds)
- **Shoulder alignment**: Height difference <5% of shoulder width
- **Shoulder protraction/rounding**: Z-coordinate difference >0.04m (world coords)
- **Forward head posture (CVA)**: Angle <48° between C7-ear and horizontal
- **Lateral head tilt**: Ear height difference >3% of shoulder width
- **Neck angle**: Chin-nose-shoulderMid angle outside 150-175° range
- **Head forward position**: X-axis displacement of nose from shoulder midpoint

### Camera Angle Handling
- Front view: Focus on shoulder levelness, head tilt, and lateral symmetry
- Side view: Measure forward head, spinal curves, and anterior/posterior alignment
- Automatic view detection based on landmark visibility patterns
- Fallback strategies when certain landmarks are occluded

### Implementation Priority (Based on Research)
#### Phase 1: Quick Wins (1-2 days)
- Switch to worldLandmarks for 3D coordinates
- Implement normalization by shoulder width
- Add CVA calculation with 48° threshold
- Implement proper vector angle calculations
- Add z-axis shoulder protraction detection
- Implement 3-5 frame smoothing

#### Phase 2: Enhanced Detection (3-5 days)
- Research and implement additional clinical angles
- Add confidence scoring based on landmark visibility
- Implement debug visualization for angles/vectors
- Test and tune thresholds based on multiple subjects

#### Phase 3: Future Improvements (Optional)
- Personal calibration system
- Temporal modeling (1-second windows)
- Consider ML classifier if labeled data becomes available

## External Dependencies (Conditional)

The following libraries may be needed based on research findings:

- **@tensorflow/tfjs-models** - If PoseNet or MoveNet proves more accurate for specific posture metrics
- **Justification:** Alternative pose detection models may provide better accuracy for certain posture issues

- **mathjs** - For complex vector and matrix calculations
- **Justification:** Advanced geometric calculations for 3D posture analysis

Note: Final dependencies will be determined after research phase completion.