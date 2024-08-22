#include <WiFi.h>
#include <HTTPClient.h>
#include <config.h>
#include <inputFunctions.h>

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
 


}

void loop() {
  
  int button1Value = check_button_press_1();
  int button2Value = check_button_press_2();
  int button3Value = check_button_press_3();
  int potentiometerValue = read_potentiometer();
  String inputValues = String(button1Value) + String(button2Value) + String(button3Value) + String(potentiometerValue);
  Serial.println(inputValues);
  sendHTTPrequest(inputValues);


}
