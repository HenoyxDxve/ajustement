import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Team } from '../entities/team.entity';
import { TeamMember } from '../entities/team-member.entity';
import { BulkOrder } from '../entities/bulk-order.entity';
import { Invoice } from '../entities/invoice.entity';
import { CreateTeamDto } from '../dto/create-team.dto';
import { AddTeamMemberDto } from '../dto/add-team-member.dto';
import { CreateBulkOrderDto } from '../dto/create-bulk-order.dto';
import { UpdateBulkOrderStatusDto } from '../dto/update-bulk-order-status.dto';

@Injectable()
export class B2BService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(BulkOrder)
    private bulkOrderRepository: Repository<BulkOrder>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // === TEAM MANAGEMENT ===
  async createTeam(
    userId: string,
    createTeamDto: CreateTeamDto,
  ): Promise<Team> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== 'B2B') {
      throw new ForbiddenException('Only B2B users can create teams');
    }

    const team = this.teamRepository.create({
      ...createTeamDto,
      createdByUserId: userId,
    });

    const savedTeam = await this.teamRepository.save(team);

    // Add creator as team owner
    const teamMember = this.teamMemberRepository.create({
      teamId: savedTeam.id,
      userId: userId,
      role: 'OWNER',
    });
    await this.teamMemberRepository.save(teamMember);

    return savedTeam;
  }

  async getTeamsByUser(userId: string): Promise<Team[]> {
    const teamMembers = await this.teamMemberRepository.find({
      where: { userId: userId, active: true },
      relations: ['team'],
    });
    return teamMembers.map((tm) => tm.team);
  }

  async addTeamMember(
    teamId: string,
    currentUserId: string,
    addTeamMemberDto: AddTeamMemberDto,
  ): Promise<TeamMember> {
    // Verify current user is team admin/owner
    const currentUserMember = await this.teamMemberRepository.findOne({
      where: { teamId: teamId, userId: currentUserId, active: true },
    });
    if (
      !currentUserMember ||
      (currentUserMember.role !== 'ADMIN' && currentUserMember.role !== 'OWNER')
    ) {
      throw new ForbiddenException('Only team admins/owners can add members');
    }

    // Verify target user exists and is B2B
    const targetUser = await this.userRepository.findOne({
      where: { id: addTeamMemberDto.userId },
    });
    if (!targetUser || targetUser.role !== 'B2B') {
      throw new BadRequestException('Target user must be a B2B user');
    }

    // Check if user is already in team
    const existingMember = await this.teamMemberRepository.findOne({
      where: { teamId: teamId, userId: addTeamMemberDto.userId },
    });
    if (existingMember) {
      if (!existingMember.active) {
        existingMember.active = true;
        existingMember.role = addTeamMemberDto.role;
        return this.teamMemberRepository.save(existingMember);
      }
      throw new BadRequestException('User is already a member of this team');
    }

    const teamMember = this.teamMemberRepository.create({
      teamId: teamId,
      userId: addTeamMemberDto.userId,
      role: addTeamMemberDto.role,
    });

    return this.teamMemberRepository.save(teamMember);
  }

  async removeTeamMember(
    teamId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<void> {
    // Verify current user is team owner or removing themselves
    const currentUserMember = await this.teamMemberRepository.findOne({
      where: { teamId: teamId, userId: currentUserId, active: true },
    });
    if (!currentUserMember) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (currentUserId !== targetUserId && currentUserMember.role !== 'OWNER') {
      throw new ForbiddenException('Only team owners can remove other members');
    }

    const targetMember = await this.teamMemberRepository.findOne({
      where: { teamId: teamId, userId: targetUserId, active: true },
    });
    if (!targetMember) {
      throw new NotFoundException('Team member not found');
    }

    targetMember.active = false;
    await this.teamMemberRepository.save(targetMember);
  }

  // === BULK ORDER MANAGEMENT ===
  async createBulkOrder(
    userId: string,
    createBulkOrderDto: CreateBulkOrderDto,
  ): Promise<BulkOrder> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== 'B2B') {
      throw new ForbiddenException('Only B2B users can create bulk orders');
    }

    const bulkOrder = this.bulkOrderRepository.create({
      ...createBulkOrderDto,
      createdByUserId: userId,
      status: 'PENDING',
    });

    return this.bulkOrderRepository.save(bulkOrder);
  }

  async getBulkOrdersByUser(userId: string): Promise<BulkOrder[]> {
    return this.bulkOrderRepository.find({
      where: { createdByUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateBulkOrderStatus(
    orderId: string,
    currentUserId: string,
    updateDto: UpdateBulkOrderStatusDto,
  ): Promise<BulkOrder> {
    const order = await this.bulkOrderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Bulk order not found');
    }

    // Only allow status updates that make sense
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!updateDto.status) {
      throw new BadRequestException('status is required');
    }

    if (!validTransitions[order.status].includes(updateDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${updateDto.status}`,
      );
    }

    order.status = updateDto.status;
    return this.bulkOrderRepository.save(order);
  }

  // === INVOICE MANAGEMENT ===
  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { b2bClientId: userId },
      order: { issueDate: 'DESC' },
    });
  }

  async getInvoiceById(invoiceId: string, userId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, b2bClientId: userId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async getDashboard(userId: string): Promise<Record<string, any>> {
    const teamCount = await this.teamRepository.count({
      where: { createdByUserId: userId, active: true },
    });

    const orderCount = await this.bulkOrderRepository.count({
      where: { createdByUserId: userId },
    });

    const invoiceCount = await this.invoiceRepository.count({
      where: { b2bClientId: userId },
    });

    const activeCollaborators = await this.teamMemberRepository
      .createQueryBuilder('member')
      .innerJoin('member.team', 'team')
      .where('member.active = :active', { active: true })
      .andWhere('team.createdByUserId = :userId', { userId })
      .getCount();

    const totalOrderValueResult = await this.bulkOrderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'sum')
      .where('order.createdByUserId = :userId', { userId })
      .getRawOne();

    const totalOrderValue = parseFloat(totalOrderValueResult?.sum ?? '0');

    return {
      totalTeams: teamCount,
      totalOrders: orderCount,
      totalInvoices: invoiceCount,
      activeCollaborators,
      totalOrderValue,
    };
  }

  async getCollaboratorsByUser(userId: string): Promise<any[]> {
    const teamMembers = await this.teamMemberRepository.find({
      where: { active: true },
      relations: ['user', 'team'],
    });

    return teamMembers
      .filter((member) => member.team.createdByUserId === userId)
      .map((member) => ({
        id: member.user.id,
        nom: member.user.nom,
        email: member.user.email,
        role: member.role,
        actif: member.active,
      }));
  }

  async getReportsByUser(userId: string): Promise<any> {
    const bulkOrders = await this.bulkOrderRepository.find({
      where: { createdByUserId: userId },
      order: { createdAt: 'DESC' },
    });

    const invoices = await this.invoiceRepository.find({
      where: { b2bClientId: userId },
      order: { issueDate: 'DESC' },
    });

    const expenses = bulkOrders.map((order) => ({
      collaborator: 'Responsable B2B',
      email: 'contact@entreprise.ci',
      totalSpent: Number(order.total),
      ordersCount: 1,
      averageOrder: Number(order.total),
      lastOrder: order.createdAt.toISOString().split('T')[0],
    }));

    const auditLogs = [
      ...bulkOrders.slice(0, 3).map((order) => ({
        date: order.createdAt.toISOString(),
        user: 'Responsable B2B',
        action: 'Commande groupée créée',
        details: `Commande #${order.id} (${order.items.length} articles)`,
        amount: Number(order.total),
      })),
      ...invoices.slice(0, 3).map((invoice) => ({
        date: invoice.issueDate.toISOString(),
        user: 'Système de facturation',
        action: 'Facture émise',
        details: `Facture ${invoice.invoiceNumber}`,
        amount: Number(invoice.totalAmount),
      })),
    ];

    return {
      expenses: expenses.length
        ? expenses
        : [
            {
              collaborator: 'Responsable B2B',
              email: 'contact@entreprise.ci',
              totalSpent: 0,
              ordersCount: 0,
              averageOrder: 0,
              lastOrder: new Date().toISOString().split('T')[0],
            },
          ],
      auditLogs: auditLogs.length
        ? auditLogs
        : [
            {
              date: new Date().toISOString(),
              user: 'Système',
              action: 'Aucun historique disponible',
              details:
                'Vos actions seront affichées ici dès que des données seront générées.',
              amount: 0,
            },
          ],
    };
  }

  // === UTILITY METHODS ===
  async isUserB2B(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.role === 'B2B';
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const teamMembers = await this.teamMemberRepository.find({
      where: { userId: userId, active: true },
      relations: ['team'],
    });
    return teamMembers.map((tm) => tm.team);
  }
}
