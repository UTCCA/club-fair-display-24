from flask import Flask, request, render_template, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import time

import asyncio
from bleak import BleakScanner, BleakClient

import serial
from threading import Thread, Event

use_bluetooth = True

stop_event = Event()

app = Flask(__name__)
CORS(app)

if not use_bluetooth: 
    ser = serial.Serial('/dev/cu.usbserial-0001', 115200, timeout=1)
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
else: 
    ser = None
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

controller_state = {
    "forward": False,
    "backward": False,
    "left": False,
    "right": False,
    "jump": False,
    "potentiometer": 0,
    "accelerometer": {'x': 0, 'y': 0, 'z': 0},
    "gyroscope": {'x': 0, 'y': 0, 'z': 0}
}

fe_sid = []

def parse_values(values):
    controller_state['jump'] = True if values[0] == '1' else False
    controller_state['forward'] = True if values[1] == '1' else False
    controller_state['backward'] = True if values[2] == '1' else False
    controller_state['left'] = True if values[3] == '1' else False
    controller_state['right'] = True if values[4] == '1' else False
    controller_state['potentiometer'] = float(values[5])
    controller_state['accelerometer']['x'] = float(values[6])
    controller_state['accelerometer']['y'] = float(values[7])
    controller_state['accelerometer']['z'] = float(values[8])
    controller_state['gyroscope']['x'] = float(values[9])
    controller_state['gyroscope']['y'] = float(values[10])
    controller_state['gyroscope']['z'] = float(values[11])

async def read_bt():

    address = "xx:xx:xx:xx:xx:xx"
    CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"

    attempts = 0
    while address == "xx:xx:xx:xx:xx:xx" and attempts < 10:
        devices = await BleakScanner.discover()
        for device in devices:
            if device.name == "ESP32_BLE":
                address = device.address
                break
        attempts += 1

        print(address)
    if attempts == 10:
        print("ESP32 not found. Defaulting to last known address.")
        address = "314E3752-BF27-327F-C726-EDA064ED2E9F"

    with app.app_context():
        async with BleakClient(address) as client:
            
            # Check if connected
            while not stop_event.is_set():

                if client.is_connected:
                    # print(f"Connected to {address}")

                    # # Read the current value of the characteristic
                    # value = client.read_gatt_char(CHARACTERISTIC_UUID)
                    # print(f"Current value: {value.decode('utf-8')}")

                    # # Confirm the value has been written
                    # new_value = client.read_gatt_char(CHARACTERISTIC_UUID)
                    # print(f"New value: {new_value.decode('utf-8')}")

                    values = await client.read_gatt_char(CHARACTERISTIC_UUID)
                    try: values = str(values.decode('utf-8')).rstrip().replace('s','').replace('e','').split('c')
                    except: continue
                    # try:
                        
                    # except: continue
                    if len(values) == 12:
                        print(f"Received value: {values}")
                        parse_values(values)

                        try:
                            emit('controller_state', controller_state, namespace='/', broadcast=True)
                        except Exception as e: 
                            print(e)
                    else: print(values)

                else:
                    print("Failed to connect")

    print("SS")

def init_bt_async():
    loop = asyncio.new_event_loop()  # Create a new event loop
    asyncio.set_event_loop(loop)  # Set it as the current event loop for the thread
    loop.run_until_complete(read_bt())

def read_serial():

    global controller_state
    
    with app.app_context():
        while not stop_event.is_set():
            if ser.in_waiting > 0:
                values = []
                try:
                    values = ser.readline().decode('utf-8').rstrip().replace('s','').replace('e','').split('c')
                except: continue
                if len(values) == 12:
                    print(f"Received value: {values}")
                    parse_values(values)

                    try:
                        emit('controller_state', controller_state, namespace='/', broadcast=True)
                    except Exception as e: 
                        print(e)
                else: print(values)
            else: print(ser)


@socketio.on('connect')
def handle_connect():
    fe_sid.append(request.sid)
    print("Client connected")
    emit('controller_state', controller_state)

@socketio.on('disconnect')
def handle_disconnect():
    fe_sid.remove(request.sid)
    print("Client disconnected")

@socketio.on('message')
def handle_message(data):
    print("Received message: " + data)
    global controller_state
    values = data.split('c')
    if len(values) == 12:
        print(f"Received value: {values}")
        parse_values(values)

        emit('controller_state', controller_state)
    else:
        emit('error', {'message': 'Invalid request'})

@app.route('/postControllerState', methods=['GET'])
def handle_post_values():
    global controller_state
    values = request.args.get('value').replace('s','').replace('e','').split('c')
    if len(values) == 12:
        print(f"Received value: {values}")
        parse_values(values)

        try:
            request.sid = fe_sid[0]
            emit('controller_state', controller_state, namespace='/')
        except: None

        return f"Values received.", 200
    else:
        return "Invalid request", 400
if __name__ == '__main__':

    if use_bluetooth: serial_thread = Thread(target=init_bt_async)
    else: serial_thread = Thread(target=read_serial)
    serial_thread.start()
    
    try:
        socketio.run(app, host='0.0.0.0', port=8080, use_reloader=False)

    finally:
        stop_event.set()
        serial_thread.join()
        if ser: ser.close()
