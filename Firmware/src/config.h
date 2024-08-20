

#ifndef __CONFG_H___
#define __CONFG_H___

/* Pins definitions */
#define LED_PIN                     2
#define BTN_PIN                     25
#define BUTTON_PIN_1                21
#define BUTTON_PIN_2                22
#define BUTTON_PIN_3                23
#define POTENTIOMETER_              36




/* Communication params */
#define ACK                         "A" // acknowledgment packet
#define QUEUE_LEN                   5
#define MAX_BUFFER_LEN              128

/* WiFi params */
#define WIFI_SSID                   "put wifi name here"
#define WIFI_PASSWORD               "put wifi password here"

/* Socket */
#define SERVER_ADDRESS              "192.168.1.245"
#define SERVER_PORT                 11111

#endif // __CONFG_H___
