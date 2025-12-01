export interface UserGroup {
  userId: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  assignedAt: string;
  assignedByUserId?: string;
}
