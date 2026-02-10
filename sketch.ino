#include <Servo.h>

Servo servoX; // Pin 9
Servo servoY; // Pin 6

int angleX = 90; // Départ au centre
int angleY = 90;

void setup() {
  Serial.begin(115200);
  servoX.attach(9);
  servoY.attach(6);
  
  // Position initiale
  servoX.write(angleX);
  servoY.write(angleY);
}

void loop() {
  if (Serial.available() > 0) {
    // Lecture des écarts envoyés par le JS (ex: "-5,2")
    int deltaX = Serial.parseInt();
    int deltaY = Serial.parseInt();
    
    if (Serial.read() == '\n') {
      // Mise à jour des angles avec une vitesse modérée
      angleX = constrain(angleX - deltaX, 0, 180);
      angleY = constrain(angleY + deltaY, 0, 180);
      
      servoX.write(angleX);
      servoY.write(angleY);
    }
  }
}
