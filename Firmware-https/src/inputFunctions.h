#ifndef INPUT_FUNCTIONS_H
#define INPUT_FUNCTIONS_H

#include "config.h"
#include <Arduino.h>


// Function declarations
int read_potentiometer();
int check_button_press_j();
int check_button_press_r();
int check_button_press_u();
int check_button_press_d();
int check_button_press_l();

void sendHTTPrequest(String value);
bool debounce_check(unsigned long last_debounce_time);

#endif // INPUT_FUNCTIONS_H
