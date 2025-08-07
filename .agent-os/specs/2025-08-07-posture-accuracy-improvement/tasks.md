# Spec Tasks

## Tasks

- [ ] 1. Quick Wins Implementation (Based on o3-pro Research)
  - [ ] 1.1 Write tests for new detection functions
  - [ ] 1.2 Switch to worldLandmarks for 3D coordinates
  - [ ] 1.3 Implement shoulder width normalization
  - [ ] 1.4 Implement CVA (Craniovertebral Angle) calculation
  - [ ] 1.5 Add z-axis shoulder protraction detection
  - [ ] 1.6 Fix angle calculations (use vectors not distances)
  - [ ] 1.7 Add 3-5 frame landmark smoothing
  - [ ] 1.8 Verify all tests pass

- [ ] 2. Enhanced Algorithm Implementation
  - [ ] 2.1 Write tests for clinical thresholds
  - [ ] 2.2 Implement C7 approximation logic
  - [ ] 2.3 Add neck angle calculation (150-175° range)
  - [ ] 2.4 Implement lateral head tilt detection
  - [ ] 2.5 Add confidence scoring system
  - [ ] 2.6 Create threshold configuration system
  - [ ] 2.7 Verify all algorithm tests pass

- [ ] 3. POC Integration and Validation
  - [ ] 3.1 Write integration tests for updated PostureAnalyzer
  - [ ] 3.2 Refactor PostureAnalyzer with research-based algorithms
  - [ ] 3.3 Update PostureAnalysisResult interface with new metrics
  - [ ] 3.4 Add debug visualization for CVA, angles, and z-coordinates
  - [ ] 3.5 Test with multiple subjects and posture scenarios
  - [ ] 3.6 Document threshold sources and clinical references
  - [ ] 3.7 Create comparison report (before/after improvements)
  - [ ] 3.8 Verify all tests pass and accuracy improvements