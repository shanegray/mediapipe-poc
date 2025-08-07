# Research Prompts for Model Evaluation

## Prompt 1: Google Models Deep Dive (Task 2)

### For o3-pro/Perplexity:

I'm building a posture detection system for people working at desks and need comprehensive technical analysis of Google's pose detection models. MediaPipe browser version has proven insufficient (only 60% accuracy) due to incorrect shoulder landmark placement. I need to understand if other Google models can solve this.

**Please provide detailed analysis of:**

### 1. MoveNet (TensorFlow.js) - All Three Variants
- **Lightning vs Thunder vs MultiPose**: What are the actual accuracy differences?
- **Landmark quality**: Do they place shoulder landmarks on anatomical joints or visible edges like MediaPipe?
- **3D capabilities**: Can any variant provide reliable depth (Z-axis) information?
- **Browser performance**: Real-world FPS on average hardware (not just marketing claims)
- **Posture-specific accuracy**: Any studies or benchmarks for seated posture detection?
- **Key limitations**: What posture issues can it NOT detect (rounded shoulders, forward head, etc.)?

### 2. MediaPipe Server-Side (Python/Node.js)
- **Model differences**: Is the server-side model actually different from browser, or just the same model running server-side?
- **Pose Landmarker vs Legacy Pose**: Which version should I use and why?
- **Heavy vs Full vs Lite models**: Actual accuracy differences for posture detection
- **Landmark improvements**: Does server version fix the shoulder joint placement issue?
- **Additional landmarks**: Are there landmarks available server-side not in browser version?
- **Cost implications**: Running costs on cloud providers (AWS, GCP, Azure)

### 3. BlazePose Variants
- **BlazePose Full vs Lite vs Heavy**: Detailed accuracy comparison
- **Relationship to MediaPipe**: Is BlazePose just MediaPipe under the hood?
- **GHUM vs COCO topology**: Which is better for posture detection and why?
- **33 vs 39 landmarks**: What are the additional 6 landmarks and do they help with posture?
- **Known issues**: Specific problems with shoulder/neck detection

### 4. Google Cloud Vision API Pose Detection
- **Current capabilities**: What pose detection features are actually available (not just face/object)?
- **Model architecture**: What model does it use internally?
- **Accuracy benchmarks**: How does it compare to MediaPipe/MoveNet?
- **Pricing structure**: Actual costs for continuous posture monitoring (per image, per minute, bulk pricing)
- **API limitations**: Rate limits, image size requirements, latency
- **Batch processing**: Can it handle video streams or only static images?

**Specific questions I need answered:**
1. Which Google model is most accurate for detecting: a) rounded shoulders, b) forward head posture, c) slouching?
2. Do any Google models provide reliable 3D shoulder position from a single RGB camera?
3. What's the real-world latency for each model (including network overhead for cloud APIs)?
4. Are there any Google models I'm missing that could work better?
5. Has anyone successfully used these for clinical/medical posture assessment?

---

## Prompt 2: Advanced Open-Source Models Analysis (Task 3)

### For o3-pro/Perplexity:

I need detailed technical and deployment analysis of state-of-the-art pose detection models for posture assessment. Budget constraint is <$10/user/month, accuracy target is >80% for detecting bad posture.

**Please provide comprehensive analysis of:**

### 1. MMPose (OpenMMLab)
- **Best model for posture**: Which backbone/config is optimal (HRNet-W48, ViTPose-B, etc.)?
- **Accuracy benchmarks**: Real accuracy on posture detection (not just COCO mAP scores)
- **Landmark quality**: How accurate are shoulder/spine landmarks compared to MediaPipe?
- **3D capabilities**: Which models provide reliable 3D pose from single RGB?
- **Deployment requirements**:
  - Minimum GPU specs (can it run on T4, or needs V100/A100?)
  - VRAM requirements for different models
  - Inference speed (FPS) on different GPUs
  - CPU-only performance (if possible)
- **Production deployment**:
  - Best serving framework (TorchServe, Triton, ONNX Runtime?)
  - Docker container size
  - Cold start times
  - Batch processing capabilities
- **Cost analysis**: 
  - AWS/GCP/Azure GPU instance costs
  - Estimated cost per user for 8-hour monitoring
  - Serverless options (Lambda, Cloud Run with GPU?)

### 2. OpenPose (CMU)
- **Current status**: Is it still maintained? Latest stable version?
- **Model variants**: Which model for posture (BODY_25, COCO, MPI)?
- **Shoulder detection**: How accurate are shoulder landmarks compared to MediaPipe?
- **3D extensions**: OpenPose 3D capabilities and requirements
- **Performance**:
  - GPU requirements (minimum and recommended)
  - Multi-person impact on performance
  - Optimization options (8-bit, TensorRT)
- **Integration complexity**: 
  - API design for web service
  - Language bindings (Python, Node.js)
  - Docker deployment challenges
- **Comparison to newer models**: Why choose OpenPose over MMPose/ViTPose in 2025?

### 3. ViTPose (Vision Transformer)
- **Model sizes**: ViTPose-B vs L vs H for posture detection
- **Accuracy advantages**: What makes it better than CNN-based approaches?
- **Computational cost**: FLOPs and real-world GPU requirements
- **Fine-tuning potential**: Can it be fine-tuned for posture without full retraining?
- **Production readiness**:
  - Available pretrained weights
  - Inference optimization options
  - Serving frameworks support
- **Specific strengths**: What posture issues does it detect better than others?

