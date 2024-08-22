from flask import Flask, request

app = Flask(__name__)

@app.route('/inputValues', methods=['GET'])
def handle_input_values():
    value = request.args.get('value')
    if value:
        print(f"Received value: {value}")
        return f"Value received: {value}", 200
    else:
        return "Invalid request", 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
