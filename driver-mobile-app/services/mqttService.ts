import mqtt, { MqttClient } from 'mqtt';
import secureStorage from '@/services/secureStorage';
import { STORAGE_KEYS, MQTT_URL } from '../utils/constants';

interface LocationData {
    coordinates: { latitude: number; longitude: number };
    speed?: number;
    heading?: number;
    timestamp: number;
}

class MQTTService {
    private client: MqttClient | null = null;
    private isConnected = false;
    private offlineQueue: LocationData[] = [];
    private driverId: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private messageCallbacks: ((topic: string, message: string) => void)[] = [];

    async connect(): Promise<boolean> {
        try {
            // Get driver ID from storage
            const driverData = await secureStorage.getItem(STORAGE_KEYS.DRIVER);
            if (!driverData) {
                console.error('No driver found');
                return false;
            }
            this.driverId = JSON.parse(driverData).id;

            console.log(`🔌 Connecting to MQTT: ${MQTT_URL}`);

            this.client = mqtt.connect(MQTT_URL, {
                clientId: `driver_${this.driverId}_${Date.now()}`,
                clean: true,
                keepalive: 60,
                reconnectPeriod: 5000,
                connectTimeout: 10000,
            });

            this.client.on('connect', () => {
                console.log('✅ MQTT connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.flushOfflineQueue();
            });

            this.client.on('close', () => {
                console.log('❌ MQTT disconnected');
                this.isConnected = false;
            });

            this.client.on('offline', () => {
                console.log('⚠️ MQTT offline');
                this.isConnected = false;
            });

            this.client.on('error', (error) => {
                console.error('MQTT error:', error);
                this.reconnectAttempts++;

                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.error('Max reconnect attempts reached');
                    this.disconnect();
                }
            });

            this.client.on('message', (topic, payload) => {
                this.messageCallbacks.forEach(cb => cb(topic, payload.toString()));
            });

            this.client.on('reconnect', () => {
                console.log('🔄 MQTT reconnecting...');
            });

            return true;
        } catch (error) {
            console.error('MQTT connection error:', error);
            return false;
        }
    }

    sendLocation(
        coordinates: { latitude: number; longitude: number },
        speed?: number,
        heading?: number
    ): boolean {
        const locationData: LocationData = {
            coordinates,
            speed,
            heading,
            timestamp: Date.now(),
        };

        if (!this.isConnected || !this.client || !this.driverId) {
            console.warn('MQTT not connected, queuing location');
            this.offlineQueue.push(locationData);

            // Limit queue size to prevent memory issues
            if (this.offlineQueue.length > 100) {
                this.offlineQueue.shift(); // Remove oldest
            }

            return false;
        }

        const topic = `location/${this.driverId}`;
        const payload = JSON.stringify(locationData);

        this.client.publish(topic, payload, { qos: 1 }, (error) => {
            if (error) {
                console.error('MQTT publish error:', error);
                this.offlineQueue.push(locationData);
            } else {
                console.log(`📡 MQTT sent: ${topic}`);
            }
        });

        return true;
    }

    private flushOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        console.log(`📤 Flushing ${this.offlineQueue.length} offline locations`);

        const queue = [...this.offlineQueue];
        this.offlineQueue = [];

        queue.forEach((data) => {
            this.sendLocation(data.coordinates, data.speed, data.heading);
        });
    }

    disconnect() {
        if (this.client) {
            this.client.end(true);
            this.client = null;
            this.isConnected = false;
            console.log('MQTT disconnected');
        }
    }

    getIsConnected(): boolean {
        return this.isConnected;
    }

    getQueueSize(): number {
        return this.offlineQueue.length;
    }

    onMessage(callback: (topic: string, message: string) => void) {
        this.messageCallbacks.push(callback);
    }
}

export default new MQTTService();
