#include "config.h"
#include "my_wifi.h"
#include "wifi_communicator.h"

#include <MyButton.h>

#define ENABLE_DEBUG /* <-- Commenting this line will remove any trace of debug printing */
#include <MacroDebugger.h>

// Button object to simulate input events
MyButton my_btn(BTN_PIN, NORMAL_DOWN, 50);

// Communication messages
char incoming_msg[MAX_BUFFER_LEN] = {0};
char response[MAX_BUFFER_LEN] = {0};

//Declare pin assignments
int potentiometer_pin = 36;


//debouncing variables
unsigned long last_debounce_time_1 = 0;
unsigned long last_debounce_time_2 = 0;
unsigned long last_debounce_time_3 = 0;
const unsigned long debounce_delay = 50; // debounce time in ms 




/* A collection of random responses to send when the button is clicked */
#define NUM_RANDOM_RESPONSES    10
char *responses[NUM_RANDOM_RESPONSES] = {
  "hola!",
  "hiii",
  "potato",
  "arduino",
  "esp32",
  "okay so we get it it's a random message!",
  "so what?",
  "running out of messages here",
  "okay two more to go",
  "finally ..."
};

void setup(){
  DEBUG_BEGIN();
  
  setup_wifi();
  
  setup_wifi_communicator();

  pinMode(LED_PIN, OUTPUT);

  DEBUG_I("Done setting up!");

    // Start the serial communication at a baud rate of 115200
  Serial.begin(115200);

  // Wait for the serial communication to initialize
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // Print a message to the serial monitor
  Serial.println("Hello from ESP32! iasdfasdfasdf");
}

void loop(){
  

  // if we lost connection, we attempt to reconnect (blocking)
  if(!is_client_connected()){ connect_client(); }
  
  bool received = get_message(incoming_msg);

  if(received){
    DEBUG_I("Received: %s", incoming_msg);
    uint8_t start = 0;

    if(incoming_msg[0] == 'A'){
      sprintf(response, "%s", ACK);
      start++;
    }

    //switch the number and do the appropriate action
    switch(incoming_msg[start]){
      case 'f':
        //call motor forward function
        digitalWrite(LED_PIN, HIGH);
        break;
      default:
      case 'n':
        digitalWrite(LED_PIN, LOW);
        break;
    }

    // If start is bigger than 0, then we have to acknowledge the reception
    if(start > 0){
      send_message(response);
      // Clear the response buffer
      memset(response, 0, MAX_BUFFER_LEN);
    }
    
  }
 
  send_message("george");
  delay(5000);



  if(my_btn.readRisingClick()){
    // Choose a random response to send back
    uint8_t idx = random(NUM_RANDOM_RESPONSES);
    strncpy(response, responses[idx], MAX_BUFFER_LEN);
    send_message(response);
    memset(response, 0, MAX_BUFFER_LEN);
    DEBUG_I("Sent: %s", responses[idx]);
  }

}

void read_potentiometer(){
  //read the value of the potentiometer
  int potentiometer_value = analogRead(potentiometer_pin);
  //map the value to the range of 0-255
  int mapped_value = map(potentiometer_value, 0, 4095, 0, 255);
  //send the value to python
  send_message("hello");
}

//button 1 is pressed
void button_press_1(){

  if(debounce_check(last_debounce_time_1)){
    //send message to python
    send_message("f");
    last_debounce_time_1 = millis();
  }
}

//button 2 is pressed
void button_press_2(){

  if(debounce_check(last_debounce_time_2)){
    //send message to python
    send_message("b");
    last_debounce_time_2 = millis();
  }
}

//button 3 is pressed
void button_press_3(){

  if(debounce_check(last_debounce_time_3)){
    //send message to python
    send_message("n");
    last_debounce_time_3 = millis();
  }
}

//function to check if debounceed
bool debounce_check(unsigned long last_debounce_time){
  unsigned long current_time = millis();
  if((current_time - last_debounce_time) > debounce_delay){
    return true;
  }
  else{
    return false;
  }
}