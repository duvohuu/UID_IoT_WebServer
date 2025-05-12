#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <SocketIOclient.h>

#define USE_SERIAL Serial

// Cấu hình WiFi và server
const char* ssid = "IUDLAB_2.4G";
const char* password = "0338182860";
const char* serverHost = "192.168.1.32";
const int serverPort = 5000;

WiFiMulti WiFiMulti;
SocketIOclient webSocket;

void messageEventHandler(socketIOmessageType_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case sIOtype_EVENT:
      USE_SERIAL.printf("[IOc] Got message: %s\n", payload);
      break;
    case sIOtype_DISCONNECT:
      USE_SERIAL.println("[IOc] Disconnected!");
      break;
    case sIOtype_CONNECT:
      USE_SERIAL.printf("[IOc] Connected to url: %s\n", payload);
      break;
    case sIOtype_ERROR:
      USE_SERIAL.printf("[IOc] Error: %s\n", payload);
      break;
    default:
      break;
  }
}

void setup() {
  USE_SERIAL.begin(115200);
  USE_SERIAL.setDebugOutput(true);

  USE_SERIAL.println();
  USE_SERIAL.println();
  USE_SERIAL.println();

  // Đợi khởi động
  for (uint8_t t = 4; t > 0; t--) {
    USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
    USE_SERIAL.flush();
    delay(1000);
  }

  // Kết nối WiFi
  WiFiMulti.addAP(ssid, password);
  USE_SERIAL.println("Connecting to WiFi...");
  while (WiFiMulti.run() != WL_CONNECTED) {
    delay(500);
    USE_SERIAL.print(".");
  }
  USE_SERIAL.println("\nWiFi connected");
  USE_SERIAL.println("IP address: " + WiFi.localIP().toString());

  // Kết nối tới server Socket.IO
  webSocket.begin(serverHost, serverPort, "/socket.io/?EIO=4");
  webSocket.onEvent(messageEventHandler);
}

void loop() {
  webSocket.loop();

  static unsigned long messageTimestamp = 0;
  static bool isOn = false; // Trạng thái thiết bị (on/off)
  uint64_t now = millis();

  if (now - messageTimestamp > 6000) {
    messageTimestamp = now;
    // Tạo payload deviceStatus
    isOn = !isOn; // Chuyển đổi trạng thái
    String status = isOn ? "on" : "off";
    String payload = "{\"name\":\"Device2\",\"status\":\"" + status + "\"}";
    // Gửi sự kiện "deviceStatus"
    webSocket.sendEVENT("[\"deviceStatus\"," + payload + "]");
    USE_SERIAL.println("Sent deviceStatus: " + payload);
  }
}