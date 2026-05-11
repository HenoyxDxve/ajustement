import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';

@WebSocketGateway({ cors: true, namespace: 'commandes' })
export class CommandesGateway {
  @WebSocketServer() server!: Server;

  //  Émettre un événement à un client spécifique
  emitToClient(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  //  Émettre à tous les staff (KDS)
  emitToKitchen(event: string, data: any) {
    this.server.to('role:STAFF').emit(event, data);
  }

  //  Inscription du client à ses notifications personnelles
  @SubscribeMessage('subscribe')
  @UseGuards(AuthGuard('jwt'))
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() { userId, roles }: { userId: string; roles: string[] },
  ) {
    client.join(`user:${userId}`);
    if (roles.includes('STAFF') || roles.includes('GERANT')) {
      client.join('role:STAFF');
    }
    return { success: true };
  }
}
