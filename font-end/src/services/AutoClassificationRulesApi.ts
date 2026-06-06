import { apiCall } from '../configs/axios';

const PREFIX = '/resource-management';
const LEGACY_STORAGE_KEY = 'rm_auto_classification_rules_v1';

export type AutoMatchField = 'name' | 'extension';
export type AutoMatchOp = 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex';

export interface AutoClassificationRule {
  id: string;
  sortOrder: number;
  enabled: boolean;
  title: string;
  matchField: AutoMatchField;
  matchOp: AutoMatchOp;
  pattern: string;
  assignStageId?: string;
  assignProductTypeId?: string;
  assignPlatformId?: string;
  assignTagId?: string;
  assignStatusId?: string;
  assignRepoId?: string;
}

interface ApiEnvelope<T> {
  code: string;
  data?: T;
  message?: string;
}

interface ApiRow {
  id: string;
  user_id: string;
  sort_order: number;
  enabled: boolean;
  title: string;
  match_field: string;
  match_op: string;
  pattern: string;
  assign_stage_id?: string | null;
  assign_product_type_id?: string | null;
  assign_platform_id?: string | null;
  assign_tag_id?: string | null;
  assign_status_id?: string | null;
  assign_repo_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const OPS: AutoMatchOp[] = ['contains', 'startsWith', 'endsWith', 'equals', 'regex'];

function fromApiRow(r: ApiRow): AutoClassificationRule {
  const op = String(r.match_op);
  return {
    id: String(r.id),
    sortOrder: Number(r.sort_order ?? 0),
    enabled: r.enabled !== false,
    title: String(r.title ?? ''),
    matchField: r.match_field === 'extension' ? 'extension' : 'name',
    matchOp: (OPS.includes(op as AutoMatchOp) ? op : 'contains') as AutoMatchOp,
    pattern: String(r.pattern ?? ''),
    assignStageId: r.assign_stage_id || undefined,
    assignProductTypeId: r.assign_product_type_id || undefined,
    assignPlatformId: r.assign_platform_id || undefined,
    assignTagId: r.assign_tag_id || undefined,
    assignStatusId: r.assign_status_id || undefined,
    assignRepoId: r.assign_repo_id || undefined,
  };
}

export function ruleToBulkItemSnake(r: AutoClassificationRule) {
  return {
    title: r.title.trim(),
    match_field: r.matchField,
    match_op: r.matchOp,
    pattern: r.pattern.trim(),
    enabled: r.enabled,
    assign_stage_id: r.assignStageId ?? null,
    assign_product_type_id: r.assignProductTypeId ?? null,
    assign_platform_id: r.assignPlatformId ?? null,
    assign_tag_id: r.assignTagId ?? null,
    assign_status_id: r.assignStatusId ?? null,
    assign_repo_id: r.assignRepoId ?? null,
  };
}

export function normalizeImportedObject(o: Record<string, unknown>): AutoClassificationRule | null {
  const title = String(o.title ?? '').trim();
  const pattern = String(o.pattern ?? '').trim();
  if (!title || !pattern) return null;
  const mf = o.match_field === 'extension' || o.matchField === 'extension' ? 'extension' : 'name';
  const rawOp = String(o.match_op ?? o.matchOp ?? 'contains');
  const matchOp = (OPS.includes(rawOp as AutoMatchOp) ? rawOp : 'contains') as AutoMatchOp;
  return {
    id: '',
    sortOrder: Number(o.sort_order ?? o.sortOrder ?? 0),
    enabled: o.enabled !== false,
    title,
    matchField: mf as AutoMatchField,
    matchOp,
    pattern,
    assignStageId: (o.assign_stage_id ?? o.assignStageId) as string | undefined,
    assignProductTypeId: (o.assign_product_type_id ?? o.assignProductTypeId) as string | undefined,
    assignPlatformId: (o.assign_platform_id ?? o.assignPlatformId) as string | undefined,
    assignTagId: (o.assign_tag_id ?? o.assignTagId) as string | undefined,
    assignStatusId: (o.assign_status_id ?? o.assignStatusId) as string | undefined,
    assignRepoId: (o.assign_repo_id ?? o.assignRepoId) as string | undefined,
  };
}

export async function migrateLegacyFromLocalStorage(): Promise<void> {
  const existing = await AutoClassificationRulesApi.list();
  if (existing.length > 0) return;
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return;
    const normalized: AutoClassificationRule[] = [];
    data.forEach((item: unknown, i: number) => {
      if (!item || typeof item !== 'object') return;
      const r = normalizeImportedObject(item as Record<string, unknown>);
      if (r) normalized.push({ ...r, sortOrder: r.sortOrder || i });
    });
    if (normalized.length === 0) return;
    const ok = await AutoClassificationRulesApi.bulkReplace(normalized);
    if (ok) localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const AutoClassificationRulesApi = {
  async list(): Promise<AutoClassificationRule[]> {
    try {
      const res = await apiCall.get<ApiEnvelope<ApiRow[]>>(`${PREFIX}/auto_classification_rules`);
      if (res.data?.code === 'BE0000' && Array.isArray(res.data.data)) {
        return res.data.data.map(fromApiRow);
      }
      return [];
    } catch (e) {
      console.error('auto_classification_rules list', e);
      return [];
    }
  },

  async create(
    r: Omit<AutoClassificationRule, 'id'> & { sortOrder: number }
  ): Promise<AutoClassificationRule | null> {
    try {
      const res = await apiCall.post<ApiEnvelope<ApiRow>>(`${PREFIX}/auto_classification_rules`, {
        title: r.title.trim(),
        match_field: r.matchField,
        match_op: r.matchOp,
        pattern: r.pattern.trim(),
        enabled: r.enabled,
        sort_order: r.sortOrder,
        assign_stage_id: r.assignStageId ?? null,
        assign_product_type_id: r.assignProductTypeId ?? null,
        assign_platform_id: r.assignPlatformId ?? null,
        assign_tag_id: r.assignTagId ?? null,
        assign_status_id: r.assignStatusId ?? null,
        assign_repo_id: r.assignRepoId ?? null,
      });
      if (res.data?.code === 'BE0000' && res.data.data) {
        return fromApiRow(res.data.data);
      }
      return null;
    } catch (e) {
      console.error('auto_classification_rules create', e);
      return null;
    }
  },

  async updateFull(rule: AutoClassificationRule): Promise<boolean> {
    try {
      const res = await apiCall.put<ApiEnvelope<ApiRow>>(
        `${PREFIX}/auto_classification_rules/${rule.id}`,
        {
          title: rule.title.trim(),
          match_field: rule.matchField,
          match_op: rule.matchOp,
          pattern: rule.pattern.trim(),
          enabled: rule.enabled,
          sort_order: rule.sortOrder,
          assign_stage_id: rule.assignStageId ?? null,
          assign_product_type_id: rule.assignProductTypeId ?? null,
          assign_platform_id: rule.assignPlatformId ?? null,
          assign_tag_id: rule.assignTagId ?? null,
          assign_status_id: rule.assignStatusId ?? null,
          assign_repo_id: rule.assignRepoId ?? null,
        }
      );
      return res.data?.code === 'BE0000';
    } catch (e) {
      console.error('auto_classification_rules update', e);
      return false;
    }
  },

  async updateEnabled(id: string, enabled: boolean): Promise<boolean> {
    try {
      const res = await apiCall.put<ApiEnvelope<unknown>>(
        `${PREFIX}/auto_classification_rules/${id}`,
        { enabled }
      );
      return res.data?.code === 'BE0000';
    } catch (e) {
      console.error('auto_classification_rules update enabled', e);
      return false;
    }
  },

  async remove(id: string): Promise<boolean> {
    try {
      const res = await apiCall.delete<ApiEnvelope<unknown>>(
        `${PREFIX}/auto_classification_rules/${id}`
      );
      return res.data?.code === 'BE0000';
    } catch (e) {
      console.error('auto_classification_rules delete', e);
      return false;
    }
  },

  async reorder(orderedIds: string[]): Promise<AutoClassificationRule[] | null> {
    try {
      const res = await apiCall.put<ApiEnvelope<ApiRow[]>>(`${PREFIX}/auto_classification_rules/reorder`, {
        ordered_ids: orderedIds,
      });
      if (res.data?.code === 'BE0000' && Array.isArray(res.data.data)) {
        return res.data.data.map(fromApiRow);
      }
      return null;
    } catch (e) {
      console.error('auto_classification_rules reorder', e);
      return null;
    }
  },

  async bulkReplace(rules: AutoClassificationRule[]): Promise<boolean> {
    try {
      const items = rules.map(ruleToBulkItemSnake);
      const res = await apiCall.post<ApiEnvelope<ApiRow[]>>(
        `${PREFIX}/auto_classification_rules/bulk_replace`,
        { rules: items }
      );
      return res.data?.code === 'BE0000';
    } catch (e) {
      console.error('auto_classification_rules bulk_replace', e);
      return false;
    }
  },
};
