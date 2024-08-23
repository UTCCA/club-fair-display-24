#include "inputFunctions.h"
#include <HTTPClient.h>

// Global debounce times
unsigned long last_debounce_time_j = 0;
unsigned long last_debounce_time_r = 0;
unsigned long last_debounce_time_u = 0;
unsigned long last_debounce_time_d = 0;
unsigned long last_debounce_time_l = 0;



bool debounce_check(unsigned long last_debounce_time)
{
    unsigned long current_time = millis();
    return (current_time - last_debounce_time) > debounce_delay;
}

void sendHTTPrequest(String value)
{
    String url = String(SERVER_ADDRESS) + "?value=" + value;
    HTTPClient http;
    http.begin(url);
    int httpResponseCode = http.GET();
    if (httpResponseCode > 0) 
    {
        String response = http.getString();
        Serial.println(response);
    } 
    else 
    {
        Serial.print("Error on sending GET: ");
        Serial.println(httpResponseCode);
    }
    http.end();
}



int read_potentiometer() 
{
    int potentiometer_value = analogRead(POTENTIOMETER_PIN);
    int mapped_value = map(potentiometer_value, 0, 4095, 100, 999);
    return mapped_value;
    // Prepare the server URL with the potentiometer value as a query parameter
    
}

int check_button_press_j()
{
  int pressed = digitalRead(BUTTON_PIN_J);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_j))
    {
      last_debounce_time_j = millis();
      return 1;
    }
  }
  else
  {
    return 0;
  }
 
}

int check_button_press_r()
{
  int pressed = digitalRead(BUTTON_PIN_R);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_r))
    {
      last_debounce_time_r = millis();
      return 1;
    }
  }
  else
  {
    return 0;
  }
 
}

int check_button_press_u()
{
  int pressed = digitalRead(BUTTON_PIN_U);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_u))
    {
      last_debounce_time_u = millis();
      return 1;
    }
  }
  else
  {
    return 0;
  }
}

int check_button_press_d()
{
  int pressed = digitalRead(BUTTON_PIN_D);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_d))
    {
      last_debounce_time_d = millis();
      return 1;
    }
  }
  else
  {
    return 0;
  }
}

int check_button_press_l()
{
  int pressed = digitalRead(BUTTON_PIN_L);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_l))
    {
      last_debounce_time_l = millis();
      return 1;
    }
  }
  else
  {
    return 0;
  }
}



