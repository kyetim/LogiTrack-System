import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { LocationService } from '../location/location.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
    private client: mqtt.MqttClient;
    private readonly logger = console;

    constructor(
        private websocketGateway: WebsocketGateway,
        private locationService: LocationService,
    ) { }

    async onModuleInit() {
        try {
            // Connect to MQTT broker
            this.client = mqtt.connect('mqtt://localhost:1883', {
                clientId: 'backend-bridge-' + Math.random().toString(16).substring(2, 8),
                clean: true,
                keepalive: 60,
                reconnectPeriod: 5000,
            });

            this.client.on('connect', () => {
                this.logger.log('✅ MQTT Broker connected');

                // Subscribe to all driver locations
                this.client.subscribe('location/+', { qos: 1 }, (err) => {
                    if (err) {
                        this.logger.error('MQTT subscription error:', err);
                    } else {
                        this.logger.log('📡 Subscribed to location/*');
                    }
                });
            });

            this.client.on('message', async (topic, message) => {
                try {
                    // topic format: location/{driverId}
                    const driverId = topic.split('/')[1];
                    const payload = JSON.parse(message.toString());

                    this.logger.log(`📥 MQTT received from driver ${driverId}`);

                    // Save to database
                    await this.locationService.create({
                        driverId,
                        coordinates: payload.coordinates,
                        speed: payload.speed,
                        heading: payload.heading,
                    });

                    // Bridge to WebSocket (broadcast to dispatchers)
                    this.websocketGateway.server.to('dispatchers').emit('location:update', {
                        driverId,
                        coordinates: payload.coordinates,
                        speed: payload.speed,
                        heading: payload.heading,
                        timestamp: payload.timestamp || new Date(),
                    });

                    this.logger.log(`🌉 Bridged MQTT → WebSocket: driver ${driverId}`);
                } catch (error) {
                    this.logger.error('MQTT message processing error:', error);
                }
            });

            this.client.on('error', (error) => {
                this.logger.error('MQTT error:', error);
            });

            this.client.on('offline', () => {
                this.logger.warn('⚠️ MQTT offline');
            });

            this.client.on('reconnect', () => {
                this.logger.log('🔄 MQTT reconnecting...');
            });
        } catch (error) {
            this.logger.error('MQTT initialization error:', error);
        }
    }

    onModuleDestroy() {
        if (this.client) {
            this.client.end();
            this.logger.log('MQTT client disconnected');
        }
    }
}
