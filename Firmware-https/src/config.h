#ifndef CONFIG_H
#define CONFIG_H


/* WiFi params */
#define WIFI_SSID                   ""
#define WIFI_PASSWORD               ""



#define SERVER_ADDRESS ""


// Declare pin assignments
#define POTENTIOMETER_PIN 36
#define BUTTON_PIN_J      18
#define BUTTON_PIN_R      19
#define BUTTON_PIN_U      21
#define BUTTON_PIN_D      22
#define BUTTON_PIN_L      23




// Debouncing variables
extern unsigned long last_debounce_time_J;
extern unsigned long last_debounce_time_R;
extern unsigned long last_debounce_time_U;
extern unsigned long last_debounce_time_D;
extern unsigned long last_debounce_time_L;

const unsigned long debounce_delay = 50; // debounce time in ms

#endif // CONFIG_H
