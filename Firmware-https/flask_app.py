from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Button states: false means inactive
button_fwd_state = False
button_back_state = False
button_l_state = False
button_r_state = False

button_jmp_state = False

potentiometer_value = 0

@app.route('/inputValues', methods=['GET'])
def handle_input_values():
    value = request.args.get('value')
    if value:
        print(f"Received value: {value}")
        values = value.split('c')

        button_fwd_state = True if values[0] == '1' else False
        button_back_state = True if values[1] == '1' else False
        button_l_state = True if values[2] == '1' else False
        button_r_state = True if values[3] == '1' else False

        button_jmp_state = False

        return f"Value received: {value}", 200
    else:
        return "Invalid request", 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
