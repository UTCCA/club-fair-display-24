#ifndef INPUT_FUNCTIONS_H
#define INPUT_FUNCTIONS_H

#include "config.h"
#include <Arduino.h>


// Function declarations
int read_potentiometer();
int check_button_press_1();
int check_button_press_2();
int check_button_press_3();
void sendHTTPrequest(String value);
bool debounce_check(unsigned long last_debounce_time);

#endif // INPUT_FUNCTIONS_H
