# Posture Detection POC: Progress Report

**Meeting Date:** August 5, 2025
**Client:** Dr. Deb Roy

---

## POC Goal

The goal was straightforward: build a system that can tell when someone has bad posture while working at their desk. We wanted something accurate, affordable, and privacy-conscious that could run in a web browser.

---

## Progress

### First Attempt: PoseNet ❌

Started with TensorFlow's PoseNet since it was the most popular pose detection model. Turned out to be a dead end:

- Only 17 landmarks (not enough detail for posture)
- No 3D coordinate support
- Poor accuracy on subtle posture changes
- TensorFlow deprecated it in favor of MoveNet

### Second Attempt: ElectronJS Desktop App ❓

Initially I had marked down the bad accuracy, particularly in the shoulders to the camera in PWA.

I switched over to using ElectronJS, which is a popular cross-platform desktop framework.

- The camera wasn't the issue for accuracy (see next section)
- ElectronJS does allow us to run the application in the Tray (hidden) so it will probably be the ultimate release platform

### Current Attempt: MediaPipe Web ❓

Switched to Google's MediaPipe (I had switched to MediaPipe within the Electron App), which seemed promising with 33 body landmarks plus face detection. Built an extensive system with:

- 8 different posture checks
- Craniovertebral angle calculations for forward head detection
- Temporal smoothing over 5 frames
- Shoulder width normalization

**The result?** Unknown but likely a failure - still only ~60% accuracy. The system often thinks good posture is bad and sometimes rates bad posture as better than good.

### What I Discovered

After extensive testing and analysis, I found the core issue: MediaPipe places shoulder landmarks near where it thinks the shoulder joint is.
With my testing, I've found the placement of the landmarks to be inaccurate. It generally looks like the placement is just outside the armpits (at least for me).
Which would make sense in what the AI model is trained for: Tracking human poses and movement.

Also, when you turn sideways it can still track the shoulder joints, arm angles and back angles (if available) but it's not accurate.

**Test results that show the problem:**

Taken from local Unit Tests:

- Good posture (side view) → 62% confidence
- Bad posture (side view) → 75% confidence (higher than good!)
- Elbow width measuring wider than shoulders (physically impossible)

---

## Where We Go From Here

### MediaPipe-Based Apps to Investigate

Before moving on to other models, there are two MediaPipe-based applications that might be worth investigating further if the client wants:

- **[OFP](https://github.com/jimothytries/OFP)** - A hobby app using MediaPipe for posture detection
- **[PostureScreen](https://www.postureanalysis.com/posturescreen-posture-movement-body-composition-analysis-assessment/)** - A commercial posture analysis application

Most apps I've seen using pose detection use a side-on camera view, and the results don't look particularly accurate, but these two might offer insights into how others have approached the problem.

**Initial findings from PostureScreen investigation:**

- Side-view camera, while not great, could be an option for detecting back angles
- Using face landmarks to determine which way the face is pointing, in conjunction with other pose landmarks, could help determine if the user is looking down/up rather than straight ahead - potentially useful for approximating slouch

### Further Research Into Other Models

I've conducted additional research into off-the-shelf posture detection solutions (see [Research Summary](./perplexity-off-the-shelf-2025-08-08.md)). Key findings include:

- **SitPose (2024):** Achieving 98.1% F1 score using ensemble learning with Azure Kinect depth camera (not viable)
- **YOLOv5 Sitting Posture Detection:** Open-source real-time lateral posture detection from webcam streams (needs more research)
- **Edge AI deployment:** Using Jetson Nano or Coral TPU for local, privacy-preserving inference (needs more research)

Based on my research, here's the planned testing sequence:

### Phase 1: Final test on MediaPipe as solution

I'll investigate further PostureScreen and the open source Python app to determine if there are more algorithms that can be used.

Update algorithm to calculate Face angle (Normal Vector?) and see if we can use that in conjunction with back angle and shoulder to should angle to determine bad posture.

### Phase 2: Advanced Open-Source Models

If that doesn't work:

- **Hugging Face Posture Detection Models** - Investigating [postureDetection](https://huggingface.co/ronka/postureDetection/tree/main) which has extensive training data and potential for fine-tuning
- **MMPose** - Current state-of-the-art, needs GPU server
- **OpenPose** - CMU's battle-tested solution
- **ViTPose** - Latest vision transformer approach

---

## Additional Resources

I've documented the detailed research in separate files:

- [Comprehensive Research Plan](./research-plan.md) - Analysis of all alternatives
- [AI Research Findings](./deep-research-2025-08-07.md) - Configuring an AI Agent to research and find alternatives.
- [Off-the-Shelf Solutions Research](./perplexity-off-the-shelf-2025-08-08.md) - State-of-the-art posture detection landscape (2024-2025)
