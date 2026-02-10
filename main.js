const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusMsg = document.getElementById('statusMsg');
let port;

// Initialisation MediaPipe
const faceDetection = new FaceDetection({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
});

faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });

async function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, 640, 480);
  canvasCtx.drawImage(results.image, 0, 0, 640, 480);

  // Dessin du centre de l'image (Bleu)
  canvasCtx.strokeStyle = "blue";
  canvasCtx.beginPath();
  canvasCtx.arc(320, 240, 5, 0, 2 * Math.PI);
  canvasCtx.stroke();

  if (results.detections.length > 0) {
    const face = results.detections[0].boundingBox;
    // Estimation du milieu du front
    const targetX = (face.xCenter * 640);
    const targetY = (face.yCenter * 480) - (face.height * 480 * 0.2); // Remonte vers le front

    // Dessin cible (Rouge)
    canvasCtx.strokeStyle = "red";
    canvasCtx.beginPath();
    canvasCtx.arc(targetX, targetY, 8, 0, 2 * Math.PI);
    canvasCtx.stroke();

    statusMsg.innerText = "CIBLE ACQUISE";
    statusMsg.className = "status acquired";

    // Calcul des écarts pour l'Arduino (facteur de sensibilité de 1 à 2)
    const diffX = Math.round((targetX - 320) / 40);
    const diffY = Math.round((targetY - 240) / 40);

    sendToArduino(diffX, diffY);
  } else {
    statusMsg.innerText = "PAS DE CIBLE";
    statusMsg.className = "status lost";
  }
  canvasCtx.restore();
}

// Communication Web Serial
async function sendToArduino(x, y) {
  if (port && port.writable) {
    const writer = port.writable.getWriter();
    const data = new TextEncoder().encode(`${x},${y}\n`);
    await writer.write(data);
    writer.releaseLock();
  }
}

document.getElementById('connectBtn').onclick = async () => {
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });
};

const camera = new Camera(document.createElement('video'), {
  onFrame: async () => { await faceDetection.send({image: camera.video}); },
  width: 640, height: 480
});
camera.start();
faceDetection.onResults(onResults);
