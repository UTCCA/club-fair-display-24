#include <WiFi.h>
#include <HTTPClient.h>
#include <config.h>
#include "inputFunctions.h"

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

void setup() {

  Serial.begin(115200);
  while (!Serial) delay(10); 

  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) {
      delay(10);
    }
  }
  Serial.println("MPU6050 Found!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);

  mpu.setGyroRange(MPU6050_RANGE_500_DEG);

  mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);

  // Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");

  // pinMode(POTENTIOMETER_PIN, INPUT);
  
  pinMode(BUTTON_PIN_J, INPUT);
  pinMode(BUTTON_PIN_R, INPUT);
  pinMode(BUTTON_PIN_U, INPUT);
  pinMode(BUTTON_PIN_D, INPUT);
  pinMode(BUTTON_PIN_L, INPUT);
  pinMode(BUTTON_PIN_J, INPUT);
}

void loop() {

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // meters per second squared
  // Serial.print(a.acceleration.x);
  // Serial.print(a.acceleration.y);
  // Serial.print(a.acceleration.z);

  // radians per second
  // Serial.print(g.gyro.x);
  // Serial.print(g.gyro.y);
  // Serial.print(g.gyro.z);

  int buttonJValue = check_button_press_j();
  int buttonRValue = check_button_press_r();
  int buttonUValue = check_button_press_u();
  int buttonDValue = check_button_press_d();
  int buttonLValue = check_button_press_l();
  int potentiometerValue = read_potentiometer();

  String inputValues = String(buttonJValue) 
  +'c'+ String(buttonRValue) 
  +'c'+ String(buttonUValue) 
  +'c'+ String(buttonDValue) 
  +'c'+ String(buttonLValue) 
  +'c'+ String(potentiometerValue) 
  +'c'+ String(a.acceleration.x)
  +'c'+ String(a.acceleration.y)
  +'c'+ String(a.acceleration.z)
  +'c'+ String(g.gyro.x)
  +'c'+ String(g.gyro.y)
  +'c'+ String(g.gyro.z);

  Serial.println(inputValues);
  sendHTTPrequest(inputValues);

}
