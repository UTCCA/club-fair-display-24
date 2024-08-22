#ifndef CONFIG_H
#define CONFIG_H


/* WiFi params */
#define WIFI_SSID                   "Qymlw1"
#define WIFI_PASSWORD               "Eversyde3353"



#define SERVER_ADDRESS "http://192.168.1.245:8001/inputValues"


// Declare pin assignments
#define POTENTIOMETER_PIN 36
#define BUTTON_PIN_1      21
#define BUTTON_PIN_2      22
#define BUTTON_PIN_3      23


// Debouncing variables
extern unsigned long last_debounce_time_1;
extern unsigned long last_debounce_time_2;
extern unsigned long last_debounce_time_3;
const unsigned long debounce_delay = 50; // debounce time in ms

#endif // CONFIG_H
