# Posture Detection POC: Progress Report

**Meeting Date:** August 5, 2025
**Client:** Dr. Deb Roy

---

## Where We Started

The goal was straightforward: build a system that can tell when someone has bad posture while working at their desk. I wanted something accurate, affordable, and privacy-conscious that could run in a web browser.

Here's the journey so far and why we need to change direction.

---

## The Story So Far

### First Attempt: PoseNet ❌

Started with TensorFlow's PoseNet since it was the most popular pose detection model. Turned out to be a dead end:

- Only 17 landmarks (not enough detail for posture)
- No 3D coordinate support
- Poor accuracy on subtle posture changes
- TensorFlow deprecated it in favor of MoveNet

### Second Attempt: ElectronJS Desktop App ❌

Thought maybe a desktop application would give better camera access and more accurate results. Built a proof of concept with ElectronJS:

- Initially seemed more accurate
- After testing, realized it was returning essentially the same results
- The problem wasn't browser limitations - it was the underlying model

### Current Attempt: MediaPipe Web ❓

Switched to Google's MediaPipe, which seemed promising with 33 body landmarks plus face detection. Built an extensive system with:

- 8 different posture checks
- Craniovertebral angle calculations for forward head detection
- 3D coordinate analysis
- Temporal smoothing over 5 frames
- Shoulder width normalization

**The result?** Unknown but likely a failure - still only ~60% accuracy. The system often thinks good posture is bad and sometimes rates bad posture as better than good.

### What I Discovered

After extensive testing and analysis, I found the core issue: MediaPipe places shoulder landmarks on the visible shoulder edge, not the actual joint. When someone turns sideways, it completely loses track of proper shoulder position.

**Test results that show the problem:**

- Good posture (side view) → 62% confidence
- Bad posture (side view) → 75% confidence (higher than good!)
- Elbow width measuring wider than shoulders (physically impossible)

---

## Why This Matters

The problem is fundamental to how MediaPipe works:

```
What actually happens:        What MediaPipe detects:
      👤                            👤
     /│\                           /│\
    ● │ ●  (actual joints)       ●   ●  (visible edges)
```

MediaPipe was designed for general pose estimation - things like fitness apps, dance games, gesture control. It's optimized for speed and works great for those use cases. But for clinical posture assessment, we need landmarks on actual anatomical joints, not just visible body edges.

This explains why the system can't detect rounded shoulders or forward head posture reliably - it's literally looking at the wrong points on the body.

---

## Where We Go From Here

### MediaPipe-Based Apps to Investigate

Before moving on to other models, there are two MediaPipe-based applications that might be worth investigating further if the client wants:

- **[OFP](https://github.com/jimothytries/OFP)** - A hobby app using MediaPipe for posture detection
- **[PostureScreen](https://www.postureanalysis.com/posturescreen-posture-movement-body-composition-analysis-assessment/)** - A commercial posture analysis application

Most apps I've seen using pose detection use a side-on camera view, and the results don't look particularly accurate, but these two might offer insights into how others have approached the problem.

**Initial findings from PostureScreen investigation:**
- Side-view camera, while not great, could be an option for detecting back angles
- Using face landmarks to determine the z-index of the face (which way it's pointing), in conjunction with other pose landmarks, could help determine if the user is looking down/up rather than straight ahead - potentially useful for approximating slouch

### Further Research Into Other Models

I've conducted additional research into off-the-shelf posture detection solutions (see [Research Summary](./perplexity-off-the-shelf-2025-08-08.md)). Key findings include:

- **SitPose (2024):** Achieving 98.1% F1 score using ensemble learning with Azure Kinect depth camera
- **YOLOv5 Sitting Posture Detection:** Open-source real-time lateral posture detection from webcam streams
- **LSTM/Transformer temporal models:** State-of-the-art for posture evaluation over time
- **Edge AI deployment:** Using Jetson Nano or Coral TPU for local, privacy-preserving inference
- **Cost-reduction strategies:** Federated learning, synthetic data generation, and multi-tenant GPU solutions to achieve <$10/user/month

Based on my research, here's the planned testing sequence:

### Phase 1: Google Model Evaluation

We'll start with Google's ecosystem since we're already familiar with it:

- **MoveNet (TensorFlow.js)** - Browser-based, free, three variants to test. **Briefly tested** - more accurate than MediaPipe but suffers from the same fundamental issue: will likely need a side-on view to determine back angles to approximate slouch
- **MediaPipe Server-Side** - Python/Node.js versions might have better accuracy
- **BlazePose Variants** - Test full, lite, and heavy versions. **Briefly tested** - similar limitations as MoveNet
- **Google Cloud Vision API** - Their commercial offering

### Phase 2: Advanced Open-Source Models

If Google's options don't meet our needs:

- **Hugging Face Posture Detection Models** - Investigating [postureDetection](https://huggingface.co/ronka/postureDetection/tree/main) which has extensive training data and potential for fine-tuning
- **MMPose** - Current state-of-the-art, needs GPU server
- **OpenPose** - CMU's battle-tested solution
- **ViTPose** - Latest vision transformer approach
- **Apple Vision Framework** - For comparison (iOS only)

### Phase 3: Deployment Strategy Testing

Parallel to model evaluation:

- **Interval Capture** - Test taking snapshots every 30s/60s/5min
- **Batch Processing** - Calculate server costs for image processing
- **Real-time vs Periodic** - Compare infrastructure requirements
- **Privacy Analysis** - Evaluate data handling for each approach

### Phase 4: Browser Alternatives

Other browser-compatible options:

- **ONNX Runtime Web** - Run pre-trained models in browser
- **TensorFlow.js Models** - Beyond just MoveNet
- **WebAssembly Solutions** - High-performance browser execution

---

## Cost Considerations

Here's what we're looking at for different approaches:

| Approach            | Expected Accuracy | Cost per User/Month | Infrastructure Needs |
| ------------------- | ----------------- | ------------------- | -------------------- |
| MoveNet (browser)   | Unknown           | $0                  | None                 |
| Cloud Vision API    | Unknown           | ~$50                | API integration      |
| MMPose (GPU server) | 90%+              | ~$3-5               | Shared GPU server    |
| Interval snapshots  | Depends on model  | ~$5                 | Minimal server       |

The target is finding something with >80% accuracy for under $10 per user per month.

---

## Next Steps

The plan is structured to find the cheapest effective solution:

1. **Week 1: Google Models** - Test MoveNet, BlazePose variants, and MediaPipe server-side. These are the quickest to evaluate.

2. **Week 2: Cost Analysis** - For each promising model, calculate real costs including infrastructure, API calls, and maintenance.

3. **Week 3: Advanced Models** - If needed, test MMPose and OpenPose with GPU requirements.

4. **Final Deliverable** - A comparison matrix showing accuracy, cost, latency, and deployment complexity for each option, with top 3 recommendations.

---

## Questions for Discussion

Before I proceed with testing, it would help to know:

- What accuracy level would you consider acceptable for clinical use?
- What's the maximum acceptable cost per user?
- Are there privacy concerns about server-side processing?
- Would periodic checks (every minute) be acceptable vs real-time?
- What scale are we planning for (affects infrastructure decisions)?

---

## Additional Resources

I've documented the detailed research in separate files:

- [Comprehensive Research Plan](./research-plan.md) - Analysis of all alternatives
- [Academic Research Findings](./deep-research-2025-08-07.md) - What the literature says about posture detection
- [Off-the-Shelf Solutions Research](./perplexity-off-the-shelf-2025-08-08.md) - State-of-the-art posture detection landscape (2024-2025)
