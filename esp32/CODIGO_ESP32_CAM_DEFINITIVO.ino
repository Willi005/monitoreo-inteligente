#include <SensirionI2cSps30.h>
#include <DHTesp.h>
#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <math.h>

// Credenciales de red y ThingsBoard.
// Completar antes de compilar. No subir credenciales reales al repositorio.
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define TB_HOST "200.13.5.20"
#define TB_PORT 1883
#define TB_TOKEN ""

// Topic MQTT de ThingsBoard para telemetria.
#define TB_TOPIC "v1/devices/me/telemetry"

// Evitar GPIO0, 2, 5, 12 y 15 (strapping pins que afectan el arranque),
// y los pines ADC2 (GPIO25-27, 32-39 son ADC1 y funcionan con WiFi activo).
#define PIN_TRIG 13  // HC-SR04: disparo del pulso ultrasonico
#define PIN_ECHO 14  // HC-SR04: recepcion del eco (via divisor 5.1k/10k)
#define PIN_DHT 16   // DHT11: datos de temperatura y humedad
#define PIN_LUZ 33   // DFR0026: salida analogica de luz
#define PIN_RUIDO 34 // KY-037: salida analogica de nivel de sonido

// Si alguien esta a menos de esta distancia, se activa el monitoreo completo.
#define UMBRAL_PRESENCIA_CM 80

// Cuanto tiempo se muestrea el microfono en cada lectura.
// Mas tiempo da lecturas mas estables, pero hace el loop mas lento.
#define VENTANA_RUIDO_MS 300

// Calibracion del ruido (KY-037).
// El sensor entrega amplitud (pico a pico) de la senal de audio, NO dB.
// En silencio marca una amplitud de fondo de ~120-140; ese piso se toma como
// referencia y se le asigna un nivel de presion sonora aproximado. La amplitud
// es ~proporcional a la presion sonora, asi que se convierte a dB con:
//     dB = RUIDO_DB_REF + 20 * log10(amplitud / RUIDO_AMP_REF)
// Es una ESTIMACION (no un sonometro calibrado). Para mayor precision, mide con
// una app de sonometro en el celular y ajusta RUIDO_DB_REF a ese valor real.
#define RUIDO_AMP_REF 130.0f // amplitud de fondo medida en silencio
#define RUIDO_DB_REF 42.0f   // dB aproximados asignados a ese silencio

DHTesp dht;
SensirionI2cSps30 sps30;
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// Prototipos declarados aqui para poder leer el setup y loop
// primero, sin tener que bajar hasta el final del archivo.
float medirDistancia();
bool hayPresencia(float distancia);
float medirLuz();
int medirRuido();
float amplitudADb(int amplitud);
String clasificarRuido(float db);
bool medirSPS30(float &pm1, float &pm2, float &pm4, float &pm10);
void conectarWifi();
void conectarMQTT();
void publicarDatos(float distancia, float luz, float ruidoDb, float temp,
                   float hum, float pm1, float pm2, float pm4, float pm10);
void publicarEstado(float distancia, bool presencia);

void setup()
{
  Serial.begin(115200);

  // TRIG arranca en LOW para que el sensor no dispare solo al encender.
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  // DHTesp maneja el protocolo single-wire del DHT11 internamente.
  dht.setup(PIN_DHT, DHTesp::DHT11);

  // El SPS30 necesita un reset antes de recibir cualquier comando.
  // Sin el delay posterior, el startMeasurement llega demasiado rapido
  // y el sensor lo ignora.
  Wire.begin();
  sps30.begin(Wire, SPS30_I2C_ADDR_69);
  sps30.deviceReset();
  delay(2000);

  int16_t err = sps30.startMeasurement(SPS30_OUTPUT_FORMAT_OUTPUT_FORMAT_UINT16);
  if (err)
  {
    Serial.println("ERROR: SPS30 no responde. Verificar cableado y pin SEL a GND.");
  }
  else
  {
    Serial.println("SPS30 iniciado correctamente.");
  }

  // Conexion WiFi y configuracion del broker MQTT.
  conectarWifi();
  mqtt.setServer(TB_HOST, TB_PORT);

  // Tiempo para que el ventilador interno del SPS30 alcance
  // velocidad estable antes de la primera lectura.
  delay(2000);
  Serial.println("Sistema listo. Esperando presencia...");
}

