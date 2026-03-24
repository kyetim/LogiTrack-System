import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LocationService } from '../location/location.service';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'development'
      ? true
      : (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()),
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebSocketGateway');

  constructor(
    private jwtService: JwtService,
    private locationService: LocationService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id} (${payload.email})`);

      // Join role-based rooms
      if (payload.role === 'DRIVER') {
        client.join('drivers');
        client.join(`driver:${payload.sub}`); // Personal room for targeted notifications
      } else if (payload.role === 'DISPATCHER') {
        client.join('dispatchers');
        client.join(`user:${payload.sub}`);
      } else if (payload.role === 'ADMIN') {
        client.join('dispatchers'); // Admins also get dispatcher updates
        client.join(`user:${payload.sub}`);
      }

    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('location:send')
  async handleLocationUpdate(
    @MessageBody() data: { coordinates: any; speed?: number; heading?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;

      if (user.role !== 'DRIVER') {
        return { error: 'Only drivers can send location updates' };
      }

      // Get driver profile
      const driverProfile = await this.locationService['prisma'].driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!driverProfile) {
        return { error: 'Driver profile not found' };
      }

      // Save location to database
      const location = await this.locationService.create({
        driverId: driverProfile.id,
        coordinates: data.coordinates,
        speed: data.speed,
        heading: data.heading,
      });

      // Broadcast to dispatchers
      this.server.to('dispatchers').emit('location:update', {
        driverId: driverProfile.id,
        driverEmail: user.email,
        coordinates: data.coordinates,
        speed: data.speed,
        heading: data.heading,
        timestamp: location.timestamp,
      });

      return { success: true, locationId: location.id };
    } catch (error) {
      this.logger.error(`Location update failed: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('driver:join')
  handleDriverJoin(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    client.join(`driver:${user.id}`);
    return { success: true };
  }

  @SubscribeMessage('dispatcher:join')
  handleDispatcherJoin(@ConnectedSocket() client: Socket) {
    const user = client.data.user;

    if (user.role !== 'DISPATCHER' && user.role !== 'ADMIN') {
      return { error: 'Only dispatchers can join this room' };
    }

    client.join('dispatchers');
    return { success: true };
  }

  // Broadcast driver status change
  emitDriverStatus(driverId: string, status: string) {
    this.server.to('dispatchers').emit('driver:status', {
      driverId,
      status,
      timestamp: new Date(),
    });
  }

  // Broadcast shipment created
  emitShipmentCreated(shipment: any) {
    this.server.to('dispatchers').emit('shipment:created', {
      shipmentId: shipment.id,
      pickupLocation: shipment.pickupLocation,
      deliveryLocation: shipment.deliveryLocation,
      timestamp: new Date(),
    });
  }

  // Broadcast shipment assigned
  emitShipmentAssigned(shipmentId: string, driverId: string) {
    this.server.to('dispatchers').emit('shipment:assigned', {
      shipmentId,
      driverId,
      timestamp: new Date(),
    });

    // Notify specific driver
    this.server.to(`driver:${driverId}`).emit('shipment:assigned', {
      shipmentId,
      timestamp: new Date(),
    });
  }

  // Broadcast shipment status change
  emitShipmentStatus(shipmentId: string, status: string) {
    this.server.to('dispatchers').emit('shipment:status', {
      shipmentId,
      status,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast driver location update to all dispatchers/admins.
   * Called from DriverController after HTTP location update.
   */
  broadcastLocationUpdate(payload: {
    driverId: string;
    driverEmail: string;
    coordinates: { latitude: number; longitude: number };
    speed?: number;
    heading?: number;
    timestamp: Date;
    driver?: {
      status: string;
      isAvailable: boolean;
      isAvailableForWork: boolean;
      licenseNumber: string;
      vehicle?: { plateNumber: string } | null;
    };
  }) {
    this.server.to('dispatchers').emit('location:update', {
      driverId: payload.driverId,
      driverEmail: payload.driverEmail,
      coordinates: payload.coordinates,
      speed: payload.speed,
      heading: payload.heading,
      timestamp: payload.timestamp,
      driver: payload.driver,
    });
    this.logger.log(
      `📍 Location broadcast → dispatchers: driver=${payload.driverId}`
    );
  }

  // ==================== SUPPORT TICKET EVENTS ====================

  // Emit new support ticket created (to all admins/dispatchers)
  emitNewSupportTicket(ticket: any) {
    this.server.to('dispatchers').emit('support:new-ticket', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      driverId: ticket.driverId,
      subject: ticket.subject,
      timestamp: new Date(),
    });
  }

  // Emit admin reply (to specific driver)
  emitAdminReply(driverId: string, message: any) {
    this.server.to(`driver:${driverId}`).emit('support:admin-reply', {
      messageId: message.id,
      content: message.content,
      sender: message.sender,
      timestamp: new Date(),
    });
  }

  // Emit ticket assignment (to all admins + driver)
  emitTicketAssigned(ticketId: string, driverId: string, admin: any) {
    // Notify driver
    this.server.to(`driver:${driverId}`).emit('support:ticket-assigned', {
      ticketId,
      assignedTo: admin,
      timestamp: new Date(),
    });

    // Notify dispatchers
    this.server.to('dispatchers').emit('support:ticket-assigned', {
      ticketId,
      assignedTo: admin,
      timestamp: new Date(),
    });
  }

  // Emit ticket status change
  emitTicketStatusChanged(ticketId: string, driverId: string, status: string) {
    // Notify driver
    this.server.to(`driver:${driverId}`).emit('support:status-changed', {
      ticketId,
      status,
      timestamp: new Date(),
    });

    // Notify dispatchers
    this.server.to('dispatchers').emit('support:status-changed', {
      ticketId,
      status,
      timestamp: new Date(),
    });
  }

  // Emit new message in ticket (to driver or admins depending on sender)
  emitNewTicketMessage(ticketId: string, driverId: string, message: any, senderRole: string) {
    if (senderRole === 'DRIVER') {
      // Driver sent message - notify admins
      this.server.to('dispatchers').emit('support:new-message', {
        ticketId,
        message,
        timestamp: new Date(),
      });
    } else {
      // Admin sent message - notify driver
      this.server.to(`driver:${driverId}`).emit('support:new-message', {
        ticketId,
        message,
        timestamp: new Date(),
      });
    }
  }
}
