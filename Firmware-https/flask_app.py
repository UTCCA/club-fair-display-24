from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

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

@socketio.on('connect')
def handle_connect():
    print("Client connected")
    emit('controller_state', controller_state)

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

@socketio.on('message')
def handle_message(data):
    print("Received message: " + data)
    global controller_state
    values = data.split('c')
    if len(values) == 12:
        print(f"Received value: {values}")
        
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

        emit('controller_state', controller_state)
    else:
        emit('error', {'message': 'Invalid request'})

@app.route('/postControllerState', methods=['GET'])
def handle_post_values():
    global controller_state
    values = request.args.get('value').split('c')
    if len(values) == 12:
        print(f"Received value: {values}")

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

        emit('controller_state', controller_state, namespace='/')

        return f"Values received.", 200
    else:
        return "Invalid request", 400
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080)

# from flask import Flask, request
# from flask_cors import CORS
# import json

# app = Flask(__name__)
# CORS(app)

# # Button states: false means inactive, true means active
# controller_state = {
#     "forward": False,
#     "bakcward": False,
#     "left": False,
#     "right": False,
#     "jump": False,
#     "potentiometer": 0,
#     "accelerometer": {'x': 0, 'y': 0, 'z': 0},
#     "gyroscope": {'x': 0, 'y': 0, 'z': 0}
# }

# @app.route('/inputValues', methods=['GET'])
# def handle_input_values():

#     global controller_state
#     values = request.args.get('value').split('c')
#     if len(values) == 12:
#         print(f"Received value: {values}")

#         controller_state.jump = True if values[0] == '1' else False
#         controller_state.forward = True if values[1] == '1' else False
#         controller_state.backward = True if values[2] == '1' else False
#         controller_state.left = True if values[3] == '1' else False
#         controller_state.right = True if values[4] == '1' else False
#         controller_state.potentiometer = int(values[5])
#         controller_state.accelerometer['x'] = int(values[6])
#         controller_state.accelerometer['y'] = int(values[7])
#         controller_state.accelerometer['z'] = int(values[8])
#         controller_state.gyroscope['x'] = int(values[9])
#         controller_state.gyroscope['y'] = int(values[10])
#         controller_state.gyroscope['z'] = int(values[11])

#         return f"Values received.", 200
#     else:
#         return "Invalid request", 400

# @app.route('/getControllerState', methods=['GET'])
# def handle_get_controller_state():

#     global controller_state
#     return json.dumps(controller_state)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8080)
