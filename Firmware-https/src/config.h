#ifndef CONFIG_H
#define CONFIG_H


/* WiFi params */
#define WIFI_SSID                   ""
#define WIFI_PASSWORD               ""



#define SERVER_ADDRESS ""


// Declare pin assignments
#define POTENTIOMETER_PIN 35
#define BUTTON_PIN_J      18
#define BUTTON_PIN_R      19
#define BUTTON_PIN_U      23
#define BUTTON_PIN_D      32
#define BUTTON_PIN_L      34




// Debouncing variables
extern unsigned long last_debounce_time_j;
extern unsigned long last_debounce_time_r;
extern unsigned long last_debounce_time_u;
extern unsigned long last_debounce_time_d;
extern unsigned long last_debounce_time_l;

const unsigned long debounce_delay = 50; // debounce time in ms

#endif // CONFIG_H
