const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusMsg = document.getElementById('statusMsg');
const spanTX = document.getElementById('targetX');
const spanTY = document.getElementById('targetY');
const spanDX = document.getElementById('diffX');
const spanDY = document.getElementById('diffY');

let port;

const faceDetection = new FaceDetection({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
});

faceDetection.setOptions({
  model: 'short',
  minDetectionConfidence: 0.6
});

async function onResults(results) {
  canvasCtx.save();
  
  // Rendu clean : on dessine l'image sur toute la surface définie (640x480)
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Centre de l'écran (Bleu)
  const centerX = 320;
  const centerY = 240;
  canvasCtx.strokeStyle = "blue";
  canvasCtx.lineWidth = 2;
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
  canvasCtx.stroke();

  if (results.detections.length > 0) {
    const face = results.detections[0].boundingBox;
    
    // Calcul de la cible : X centre, Y légèrement plus haut (front)
    const targetX = Math.round(face.xCenter * 640);
    const targetY = Math.round((face.yCenter * 480)-(480 * 0.6));

    // Dessin cible front (Rouge)
    canvasCtx.strokeStyle = "red";
    canvasCtx.beginPath();
    canvasCtx.arc(targetX, targetY, 8, 0, 2 * Math.PI);
    canvasCtx.stroke();

    // Mise à jour interface
    statusMsg.innerText = "CIBLE ACQUISE";
    statusMsg.className = "status acquired";
    
    const diffX = targetX - centerX;
    const diffY = targetY - centerY;

    spanTX.innerText = targetX;
    spanTY.innerText = targetY;
    spanDX.innerText = diffX;
    spanDY.innerText = diffY;

    // Envoi à l'Arduino (on réduit l'amplitude pour la fluidité)
    sendToArduino(Math.round(diffX / 90), Math.round(diffY / 200));
  } else {
    statusMsg.innerText = "PAS DE CIBLE";
    statusMsg.className = "status lost";
  }
  canvasCtx.restore();
}

async function sendToArduino(x, y) {
  if (port && port.writable) {
    const writer = port.writable.getWriter();
    const data = new TextEncoder().encode(`${x},${y}\n`);
    await writer.write(data);
    writer.releaseLock();
  }
}

document.getElementById('connectBtn').onclick = async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    alert("Arduino Connecté");
  } catch (e) {
    console.error("Erreur de connexion", e);
  }
};

const camera = new Camera(document.createElement('video'), {
  onFrame: async () => {
    await faceDetection.send({image: camera.video});
  },
  width: 640,
  height: 480
});

camera.start();
faceDetection.onResults(onResults);
