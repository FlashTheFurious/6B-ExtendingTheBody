//Note to self: adjust the ", can be fine tuned" to optimize the user experience further.

let video;
let poseNet;
let poses = [];
let previousKeypoints = [];
let previousTimestamp = 0;
let motionTrail = [];
const TRAIL_MAX = 30; // Number of afterimages to keep, can be fine tuned

function setup() {
  createCanvas(windowWidth * 0.35, windowHeight * 0.5);
  video = createCapture(VIDEO);
  video.size(width, height);

  poseNet = ml5.poseNet(video, modelReady, { detectionType: "single" });
  poseNet.on("pose", gotPoses);
  //video.hide();
}

function modelReady() {
  console.log("Model Loaded!");
}

function gotPoses(results) {
  console.log(results); // log the results

  poses = results;
  if (poses.length == 0) {
    console.log("No poses detected in this frame.");
    return;
  } else if (!poses[0].pose) {
    console.log("Unexpected structure:", poses);
    return;
  }

  // rest of func
  if (results.length > 0) {
    let currentTimestamp = millis();

    if (currentTimestamp - previousTimestamp > 500) {
      // Check motion twice every second
      let motionMagnitude = calculateMotion(
        previousKeypoints,
        poses[0].pose.keypoints
      );

      if (motionMagnitude > 50) {
        // Arbitrary threshold to detect an abrupt stop, can be fine tuned
        for (let i = 0; i < 5; i++) {
          // Project 5 random-colored silhouettes, can be fine tuned
          motionTrail.push({
            pose: poses[0],
            timestamp: currentTimestamp,
            color: color(random(255), random(255), random(255), 150),
          });
        }
      }

      previousKeypoints = poses[0].pose.keypoints.slice();
      previousTimestamp = currentTimestamp;
    }
  }
}

function calculateMotion(prevKey, currentKey) {
  let motion = 0;
  for (let i = 0; i < prevKey.length; i++) {
    let d = dist(
      prevKey[i].position.x,
      prevKey[i].position.y,
      currentKey[i].position.x,
      currentKey[i].position.y
    );
    motion += d;
  }
  return motion;
}

function draw() {
  background(150);

  // Loop through all detected poses
  for (let i = 0; i < poses.length; i++) {
    // Draw current silhouette with yellow outline
    drawSilhouette(poses[i], color(0), color(255, 255, 0));
  }

  // Draw afterimages and translucent silhouettes
  let currentTimestamp = millis();
  for (let i = motionTrail.length - 1; i >= 0; i--) {
    let t = motionTrail[i];

    if (currentTimestamp - t.timestamp < 4000) {
      // Fade away after 4 seconds
      let alpha = map(currentTimestamp - t.timestamp, 0, 4000, 150, 0);
      let c = t.color.levels;
      c[3] = alpha;
      drawSilhouette(t.pose, color(c));
    } else {
      motionTrail.splice(i, 1);
    }
  }
}

function drawSilhouette(pose, fillColor, strokeColor = false) {
  if (pose && pose.keypoints) {
    fill(fillColor);
    if (strokeColor) {
      stroke(strokeColor);
    } else {
      noStroke();
    }

    // Draw connections between keypoints to form the skeleton
    let skeleton = [
      ["leftShoulder", "rightShoulder"],
      ["leftShoulder", "leftHip"],
      ["rightShoulder", "rightHip"],
      ["leftHip", "rightHip"],
      ["leftShoulder", "leftElbow"],
      ["rightShoulder", "rightElbow"],
      ["leftElbow", "leftHand"],
      ["rightElbow", "rightHand"],
      ["leftHip", "leftKnee"],
      ["rightHip", "rightKnee"],
      ["leftKnee", "leftAnkle"],
      ["rightKnee", "rightAnkle"],
      ["leftShoulder", "leftHand"],
      ["rightShoulder", "rightHand"],
    ];

    for (let i = 0; i < skeleton.length; i++) {
      let a = pose.keypoints.find((kp) => kp.part === skeleton[i][0]).position;
      let b = pose.keypoints.find((kp) => kp.part === skeleton[i][1]).position;
      line(a.x, a.y, b.x, b.y);
    }

    /*  Old Method
    for (let i = 0; i < skeleton.length; i++) {
      let a = pose.keypoints[skeleton[i][0]].position;
      let b = pose.keypoints[skeleton[i][1]].position;
      line(a.x, a.y, b.x, b.y);
    }
    */

    /* testing code
  if (pose && pose.keypoints) {
    // Existing drawing logic
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
    }
  } else {
    console.log("Invalid pose detected:", pose);
  }
  */
  }
}
