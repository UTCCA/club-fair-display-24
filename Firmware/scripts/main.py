import time
import threading
from wifi_communicator import WiFiCommunicator

def receive_messages(communicator):
    while True:
        message = communicator.get_message()
        if message:
            print(message.data)
        time.sleep(0.1)

def main():
    # Initialize the controller
    communicator = WiFiCommunicator(max_buffer_sz=128)

    # Start the message receiving thread
    message_thread = threading.Thread(target=receive_messages, args=(communicator,))
    message_thread.daemon = True  # Ensure the thread exits when the main program does
    message_thread.start()

    while True:
        # Main thread can perform other tasks here
        time.sleep(1)

if __name__ == '__main__':
    main()
