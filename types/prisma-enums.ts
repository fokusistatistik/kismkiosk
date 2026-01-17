// Custom type definitions for Prisma models
// Since SQLite doesn't support enums, we define them here for type safety

export type KioskStatus = 'ACTIVE' | 'INACTIVE';

export type DeviceStatus = 'LOCKED' | 'OPEN';

export type UserRole = 'ADMIN' | 'USER';

export type LogDirection = 'IN' | 'OUT';

export type AnomalyFlag = 'MISSED_EXIT' | 'LATE_EXIT';

export type EntryMethod = 'QR' | 'MANUAL';

export type LogStatus = 'SUCCESS' | 'FAILED';
