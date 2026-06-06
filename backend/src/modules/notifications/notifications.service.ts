import { prisma } from "../../config/database";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  static async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    meta?: any
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : null
      }
    });

    await this.sendEmailOrPush(userId, title, body);

    return notification;
  }

  static async sendEmailOrPush(userId: string, title: string, body: string) {
    return Promise.resolve();
  }

  static async getNotifications(userId: string, filters: { unreadOnly?: boolean; type?: NotificationType; page: number; limit: number }) {
    const where: any = { userId };
    if (filters.unreadOnly) {
      where.isRead = false;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    const total = await prisma.notification.count({ where });
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    });

    return { notifications, total };
  }

  static async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  static async dismiss(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id, userId }
    });
  }

  static async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false }
    });
    return { count };
  }
}
