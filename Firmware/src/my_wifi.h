
#ifndef __MY_WIFI__
#define __MY_WIFI__

#include <WiFi.h>
#include "config.h"

bool is_wifi_connected(){
  return (WiFi.status() == WL_CONNECTED);
}

/*
  Attempt connection once
*/
static bool connect_wifi_once(){
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  return (WiFi.status() == WL_CONNECTED);
}

/*
  Task to keep on trying to connect to the WiFi forever, then die once connected
*/
static void connect_to_wifi(void*){
  if(!connect_wifi_once())
    while(!is_wifi_connected()){ delay(500); }
  // No longer need this task
  vTaskDelete(NULL);
}

/*
  Non-blocking way of connecting to the WiFi network
*/
void setup_wifi(){
  xTaskCreatePinnedToCore(connect_to_wifi, "WiFiTask", 10240, NULL, 3, NULL, 0);
  delay(10);
}

#endif // __MY_WIFI__