void loop()
{
  // Reintenta la conexion MQTT cada 10 segundos si se pierde,
  // sin bloquear el resto del sistema mientras tanto.
  static unsigned long ultimoIntento = 0;
  if (!mqtt.connected() && millis() - ultimoIntento > 10000)
  {
    ultimoIntento = millis();
    conectarMQTT();
  }
  mqtt.loop();

  float distancia = medirDistancia();
  bool presencia = hayPresencia(distancia);

  Serial.println("---");
  Serial.print("Distancia : ");
  Serial.print(distancia, 1);
  Serial.print(" cm  -  ");
  Serial.println(presencia ? "PRESENCIA DETECTADA" : "sin presencia");

  // Mientras no haya nadie, no tiene sentido leer ni enviar los demas sensores.
  // El sistema solo mide distancia hasta que alguien se acerque.
  if (presencia)
  {

    float luz = medirLuz();
    Serial.print("Luz       : ");
    Serial.print(luz, 1);
    Serial.println(" %");

    int amplitud = medirRuido();
    float ruidoDb = amplitudADb(amplitud);
    Serial.print("Ruido     : ");
    Serial.print(ruidoDb, 1);
    Serial.print(" dB (aprox, amp=");
    Serial.print(amplitud);
    Serial.print(")  -  ");
    Serial.println(clasificarRuido(ruidoDb));

    // DHT11: temperatura y humedad relativa.
    TempAndHumidity datos = dht.getTempAndHumidity();
    float temperatura = datos.temperature;
    float humedad = datos.humidity;

    Serial.print("Temp      : ");
    if (isnan(temperatura))
    {
      Serial.println("ERROR - revisar cableado del DHT11");
    }
    else
    {
      Serial.print(temperatura, 1);
      Serial.println(" C");
    }
    Serial.print("Humedad   : ");
    if (isnan(datos.humidity))
    {
      Serial.println("ERROR - revisar cableado del DHT11");
    }
    else
    {
      Serial.print(humedad, 1);
      Serial.println(" %");
    }

    // PM2.5 es el valor mas relevante para calidad del aire segun la OMS.
    // Los demas se reportan para tener el panorama completo de particulas.
    float pm1, pm2, pm4, pm10;
    bool sps30ok = medirSPS30(pm1, pm2, pm4, pm10);

    if (sps30ok)
    {
      Serial.print("PM1.0     : ");
      Serial.print(pm1, 1);
      Serial.println(" ug/m3");
      Serial.print("PM2.5     : ");
      Serial.print(pm2, 1);
      Serial.println(" ug/m3");
      Serial.print("PM4.0     : ");
      Serial.print(pm4, 1);
      Serial.println(" ug/m3");
      Serial.print("PM10      : ");
      Serial.print(pm10, 1);
      Serial.println(" ug/m3");
    }
    else
    {
      Serial.println("SPS30     : error de lectura");
    }

    // Solo se envia el set completo si el SPS30 respondio correctamente.
    // Los valores de temp y humedad se envian igual aunque sean NaN,
    // ThingsBoard los ignorara en ese caso.
    if (sps30ok)
    {
      publicarDatos(distancia, luz, ruidoDb, temperatura, humedad,
                    pm1, pm2, pm4, pm10);
    }
    else
    {
      // Aunque falle el SPS30, reportamos que SI hay presencia.
      publicarEstado(distancia, true);
    }
  }
  else
  {
    // Sin presencia: se reporta el estado constantemente para que el dashboard
    // sepa que el escritorio quedo libre y que los demas datos estan pausados.
    publicarEstado(distancia, false);
  }

  // Sin presencia se muestrea rapido para no tardar en detectar
  // cuando alguien llega. Con presencia se respeta el minimo del SPS30.
  delay(presencia ? 3000 : 500);
}

// Conecta al WiFi y espera hasta tener IP.
// Bloquea el arranque hasta que haya conexion.
void conectarWifi()
{
  Serial.print("Conectando a WiFi ");
  Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());
}

// Intenta conectar al broker MQTT con un maximo de 5 intentos.
// Si no lo logra, el sistema sigue funcionando en modo local
// (monitor serial) y reintenta en el proximo ciclo del loop.
void conectarMQTT()
{
  int intentos = 0;
  Serial.print("Conectando a ThingsBoard");

  while (!mqtt.connected() && intentos < 5)
  {
    if (mqtt.connect("ESP32-Monitoreo", TB_TOKEN, ""))
    {
      Serial.println(" conectado.");
      return;
    }
    Serial.print(".");
    intentos++;
    delay(1000);
  }

  if (!mqtt.connected())
  {
    Serial.println();
    Serial.println("MQTT: no se pudo conectar. Se reintentara en el proximo ciclo.");
  }
}

// Arma el payload JSON con todos los valores y lo publica en el topic
// de telemetria de ThingsBoard. Cada clave se convierte en una serie
// de tiempo independiente en la plataforma.
void publicarDatos(float distancia, float luz, float ruidoDb, float temp,
                   float hum, float pm1, float pm2, float pm4, float pm10)
{
  char payload[512];

  // Si el DHT11 no dio lectura valida, se omiten esos campos del JSON
  // para no enviar NaN a ThingsBoard, que no lo acepta bien.
  // Se incluye siempre "presencia":1 porque este envio solo ocurre con presencia.
  if (isnan(temp) || isnan(hum))
  {
    snprintf(payload, sizeof(payload),
             "{\"distancia\":%.1f,\"presencia\":1,\"luz\":%.1f,\"ruido\":%.1f,"
             "\"pm1\":%.1f,\"pm25\":%.1f,\"pm4\":%.1f,\"pm10\":%.1f}",
             distancia, luz, ruidoDb, pm1, pm2, pm4, pm10);
  }
  else
  {
    snprintf(payload, sizeof(payload),
             "{\"distancia\":%.1f,\"presencia\":1,\"luz\":%.1f,\"ruido\":%.1f,"
             "\"temperatura\":%.1f,\"humedad\":%.1f,"
             "\"pm1\":%.1f,\"pm25\":%.1f,\"pm4\":%.1f,\"pm10\":%.1f}",
             distancia, luz, ruidoDb, temp, hum, pm1, pm2, pm4, pm10);
  }

  bool ok = mqtt.publish(TB_TOPIC, payload);
  Serial.print("MQTT publish: ");
  Serial.println(ok ? "OK" : "FALLO");
  Serial.print("Payload: ");
  Serial.println(payload);
}

