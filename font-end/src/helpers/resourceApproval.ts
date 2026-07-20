import type { Resource } from '../services/ResourceService';

export const PUBLIC_RESOURCE_STATUSES = new Set(['Approved']);

export function isApprovedResourceStatus(statusName?: string | null): boolean {
  return !!statusName && PUBLIC_RESOURCE_STATUSES.has(statusName);
}

export function isPendingResourceStatus(statusName?: string | null): boolean {
  return statusName === 'Pending';
}

export function isResourceOwner(resource: Resource, userId?: string | null): boolean {
  return !!userId && resource.user_id === userId;
}

export function canDownloadResource(
  resource: Resource,
  userId?: string | null,
  isAdmin = false
): boolean {
  if (isResourceOwner(resource, userId) || isAdmin) return true;
  return isApprovedResourceStatus(resource.resource_status?.name);
}

export function canShareResource(resource: Resource): boolean {
  return isApprovedResourceStatus(resource.resource_status?.name);
}
