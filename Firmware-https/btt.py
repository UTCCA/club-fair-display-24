import objc
import Foundation
import AppKit
import IOBluetooth
from PyObjCTools import AppHelper

class BluetoothDelegate(Foundation.NSObject):
    def initWithCallback_(self, callback):
        self = objc.super(BluetoothDelegate, self).init()
        if self is None: return None
        self.callback = callback
        self.buffer = b""
        return self
    
    def rfcommChannelData_data_length_(self, channel, data, length):
        print("data")
        # bytes_read = data.bytes().tobytes()
        # self.buffer += bytes_read
        # while b'\n' in self.buffer:
        #     line, self.buffer = self.buffer.split(b'\n', 1)
        #     self.callback(line)

def connect_bluetooth(device_name, callback):
    devices = IOBluetooth.IOBluetoothDevice.pairedDevices()
    device = next((d for d in devices if d.name() == device_name), None)
    
    if device is None:
        print(f"Could not find paired device with name '{device_name}'")
        return None

    delegate = BluetoothDelegate.alloc().initWithCallback_(callback)
    
    result, channel = device.openRFCOMMChannelSync_withChannelID_delegate_(None, 1, delegate)
    
    if result != 0:
        print(f"Failed to open RFCOMM channel. Error code: {result}")
        return None

    print(f"Successfully opened RFCOMM channel: {channel}")
    return channel

def data_callback(data):
    try:
        decoded = data.decode('utf-8')
        if decoded.startswith('s') and decoded.endswith('e'):
            values = decoded[1:-1].split('c')
            button_j, button_r, button_u, button_d, button_l, potentiometer, accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z = values
            print(f"Received data:")
            print(f"Buttons: J={button_j}, R={button_r}, U={button_u}, D={button_d}, L={button_l}")
            print(f"Potentiometer: {potentiometer}")
            print(f"Accelerometer: X={accel_x}, Y={accel_y}, Z={accel_z}")
            print(f"Gyroscope: X={gyro_x}, Y={gyro_y}, Z={gyro_z}")
        else:
            print(f"Received unknown data: {decoded}")
    except Exception as e:
        print(f"Error processing data: {e}")

if __name__ == "__main__":
    device_name = "UTCCA PAC"  # Replace with your ESP32's name
    channel = connect_bluetooth(device_name, data_callback)
    print(channel.isOpen())
    if channel:
        print(f"Connected to {device_name}")
        AppHelper.runConsoleEventLoop()
    else:
        print("Failed to connect")