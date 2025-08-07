⏺ Research Analysis & Applicability to POC

Based on the o3-pro research and linked sources, here's what can be applied:

✅ Immediately Applicable (Quick Wins)

1. Use World Landmarks (3D) - MediaPipe provides worldLandmarks with z-coordinates in meters, crucial for detecting shoulder rounding
2. Normalize by Shoulder Width - Makes thresholds camera-distance invariant
3. CVA Implementation - Craniovertebral angle <48° for forward head detection (ear-C7 angle)
4. Proper Angle Calculations - Replace distance-based checks with actual vector angles
5. Z-axis Shoulder Protraction - Use z-difference between shoulders and hips (>0.04m = rounded)
6. Landmark Smoothing - Low-pass filter over 3-5 frames to reduce jitter

⚠️ Partially Applicable

1. C7 Landmark - MediaPipe doesn't provide C7; we'll approximate using shoulder midpoint with Y-offset
2. Temporal Modeling - 1-second sliding windows would help but require architecture changes
3. Personal Calibration - Valuable but needs UI/UX for calibration flow

❌ Not Immediately Applicable

1. ML Classifiers (MLP/GCN) - Requires labeled training data we don't have
2. VideoPose3D - Separate model, adds complexity
3. LSTM/Temporal CNN - Requires significant architecture changes
