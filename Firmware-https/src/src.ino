#include <WiFi.h>
#include <HTTPClient.h>
#include <config.h>
#include "inputFunctions.h"

// #include "BluetoothSerial.h"

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

BLECharacteristic *pCharacteristic;
std::string receivedValue;

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        receivedValue = pCharacteristic->getValue();
        if (receivedValue.length() > 0) {
            Serial.print("Received Value: ");
            Serial.println(receivedValue.c_str());
        }
    }
};

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to enable it
#endif

std::string inputValues;
Adafruit_MPU6050 mpu;
// BluetoothSerial SerialBT;

void bleInit() {

  // Initialize BLE
  BLEDevice::init("ESP32_BLE");

  // Create BLE Server
  BLEServer *pServer = BLEDevice::createServer();

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE
                    );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->setValue("x");

  // Start the service
  pService->start();

  // Start advertising
  pServer->getAdvertising()->start();
  // Serial.println("Waiting for a client connection...");
}

void setup() {

  Serial.begin(115200);
  while (!Serial) delay(10); 

  // SerialBT.begin("UTCCA PAC");
  if (USE_BT) {
    bleInit();
    Serial.println("The device started, now you can pair it with bluetooth!");
  }

  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) delay(10);
  }
  Serial.println("MPU6050 Found!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);

  if (USE_WIFI == 1){
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
      delay(1000);
      Serial.println("Connecting to WiFi...");
    }

    Serial.println("Connected to WiFi");
  }
  
  pinMode(BUTTON_PIN_J, INPUT);
  pinMode(BUTTON_PIN_R, INPUT);
  pinMode(BUTTON_PIN_U, INPUT);
  pinMode(BUTTON_PIN_D, INPUT);
  pinMode(BUTTON_PIN_L, INPUT);
  pinMode(BUTTON_PIN_J, INPUT);
  pinMode(INTERNAL_LED, OUTPUT);
}

void loop() {

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  int buttonJValue = check_button_press_j();
  int buttonRValue = check_button_press_r();
  int buttonUValue = check_button_press_u();
  int buttonDValue = check_button_press_d();
  int buttonLValue = check_button_press_l();
  int potentiometerValue = read_potentiometer();

  inputValues = 
  's'+ std::to_string(buttonJValue) 
  +'c'+ std::to_string(buttonRValue) 
  +'c'+ std::to_string(buttonUValue) 
  +'c'+ std::to_string(buttonDValue) 
  +'c'+ std::to_string(buttonLValue) 
  +'c'+ std::to_string(potentiometerValue) 
  +'c'+ std::to_string(a.acceleration.x)
  +'c'+ std::to_string(a.acceleration.y)
  +'c'+ std::to_string(a.acceleration.z)
  +'c'+ std::to_string(g.gyro.x)
  +'c'+ std::to_string(g.gyro.y)
  +'c'+ std::to_string(g.gyro.z)+'e';

  String inpV = 
  's'+ String(buttonJValue) 
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
  +'c'+ String(g.gyro.z)+'e';

  if(USE_BT == 1){
    // digitalWrite(INTERNAL_LED, HIGH);
    pCharacteristic->setValue(inputValues);

    // uint8_t buf[inputValues.length() + 1];

    // // Copy the contents of charPtr to uint8Array
    // for (size_t i = 0; i <= inputValues.length(); ++i) {
    //     buf[i] = static_cast<uint8_t>(inputValues.c_str()[i]);
    // }
    // SerialBT.write(buf, inputValues.length() + 1);
    // Serial.println(buf[0]);
    Serial.println(inpV);

  } //else digitalWrite(INTERNAL_LED, LOW);
  else {
    Serial.println(inpV);
  }

  if(USE_WIFI == 1){
    sendHTTPrequest(inpV);
  }
  delay(10);

}
