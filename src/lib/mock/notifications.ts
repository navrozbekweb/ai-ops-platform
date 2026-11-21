import type { Role } from "@/lib/auth/roles";

/**
 * MOCK bildirishnomalar. Matnlar tarjima kalitlari orqali olinadi:
 * notifications.items.<key>.title / .body. Haqiqiy API ulanganda almashtiriladi.
 */
export type NotificationItem = {
  id: string;
  key: string;
  /** Necha daqiqa oldin (namuna). */
  minutesAgo: number;
};

export const NOTIFICATIONS_BY_ROLE: Record<Role, readonly NotificationItem[]> = {
  admin: [
    { id: "a1", key: "roleChange", minutesAgo: 25 },
    { id: "a2", key: "passwordReset", minutesAgo: 70 },
    { id: "a3", key: "newUser", minutesAgo: 240 },
  ],
  manager: [
    { id: "m1", key: "approvalWaiting", minutesAgo: 12 },
    { id: "m2", key: "taskLate", minutesAgo: 95 },
    { id: "m3", key: "reportReady", minutesAgo: 300 },
  ],
  employee: [
    { id: "e1", key: "taskAssigned", minutesAgo: 18 },
    { id: "e2", key: "deadlineSoon", minutesAgo: 120 },
    { id: "e3", key: "approved", minutesAgo: 420 },
  ],
};