// Publica solo el estado de presencia (y la distancia) sin el resto de
// sensores. Se usa cuando no hay nadie, o cuando hay presencia pero el SPS30
// no respondio. Asi el dashboard siempre conoce el estado actual del escritorio.
void publicarEstado(float distancia, bool presencia)
{
  char payload[96];
  snprintf(payload, sizeof(payload),
           "{\"distancia\":%.1f,\"presencia\":%d}", distancia, presencia ? 1 : 0);
  bool ok = mqtt.publish(TB_TOPIC, payload);
  Serial.print("MQTT estado: ");
  Serial.println(ok ? "OK" : "FALLO");
}

// Dispara un pulso de 10us por TRIG y mide cuanto tarda en volver por ECHO.
// Si no hay respuesta en 30ms (unos 500cm), pulseIn retorna 0.
float medirDistancia()
{
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duracion = pulseIn(PIN_ECHO, HIGH, 30000);

  // Velocidad del sonido a 20C: 0.0343 cm/us.
  // Se divide entre 2 porque el pulso va y vuelve.
  return duracion * 0.0343 / 2.0;
}

// Descarta el valor 0 que retorna pulseIn cuando hay timeout,
// para no confundirlo con una presencia a 0 cm.
bool hayPresencia(float distancia)
{
  return (distancia > 0 && distancia < UMBRAL_PRESENCIA_CM);
}

// Convierte la lectura cruda del ADC a porcentaje.
// El ADC del ESP32 es de 12 bits, por lo que el maximo es 4095.
float medirLuz()
{
  int raw = analogRead(PIN_LUZ);
  return (raw / 4095.0) * 100.0;
}

// Toma muchas muestras durante VENTANA_RUIDO_MS y devuelve la diferencia
// entre el valor mas alto y el mas bajo. Una senal de audio oscila
// constantemente, por eso un valor instantaneo no sirve para medir ruido.
int medirRuido()
{
  unsigned long inicio = millis();
  int vMax = 0;
  int vMin = 4095;

  while (millis() - inicio < VENTANA_RUIDO_MS)
  {
    int muestra = analogRead(PIN_RUIDO);
    if (muestra > vMax)
      vMax = muestra;
    if (muestra < vMin)
      vMin = muestra;
  }

  return vMax - vMin;
}

// Convierte la amplitud cruda del KY-037 a un nivel aproximado en dB.
// El piso de silencio (RUIDO_AMP_REF) se mapea a RUIDO_DB_REF; por encima,
// la amplitud crece de forma logaritmica con la presion sonora.
float amplitudADb(int amplitud)
{
  float amp = (float)amplitud;
  if (amp < RUIDO_AMP_REF)
    amp = RUIDO_AMP_REF; // nunca por debajo del silencio
  return RUIDO_DB_REF + 20.0f * log10f(amp / RUIDO_AMP_REF);
}

// Clasificacion del ruido en dB (aprox.), alineada con WHO 2018 para
// entornos de trabajo y el rango real alcanzable por este sensor.
String clasificarRuido(float db)
{
  if (db < 50)
    return "SILENCIO"; // trabajo cognitivo profundo
  if (db < 60)
    return "BAJO"; // oficina tranquila
  if (db < 68)
    return "MODERADO"; // distrae
  return "ALTO";       // impacto severo en la concentracion
}

// El SPS30 en modo Uint16 entrega los valores multiplicados por 10
// para evitar punto flotante en la comunicacion I2C.
// Se divide al leer para recuperar el valor real en ug/m3.
bool medirSPS30(float &pm1, float &pm2, float &pm4, float &pm10)
{
  uint16_t p1, p2, p4, p10;
  uint16_t nc0p5, nc1p0, nc2p5, nc4p0, nc10p0, tps;

  int16_t err = sps30.readMeasurementValuesUint16(
      p1, p2, p4, p10,
      nc0p5, nc1p0, nc2p5, nc4p0, nc10p0, tps);

  if (err)
    return false;

  // El formato Uint16 del SPS30 escala los valores por un factor de 10
  // para preservar un decimal de precision sin usar punto flotante
  // en la transmision I2C.
  pm1 = p1 / 10.0;
  pm2 = p2 / 10.0;
  pm4 = p4 / 10.0;
  pm10 = p10 / 10.0;

  return true;
}