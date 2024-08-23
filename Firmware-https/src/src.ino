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
  
  pinMode(BUTTON_PIN_J, INPUT_PULLUP);
  pinMode(BUTTON_PIN_R, INPUT_PULLUP);
  pinMode(BUTTON_PIN_U, INPUT_PULLUP);
  pinMode(BUTTON_PIN_D, INPUT_PULLUP);
  pinMode(BUTTON_PIN_L, INPUT_PULLUP);
}

void loop() {
  int buttonJValue = check_button_press_j();
  int buttonRValue = check_button_press_r();
  int buttonUValue = check_button_press_u();
  int buttonDValue = check_button_press_d();
  int buttonLValue = check_button_press_l();
  int potentiometerValue = read_potentiometer();
  String inputValues = String(buttonRValue) +'c'+ String(buttonUValue) +'c'+ String(buttonDValue) +'c'+ String(buttonLValue) +'c'+ String(potentiometerValue);
  Serial.println(inputValues);
  sendHTTPrequest(inputValues);

}
