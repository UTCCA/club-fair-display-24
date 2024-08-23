#include "inputFunctions.h"
#include <HTTPClient.h>

// Global debounce times
unsigned long last_debounce_time_1 = 0;
unsigned long last_debounce_time_2 = 0;
unsigned long last_debounce_time_3 = 0;


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
  int pressed = digitalRead(BUTTON_PIN_1);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_1))
    {
      last_debounce_time_1 = millis();
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
  int pressed = digitalRead(BUTTON_PIN_2);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_2))
    {
      last_debounce_time_2 = millis();
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
  int pressed = digitalRead(BUTTON_PIN_3);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_3))
    {
      last_debounce_time_3 = millis();
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
  int pressed = digitalRead(BUTTON_PIN_4);
  if(pressed == HIGH)
  {
    if(debounce_check(last_debounce_time_4))
    {
      last_debounce_time_4 = millis();
      return 1;
    }
  }
  else
  {
    return 0;
  }
}