### 4. Apple Vision Framework
- **Capabilities**: 91 body points - which ones help with posture?
- **Accuracy**: How does it compare to MMPose/OpenPose?
- **Cross-platform options**: Any way to use it outside iOS/macOS?
- **ARKit Body Tracking**: Additional features useful for posture?
- **Server deployment**: Can Mac Mini/Studio be used as a pose detection server?
- **Cost effectiveness**: Mac Mini M2 as server vs GPU cloud instance?

### 5. Other Models to Consider
- **YOLO-Pose**: Speed vs accuracy trade-offs
- **AlphaPose**: Current status and advantages
- **PoseNet successors**: Beyond MoveNet, what else from TensorFlow?
- **DeepLabCut**: Applicable to human posture?
- **Commercial APIs**: Any lesser-known APIs (not Google/Amazon/Azure)?

**Critical evaluation criteria:**
1. Which model best detects subtle posture issues (5-10 degree slouch)?
2. Single RGB camera 3D accuracy comparison
3. Minimum viable GPU for 30 FPS inference
4. Docker container deployment complexity
5. Monthly infrastructure cost for 100 concurrent users

---

## Prompt 3: Unknown Solutions Discovery

### For o3-pro/Perplexity:

I'm looking for posture detection solutions I might not know about. The challenge: detect bad desk posture with >80% accuracy for <$10/user/month using a standard webcam.

**Please research and find:**

### 1. Specialized Posture Detection Models/Systems
- Models specifically trained for ergonomic/posture assessment (not general pose)
- Medical/clinical posture analysis systems that could be adapted
- Research papers with code for posture-specific models
- Physiotherapy or rehabilitation focused solutions
- Occupational health monitoring systems

### 2. Alternative Technical Approaches
- **Hybrid solutions**: Combining face + pose + other signals
- **Temporal models**: Using LSTM/Transformer for posture over time
- **Contrastive learning**: Models trained on good vs bad posture pairs
- **Few-shot learning**: Models that can adapt to individual users quickly
- **Edge AI chips**: Coral, Jetson Nano, etc. for local processing
- **WebAssembly ports**: High-performance models running in browser

### 3. Commercial Solutions I Might Have Missed
- Startups in the posture/ergonomics space
- White-label APIs for posture detection
- B2B health monitoring platforms with APIs
- Fitness/wellness apps with posture features
- Gaming/VR SDKs with posture tracking

### 4. Academic/Research Resources
- University labs working on posture detection
- Recent papers (2023-2024) on pose estimation for health
- Datasets specifically for sitting posture
- Pre-trained models from research groups
- Open challenges/competitions in this space

### 5. Creative Cost-Reduction Strategies
- Federated learning approaches (train on-device)
- Synthetic data generation for posture
- Knowledge distillation from large to small models
- Multi-tenant GPU sharing strategies
- Spot instance/preemptible VM strategies
- Edge computing solutions

### 6. Regional/Niche Solutions
- Asian market solutions (often more advanced in pose tech)
- European health-tech companies (strict privacy but innovative)
- Medical device companies with posture monitoring
- Insurance industry tools for workplace safety

**Key questions to answer:**
1. What's the current state-of-the-art specifically for seated posture detection?
2. Are there any breakthrough papers/models from 2024 I should know about?
3. What are companies like Upright, Lumo Lift, or PostureScreen using internally?
4. Are there any open-source projects specifically for desk posture?
5. What would a physiotherapist or ergonomics expert recommend for technical approach?

---

## Prompt 4: Implementation Feasibility Check

### For o3-pro/Perplexity:

Given these constraints, I need a reality check on what's actually achievable:
- **Budget**: <$10/user/month
- **Accuracy**: >80% for detecting bad posture
- **Hardware**: Standard webcam (no depth camera)
- **Privacy**: Prefer on-device or minimal server processing
- **Scale**: 100-1000 concurrent users eventually

**Please analyze:**

1. **Technical Feasibility**
   - Is 80% accuracy achievable with RGB-only camera?
   - What's the theoretical limit for posture detection accuracy?
   - Which specific posture issues are impossible to detect without depth?

2. **Economic Reality**
   - Break down real infrastructure costs for each approach
   - Hidden costs (bandwidth, storage, maintenance)
   - Cost optimization strategies that actually work

3. **Practical Deployment**
   - Most common failure points in production
   - Scalability bottlenecks to expect
   - Browser limitations that will cause problems

4. **User Experience Trade-offs**
   - Minimum acceptable FPS for user feedback
   - Latency tolerance for posture alerts
   - Battery/CPU impact of browser-based solutions

5. **Legal/Compliance Considerations**
   - GDPR/CCPA implications of pose data
   - Medical device regulations if marketed for health
   - Liability concerns for posture recommendations

**The bottom line questions:**
1. Given all constraints, what's the single best technical approach?
2. Should I pivot to interval capture instead of real-time?
3. Is this problem actually solvable at this price point?
4. What would you build if this was your project?

---

## Notes for Using These Prompts

1. **For o3-pro**: These prompts are designed for deep technical analysis. Ask for code examples, specific benchmarks, and implementation details.

2. **For Perplexity**: These prompts will help find recent information, research papers, and solutions you might not know about. Ask for sources and recent updates.

3. **Follow-up questions** to ask based on responses:
   - "Show me actual code for deploying [model] as a web service"
   - "What's the exact AWS/GCP configuration needed for [model]?"
   - "Find benchmarks comparing these models on seated posture specifically"
   - "What are the latest papers (2024) improving on these approaches?"

4. **Validation questions** to verify claims:
   - "Show me the source for that accuracy claim"
   - "Where can I find pretrained weights for that model?"
   - "What's the actual inference speed, not theoretical?"
   - "Has anyone actually deployed this in production?"