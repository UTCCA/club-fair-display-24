#ifndef CONFIG_H
#define CONFIG_H


/* WiFi params */
#define WIFI_SSID                   ""
#define WIFI_PASSWORD               ""



#define SERVER_ADDRESS ""


// Declare pin assignments
#define POTENTIOMETER_PIN 36
#define BUTTON_PIN_1      19
#define BUTTON_PIN_2      21
#define BUTTON_PIN_3      22
#define BUTTON_PIN_4      23


// Debouncing variables
extern unsigned long last_debounce_time_1;
extern unsigned long last_debounce_time_2;
extern unsigned long last_debounce_time_3;
extern unsigned long last_debounce_time_4;

const unsigned long debounce_delay = 50; // debounce time in ms

#endif // CONFIG_H
