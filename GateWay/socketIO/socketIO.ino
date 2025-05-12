// ---------------------------
// Cấu hình Ethernet (LAN8720)
// ---------------------------
#define ETH_PHY_ADDR 1                  // PHY address (usually 0 or 1 depending on your board)
#define ETH_PHY_TYPE ETH_PHY_LAN8720    // Use LAN8720 Ethernet PHY chip
#define ETH_PHY_POWER -1                // No GPIO used to control PHY power
#define ETH_PHY_MDC 23                  // MDC pin for Ethernet
#define ETH_PHY_MDIO 18                 // MDIO pin for Ethernet
#define ETH_CLK_MODE ETH_CLOCK_GPIO0_IN // Use GPIO0 input for Ethernet clock
#define USE_SERIAL Serial
// ---------------------------
// Include thư viện
// ---------------------------
#include <ETH.h>
#include <ModbusIP_ESP8266.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include "SocketIOclient.h" 

static bool eth_connected = false;
IPAddress localIP(192, 168, 0, 100); // Static IP of ESP32
IPAddress gateway(192, 168, 0, 1);   // Gateway IP (usually your router or PLC)
IPAddress subnet(255, 255, 255, 0);  // Subnet mask
IPAddress dns(0, 0, 0, 0);           // DNS (not used here)

// ---------------------------
// Cấu hình WiFi và server
// ---------------------------
const char* ssid = "IUDLAB_2.4G";
const char* password = "0338182860";
const char* serverHost = "192.168.1.32";
const int serverPort = 5000;

// ---------------------------
// Cấu hình Modbus
// ---------------------------
ModbusIP modbus;
IPAddress modbusServerIP(192, 168, 0, 50);
const int portModbusServer = 502;
const int startCoil = 0, numberCoil = 4;
bool coil[numberCoil];

// ---------------------------
// Khởi tạo WiFi và Socket
// ---------------------------
WiFiMulti WiFiMulti;
SocketIOclient webSocket;

// ---------------------------
// Biến điều khiển và thời gian
// ---------------------------
bool Y0 = false, Y1 = false, Y2 = false, Y3 = false;
unsigned long lastTime = 0;
const int interval = 6000;


// ---------------------------
// Xử lý sự kiện Socket.IO 
// ---------------------------
void messageEventHandler(socketIOmessageType_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case sIOtype_EVENT: {
      String msg = (char*)payload;
      USE_SERIAL.printf("[IOc] Got message: %s\n", payload);
      // Xử lý sự kiện "message", ví dụ: ["message","1010"]
      if (msg.indexOf("message") != -1) {
        String data = msg.substring(msg.indexOf(",") + 2, msg.lastIndexOf("\""));
        if (data.length() >= 4) {
          Y3 = data[0] == '1';
          Y2 = data[1] == '1';
          Y1 = data[2] == '1';
          Y0 = data[3] == '1';

          modbus.writeCoil(modbusServerIP, startCoil + 0, Y0);
          modbus.writeCoil(modbusServerIP, startCoil + 1, Y1);
          modbus.writeCoil(modbusServerIP, startCoil + 2, Y2);
          modbus.writeCoil(modbusServerIP, startCoil + 3, Y3);
          modbus.task();
        }
      }
      break;
    }
    case sIOtype_DISCONNECT:
      USE_SERIAL.println("[IOc] Disconnected! Attempting to reconnect...");
      webSocket.begin(serverHost, serverPort, "/socket.io/?EIO=4");
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
// ---------------------------
// Sự kiện WiFi / Ethernet
// ---------------------------
void WiFiEvent(WiFiEvent_t event) {
    switch (event) {
    case ARDUINO_EVENT_ETH_START: // Ethernet started
        Serial.println("ETH Started");
        ETH.setHostname("esp32-eth");              // Set device hostname
        ETH.config(localIP, gateway, subnet, dns); // Configure static IP
        break;
    case ARDUINO_EVENT_ETH_CONNECTED: // Ethernet cable connected
        Serial.println("ETH Connected");
        break;
    case ARDUINO_EVENT_ETH_GOT_IP: // Successfully obtained IP
        Serial.print("  ETH MAC: ");
        Serial.println(ETH.macAddress()); // Print MAC address
        Serial.print("  IPv4: ");
        Serial.println(ETH.localIP()); // Print assigned IP
        eth_connected = true;
        break;
    case ARDUINO_EVENT_ETH_DISCONNECTED: // Ethernet cable disconnected
        Serial.println("ETH Disconnected");
        eth_connected = false;
        break;
    case ARDUINO_EVENT_ETH_STOP: // Ethernet interface stopped
        Serial.println("ETH Stopped");
        eth_connected = false;
        break;
    default:
        break;
    }
}

// ---------------------------
// Kết nối WiFi ban đầu
// ---------------------------
void setup_wifi() {
    WiFiMulti.addAP(ssid, password);
    USE_SERIAL.println("Connecting to WiFi...");
    while (WiFiMulti.run() != WL_CONNECTED) {
      delay(500);
      USE_SERIAL.print(".");
    }
    USE_SERIAL.println("\nWiFi connected");
    USE_SERIAL.println("IP address: " + WiFi.localIP().toString());
}

// ---------------------------
// setup()
// ---------------------------
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
    WiFi.onEvent(WiFiEvent);
    ETH.begin();
    setup_wifi();

    // Kết nối tới server Socket.IO
    webSocket.begin(serverHost, serverPort, "/socket.io/?EIO=4");
    webSocket.onEvent(messageEventHandler);

    modbus.client();
    modbus.connect(modbusServerIP, portModbusServer);
}

// ---------------------------
// loop()
// ---------------------------
void loop() {
    webSocket.loop();

    static unsigned long messageTimestamp = 0;
    uint64_t now = millis();
    if (now - messageTimestamp > interval)
    {
        messageTimestamp = now;

        if (modbus.isConnected(modbusServerIP))
        {
            modbus.readCoil(modbusServerIP, startCoil, coil, numberCoil);
            modbus.task();

            Y3 = coil[0];
            Y2 = coil[1];
            Y1 = coil[2];
            Y0 = coil[3];

            char binStr[5] = {
                Y3 ? '1' : '0',
                Y2 ? '1' : '0',
                Y1 ? '1' : '0',
                Y0 ? '1' : '0',
                '\0'};

             // Gửi sự kiện "message" qua webSocket
            String payload = "[\"message\",\"" + String(binStr) + "\"]";
            webSocket.sendEVENT(payload);
            USE_SERIAL.println("Sent message: " + String(binStr));
        }
        else
        {
            modbus.connect(modbusServerIP, portModbusServer);
        }
    }

    modbus.task();
}
