# Research Summary: Posture Detection Improvements

## Source Analysis
Based on o3-pro research document (2025-08-07) and referenced papers/projects.

## Key Findings

### 1. Critical Implementation Changes (Quick Wins)

#### Use 3D World Landmarks
- **Current Issue**: Using 2D `landmarks` misses crucial depth information
- **Solution**: Switch to `poseResult.worldLandmarks[0]` for metric-scaled 3D coordinates
- **Impact**: Enables detection of shoulder protraction/rounding via z-axis

#### Normalize by Shoulder Width
- **Current Issue**: Fixed thresholds fail at different camera distances
- **Solution**: Divide all distances by ||right_shoulder - left_shoulder||
- **Impact**: Camera-distance invariant detection

#### Implement CVA (Craniovertebral Angle)
- **Clinical Standard**: CVA <48° indicates forward head posture
- **Measurement**: Angle between C7-ear vector and horizontal
- **Challenge**: MediaPipe lacks C7; use shoulder midpoint - Y offset
- **Source**: Korean study with 0.85-0.86 test-retest reliability

#### Fix Angle Calculations
- **Current Issue**: Using distances instead of angles
- **Solution**: Proper vector angle: acos((v1·v2)/(||v1||·||v2||))
- **Normal Range**: Neck angle 150-175° for neutral posture

#### Detect Shoulder Protraction
- **Method**: Z-difference between shoulders and corresponding hips
- **Threshold**: >0.04m indicates rounded shoulders
- **Requirement**: Must use worldLandmarks for z-coordinates

#### Add Landmark Smoothing
- **Problem**: Jittery detection causes frequent status flipping
- **Solution**: Low-pass filter over 3-5 frames
- **Options**: Exponential moving average or one-euro filter

### 2. Evidence-Based Thresholds

From clinical photogrammetry studies and community implementations:

| Metric | Threshold | Status |
|--------|-----------|---------|
| Shoulder height difference | <5% of width | Aligned |
| Shoulder z-protraction | >4cm | Rounded |
| CVA angle | <48° | Forward head |
| Ear height difference | >3% of width | Lateral tilt |
| Neck angle | Outside 150-175° | Poor |

### 3. Advanced Approaches (Future Consideration)

#### ML Classifiers
- Galvin et al.: MLP on MediaPipe keypoints achieved 85-90% F1
- 3D coordinates outperform 2D significantly
- Requires 1-2k labeled frames from 4-5 people

#### Graph Convolutional Networks
- JMIR 2024: 78% balanced accuracy for forward head detection
- Uses VideoPose3D for 3D joint estimation
- 20-30k parameters, deployable as ONNX Web

#### Temporal Modeling
- 1-second sliding windows (30 frames)
- LSTM or temporal CNN for sustained slouching detection
- Removes transient false alarms (stretching, reaching)

### 4. What's NOT Applicable to Our POC

- **Side view requirements**: Our webcam is front-facing only
- **Full spine analysis**: Limited without side view
- **Training ML models**: No labeled dataset available
- **VideoPose3D**: Adds complexity without clear benefit over MediaPipe

## Implementation Priority

### Phase 1: Immediate (1-2 days)
1. Switch to worldLandmarks
2. Add normalization
3. Implement CVA
4. Fix angle calculations
5. Add z-axis protraction
6. Implement smoothing

### Phase 2: Enhancement (3-5 days)
1. Tune thresholds with multiple test subjects
2. Add debug visualization
3. Implement confidence scoring
4. Document clinical references

### Phase 3: Future (If needed)
1. Personal calibration system
2. Collect labeled data for ML
3. Temporal modeling

## Expected Improvements

Based on similar implementations:
- **Current accuracy**: ~60% (typical heuristic)
- **After Phase 1**: ~75-80% (proper measurements)
- **With ML (future)**: >85% (requires training data)

## References

1. Forward Head Posture Alert (GitHub/YoussefNim)
2. Posture Detection from Frontal Camera (GitHub/jvgalvin)
3. CVA Clinical Study (synapse.koreamed.org)
4. JMIR 2024 GCN Study (formative.jmir.org)
5. Photogrammetric Assessment Review (ResearchGate)