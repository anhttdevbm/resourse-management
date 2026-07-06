import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageHeading from '../components/heading';
import {
  AutoClassificationRulesApi,
  migrateLegacyFromLocalStorage,
  normalizeImportedObject,
  ruleToBulkItemSnake,
  type AutoClassificationRule,
  type AutoMatchField,
  type AutoMatchOp,
} from '../services/AutoClassificationRulesApi';
import { ResourceService, type Resource, type ResourceUploadOptions, isValidUuid } from '../services/ResourceService';
import { useAuth } from '../contexts/AuthContext';
import {
  FaSearch,
  FaTimes,
  FaTrash,
  FaPlus,
  FaEdit,
  FaLayerGroup,
  FaTags,
  FaFilter,
  FaRobot,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaMagic,
  FaDownload,
  FaUpload,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';

type TabKey = 'rules' | 'preview';

const MATCH_FIELD_LABEL: Record<AutoMatchField, string> = {
  name: 'Tên tài nguyên',
  extension: 'Phần mở rộng file',
};

const MATCH_OP_LABEL: Record<AutoMatchOp, string> = {
  contains: 'chứa',
  startsWith: 'bắt đầu bằng',
  endsWith: 'kết thúc bằng',
  equals: 'khớp chính xác',
  regex: 'regex',
};

function fileExtensionFromResource(res: Resource): string {
  const name = res.name || '';
  let ext = name.includes('.') ? (name.split('.').pop() || '') : '';
  if (!ext && res.url) {
    try {
      const path = res.url.split('?')[0];
      const base = path.split('/').pop() || '';
      ext = base.includes('.') ? (base.split('.').pop() || '') : '';
    } catch {
      /* ignore */
    }
  }
  return ext.replace(/^\./, '').toLowerCase();
}

function ruleMatches(rule: AutoClassificationRule, res: Resource): boolean {
  const rawPattern = rule.pattern?.trim() ?? '';
  if (!rawPattern) return false;
  const ext = fileExtensionFromResource(res);
  const nameVal = res.name || '';
  const haystackRaw = rule.matchField === 'extension' ? ext : nameVal;
  const hay = rule.matchOp === 'regex' ? haystackRaw : haystackRaw.toLowerCase();
  const needle = rule.matchOp === 'regex' ? rawPattern : rawPattern.toLowerCase();
  try {
    switch (rule.matchOp) {
      case 'contains':
        return hay.includes(needle);
      case 'startsWith':
        return hay.startsWith(needle);
      case 'endsWith':
        return hay.endsWith(needle);
      case 'equals':
        return hay === needle;
      case 'regex':
        return new RegExp(rawPattern, 'i').test(haystackRaw);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function pickFirstMatchingRule(
  rules: AutoClassificationRule[],
  res: Resource
): AutoClassificationRule | null {
  const list = [...rules].filter((r) => r.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  for (const r of list) {
    if (ruleMatches(r, res)) return r;
  }
  return null;
}

function currentStageId(res: Resource): string | undefined {
  return res.stage_id || res.resource_stage?.id;
}
function currentStatusId(res: Resource): string | undefined {
  return res.status_id || res.resource_status?.id;
}
function currentPlatformId(res: Resource): string | undefined {
  return res.platform_id || res.resource_platform?.id;
}
function currentProductTypeId(res: Resource): string | undefined {
  return res.product_type_id || res.product_type?.id;
}
function currentRepoId(res: Resource): string | undefined {
  return res.repo_id || res.package_repo?.id;
}
function currentTagId(res: Resource): string | undefined {
  return res.tag_id || res.resource_tags?.[0]?.id;
}

function buildPatchFromRule(rule: AutoClassificationRule, res: Resource): Partial<Resource> | null {
  const patch: Partial<Resource> = {};
  const add = (
    key: 'stage_id' | 'status_id' | 'platform_id' | 'product_type_id' | 'repo_id' | 'tag_id',
    ruleId: string | undefined,
    current: string | undefined
  ) => {
    if (!ruleId || !isValidUuid(ruleId)) return;
    if (current !== ruleId) patch[key] = ruleId;
  };
  add('stage_id', rule.assignStageId, currentStageId(res));
  add('status_id', rule.assignStatusId, currentStatusId(res));
  add('platform_id', rule.assignPlatformId, currentPlatformId(res));
  add('product_type_id', rule.assignProductTypeId, currentProductTypeId(res));
  add('repo_id', rule.assignRepoId, currentRepoId(res));
  add('tag_id', rule.assignTagId, currentTagId(res));
  return Object.keys(patch).length ? patch : null;
}

function summarizeRule(r: AutoClassificationRule): string {
  const field = MATCH_FIELD_LABEL[r.matchField];
  const op = MATCH_OP_LABEL[r.matchOp];
  return `${field} ${op} "${r.pattern || '…'}"`;
}

function optionName(opts: { id: string; name: string }[], id?: string): string {
  if (!id) return '';
  return opts.find((o) => o.id === id)?.name ?? id.slice(0, 8);
}

function describePatch(
  patch: Partial<Resource>,
  opts: ResourceUploadOptions | null
): { key: string; label: string }[] {
  if (!opts) {
    return Object.keys(patch).map((k) => ({ key: k, label: k }));
  }
  const out: { key: string; label: string }[] = [];
  if (patch.stage_id) out.push({ key: 'stage_id', label: `Giai đoạn → ${optionName(opts.stages, patch.stage_id)}` });
  if (patch.status_id) out.push({ key: 'status_id', label: `Trạng thái → ${optionName(opts.statuses, patch.status_id)}` });
  if (patch.platform_id)
    out.push({ key: 'platform_id', label: `Nền tảng → ${optionName(opts.platforms, patch.platform_id)}` });
  if (patch.product_type_id)
    out.push({ key: 'product_type_id', label: `Loại SP → ${optionName(opts.productTypes, patch.product_type_id)}` });
  if (patch.repo_id) out.push({ key: 'repo_id', label: `Kho → ${optionName(opts.repos, patch.repo_id)}` });
  if (patch.tag_id) out.push({ key: 'tag_id', label: `Thẻ → ${optionName(opts.tags, patch.tag_id)}` });
  return out;
}

const emptyForm: Omit<AutoClassificationRule, 'id' | 'sortOrder'> = {
  enabled: true,
  title: '',
  matchField: 'name',
  matchOp: 'contains',
  pattern: '',
  assignStageId: undefined,
  assignProductTypeId: undefined,
  assignPlatformId: undefined,
  assignTagId: undefined,
  assignStatusId: undefined,
  assignRepoId: undefined,
};

const CategoryAutoClassification: React.FC = () => {
  const { hasPermission } = useAuth();
  const canApply = hasPermission('manage_resources');

  const [tab, setTab] = useState<TabKey>('rules');
  const [rules, setRules] = useState<AutoClassificationRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [options, setOptions] = useState<ResourceUploadOptions | null>(null);
  const [searchRules, setSearchRules] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [searchPreview, setSearchPreview] = useState('');
  const [bulkApplying, setBulkApplying] = useState(false);

  const [modal, setModal] = useState<
    | ({ mode: 'create' } & typeof emptyForm)
    | ({ mode: 'edit'; id: string } & typeof emptyForm)
    | null
  >(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const breadcrumb = { title: 'Phân loại tự động', route: '/categories/auto' };

  const reloadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      await migrateLegacyFromLocalStorage();
      const data = await AutoClassificationRulesApi.list();
      setRules(data);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được quy tắc từ máy chủ.');
    } finally {
      setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadRules();
  }, [reloadRules]);

  const loadOptions = useCallback(async () => {
    const empty: ResourceUploadOptions = {
      stages: [],
      statuses: [],
      platforms: [],
      productTypes: [],
      repos: [],
      tags: [],
    };
    try {
      const o = await ResourceService.getResourceUploadOptions();
      setOptions(o);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh mục gán (stage, tag, …).');
      setOptions(empty);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const filteredRules = useMemo(() => {
    const q = searchRules.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.pattern.toLowerCase().includes(q) ||
        summarizeRule(r).toLowerCase().includes(q)
    );
  }, [rules, searchRules]);

  const stats = useMemo(() => {
    const enabled = rules.filter((r) => r.enabled).length;
    return { total: rules.length, enabled };
  }, [rules]);

  const previewRows = useMemo(() => {
    const q = searchPreview.trim().toLowerCase();
    const list = q
      ? resources.filter((r) => (r.name || '').toLowerCase().includes(q) || (r.version || '').includes(q))
      : resources;
    return list.map((res) => {
      const matched = pickFirstMatchingRule(rules, res);
      const patch = matched ? buildPatchFromRule(matched, res) : null;
      return { res, matched, patch };
    });
  }, [resources, rules, searchPreview]);

  const previewStats = useMemo(() => {
    const withRule = previewRows.filter((x) => x.matched).length;
    const needApply = previewRows.filter((x) => x.patch && Object.keys(x.patch).length).length;
    return { withRule, needApply, loaded: resources.length };
  }, [previewRows, resources.length]);

  const loadResources = async () => {
    setResLoading(true);
    try {
      const data = await ResourceService.getResources();
      setResources(data);
      toast.success(`Đã tải ${data.length} tài nguyên.`);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được danh sách tài nguyên.');
    } finally {
      setResLoading(false);
    }
  };

  const moveRule = async (id: string, dir: -1 | 1) => {
    const sorted = [...rules].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((r) => r.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= sorted.length) return;
    const swapped = [...sorted];
    [swapped[idx], swapped[j]] = [swapped[j], swapped[idx]];
    const orderedIds = swapped.map((r) => r.id);
    setActionLoading(true);
    try {
      const updated = await AutoClassificationRulesApi.reorder(orderedIds);
      if (updated) {
        setRules(updated);
        toast.success('Đã cập nhật thứ tự.');
      } else {
        toast.error('Không lưu được thứ tự. Thử tải lại trang.');
        await reloadRules();
      }
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi đổi thứ tự.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = () => {
    setModal({
      mode: 'create',
      ...emptyForm,
    });
  };

  const openEdit = (r: AutoClassificationRule) => {
    setModal({
      mode: 'edit',
      id: r.id,
      enabled: r.enabled,
      title: r.title,
      matchField: r.matchField,
      matchOp: r.matchOp,
      pattern: r.pattern,
      assignStageId: r.assignStageId,
      assignProductTypeId: r.assignProductTypeId,
      assignPlatformId: r.assignPlatformId,
      assignTagId: r.assignTagId,
      assignStatusId: r.assignStatusId,
      assignRepoId: r.assignRepoId,
    });
  };

  const submitModal = async () => {
    if (!modal) return;
    const title = modal.title.trim();
    const pattern = modal.pattern.trim();
    if (!title) {
      toast.warning('Nhập tên quy tắc.');
      return;
    }
    if (!pattern) {
      toast.warning('Nhập mẫu khớp (pattern).');
      return;
    }
    setActionLoading(true);
    try {
      if (modal.mode === 'create') {
        const maxOrder = rules.reduce((m, r) => Math.max(m, r.sortOrder), -1);
        const created = await AutoClassificationRulesApi.create({
          enabled: modal.enabled,
          title,
          matchField: modal.matchField,
          matchOp: modal.matchOp,
          pattern,
          sortOrder: maxOrder + 1,
          assignStageId: modal.assignStageId || undefined,
          assignProductTypeId: modal.assignProductTypeId || undefined,
          assignPlatformId: modal.assignPlatformId || undefined,
          assignTagId: modal.assignTagId || undefined,
          assignStatusId: modal.assignStatusId || undefined,
          assignRepoId: modal.assignRepoId || undefined,
        });
        if (created) {
          toast.success('Đã thêm quy tắc.');
          setModal(null);
          await reloadRules();
        } else {
          toast.error('Không tạo được quy tắc. Kiểm tra dữ liệu gán (thẻ, kho…) và quyền tài khoản.');
        }
      } else {
        const existing = rules.find((x) => x.id === modal.id);
        const sortOrder = existing?.sortOrder ?? 0;
        const updatedRule: AutoClassificationRule = {
          id: modal.id,
          sortOrder,
          enabled: modal.enabled,
          title,
          matchField: modal.matchField,
          matchOp: modal.matchOp,
          pattern,
          assignStageId: modal.assignStageId || undefined,
          assignProductTypeId: modal.assignProductTypeId || undefined,
          assignPlatformId: modal.assignPlatformId || undefined,
          assignTagId: modal.assignTagId || undefined,
          assignStatusId: modal.assignStatusId || undefined,
          assignRepoId: modal.assignRepoId || undefined,
        };
        const ok = await AutoClassificationRulesApi.updateFull(updatedRule);
        if (ok) {
          toast.success('Đã cập nhật quy tắc.');
          setModal(null);
          await reloadRules();
        } else {
          toast.error('Cập nhật thất bại.');
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const ok = await AutoClassificationRulesApi.remove(deleteId);
      if (ok) {
        toast.success('Đã xóa quy tắc.');
        setDeleteId(null);
        await reloadRules();
      } else {
        toast.error('Không xóa được quy tắc.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const toggleEnabled = async (r: AutoClassificationRule) => {
    const ok = await AutoClassificationRulesApi.updateEnabled(r.id, !r.enabled);
    if (ok) {
      setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
    } else {
      toast.error('Không cập nhật được trạng thái bật/tắt.');
    }
  };

  const exportJson = () => {
    const payload = { rules: rules.map(ruleToBulkItemSnake) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auto-classification-rules-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info('Đã xuất file JSON.');
  };

  const importInputRef = React.useRef<HTMLInputElement>(null);
  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setActionLoading(true);
      try {
        const parsed = JSON.parse(String(reader.result));
        const rawList: unknown[] = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === 'object' && Array.isArray((parsed as { rules?: unknown[] }).rules)
            ? (parsed as { rules: unknown[] }).rules
            : [];
        if (rawList.length === 0) {
          toast.error('File không hợp lệ (cần { "rules": [...] } hoặc mảng quy tắc).');
          return;
        }
        const merged: AutoClassificationRule[] = [];
        rawList.forEach((item, i) => {
          if (!item || typeof item !== 'object') return;
          const r = normalizeImportedObject(item as Record<string, unknown>);
          if (r) merged.push({ ...r, sortOrder: r.sortOrder || i });
        });
        if (merged.length === 0) {
          toast.error('Không có quy tắc hợp lệ (cần title và pattern).');
          return;
        }
        const ok = await AutoClassificationRulesApi.bulkReplace(merged);
        if (ok) {
          toast.success(`Đã nhập ${merged.length} quy tắc lên máy chủ.`);
          await reloadRules();
        } else {
          toast.error('Nhập thất bại. Kiểm tra quy tắc gán (id thẻ/kho phải của bạn).');
        }
      } catch {
        toast.error('Không đọc được JSON.');
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const applyOne = async (res: Resource, patch: Partial<Resource>) => {
    try {
      const updated = await ResourceService.updateResource(res.id, patch);
      if (updated) {
        setResources((prev) => prev.map((x) => (x.id === res.id ? { ...x, ...patch } : x)));
        toast.success(`Đã cập nhật "${res.name}".`);
      } else {
        toast.error('Cập nhật thất bại.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật tài nguyên.');
    }
  };

  const applyBulk = async () => {
    if (!canApply) return;
    const targets = previewRows.filter((x) => x.patch && Object.keys(x.patch).length);
    if (targets.length === 0) {
      toast.info('Không có dòng nào cần áp dụng.');
      return;
    }
    setBulkApplying(true);
    let ok = 0;
    let fail = 0;
    for (const { res, patch } of targets) {
      if (!patch) continue;
      try {
        const updated = await ResourceService.updateResource(res.id, patch);
        if (updated) {
          ok++;
          setResources((prev) => prev.map((x) => (x.id === res.id ? { ...x, ...patch } : x)));
        } else fail++;
      } catch {
        fail++;
      }
    }
    setBulkApplying(false);
    toast.success(`Hoàn tất: ${ok} thành công${fail ? `, ${fail} lỗi` : ''}.`);
  };

  const selectEl = (
    label: string,
    value: string | undefined,
    onChange: (v: string | undefined) => void,
    opts: { id: string; name: string }[]
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
      >
        <option value="">— Không gán —</option>
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageHeading breadcrumb={breadcrumb} />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-1 lg:max-w-[min(100%,42rem)]">
            <h2 className="text-xl font-semibold text-gray-900">Phân loại tự động</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Định nghĩa quy tắc theo <strong className="text-gray-700">tên</strong> hoặc{' '}
              <strong className="text-gray-700">phần mở rộng</strong> tài nguyên, gán giai đoạn / nền tảng /
              thẻ / … Thứ tự quy tắc từ trên xuống: quy tắc khớp <em>đầu tiên</em> được áp dụng khi xem trước.
              Quy tắc được <strong className="text-gray-700">lưu trên máy chủ theo tài khoản</strong> (đồng bộ
              khi đăng nhập cùng tài khoản). Áp dụng gợi ý lên tài nguyên chỉ dành cho tài khoản có quyền{' '}
              <span className="font-medium text-gray-700">quản lý tài nguyên</span>.
            </p>
          </div>
          <nav
            aria-label="Liên kết danh mục"
            className="grid w-full shrink-0 grid-cols-1 gap-2 sm:max-w-lg sm:grid-cols-3 sm:gap-3 lg:ml-auto lg:max-w-xl"
          >
            <Link
              to="/categories"
              className="flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-xs font-semibold leading-tight text-gray-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-900 sm:min-h-[3.25rem] sm:text-sm"
            >
              <FaLayerGroup className="h-4 w-4 shrink-0 text-blue-600 opacity-90" aria-hidden />
              <span>Danh mục chính</span>
            </Link>
            <Link
              to="/categories/tags"
              className="flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-xs font-semibold leading-tight text-gray-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-900 sm:min-h-[3.25rem] sm:text-sm"
            >
              <FaTags className="h-4 w-4 shrink-0 text-indigo-600 opacity-90" aria-hidden />
              <span>Tags &amp; Labels</span>
            </Link>
            <Link
              to="/filters"
              className="flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center text-xs font-semibold leading-tight text-gray-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-900 sm:min-h-[3.25rem] sm:text-sm"
            >
              <FaFilter className="h-4 w-4 shrink-0 text-emerald-600 opacity-90" aria-hidden />
              <span>Bộ lọc</span>
            </Link>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tổng quy tắc</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                <FaRobot className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Đang bật</p>
                <p className="text-2xl font-semibold text-green-600">{stats.enabled}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <FaMagic className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-start gap-3 text-sm text-gray-600">
            <FaExclamationTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Regex sai cú pháp sẽ không khớp. Kiểm tra tab <strong>Xem trước</strong> trước khi áp dụng hàng
              loạt. Nhập/xuất JSON thay thế toàn bộ quy tắc trên server (cùng định dạng API).
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
              tab === 'rules'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FaRobot className="w-4 h-4" />
            Quy tắc
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
              tab === 'preview'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FaEye className="w-4 h-4" />
            Xem trước &amp; áp dụng
          </button>
        </div>

        {tab === 'rules' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="flex-1 relative max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchRules}
                    onChange={(e) => setSearchRules(e.target.value)}
                    placeholder="Tìm theo tên quy tắc hoặc pattern..."
                    className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {searchRules && (
                    <button
                      type="button"
                      onClick={() => setSearchRules('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={exportJson}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                  >
                    <FaDownload className="w-4 h-4" />
                    Xuất JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                  >
                    <FaUpload className="w-4 h-4" />
                    Nhập JSON
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={onImportFile}
                  />
                  <button
                    type="button"
                    onClick={openCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                  >
                    <FaPlus className="w-4 h-4" />
                    Thêm quy tắc
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {rulesLoading ? (
                <div className="py-16 text-center text-sm text-gray-500">Đang tải quy tắc…</div>
              ) : filteredRules.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <FaRobot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchRules ? 'Không có quy tắc khớp' : 'Chưa có quy tắc nào'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    {searchRules
                      ? 'Thử từ khóa khác hoặc xóa ô tìm kiếm.'
                      : 'Ví dụ: tên chứa "release" → gán giai đoạn Production; phần mở rộng "apk" → nền tảng Android.'}
                  </p>
                  {!searchRules && (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <FaPlus className="w-4 h-4" />
                      Tạo quy tắc đầu tiên
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                          Thứ tự
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
                          Bật
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tên &amp; điều kiện
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Gán
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-44">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...filteredRules]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((r) => {
                          const assigns: string[] = [];
                          if (options) {
                            if (r.assignStageId) assigns.push(`GD: ${optionName(options.stages, r.assignStageId)}`);
                            if (r.assignPlatformId)
                              assigns.push(`PF: ${optionName(options.platforms, r.assignPlatformId)}`);
                            if (r.assignProductTypeId)
                              assigns.push(`LSP: ${optionName(options.productTypes, r.assignProductTypeId)}`);
                            if (r.assignTagId) assigns.push(`Thẻ: ${optionName(options.tags, r.assignTagId)}`);
                            if (r.assignStatusId)
                              assigns.push(`TT: ${optionName(options.statuses, r.assignStatusId)}`);
                            if (r.assignRepoId) assigns.push(`Kho: ${optionName(options.repos, r.assignRepoId)}`);
                          } else if (
                            r.assignStageId ||
                            r.assignPlatformId ||
                            r.assignProductTypeId ||
                            r.assignTagId
                          ) {
                            assigns.push('(đang tải danh mục…)');
                          }
                          return (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3">
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    title="Lên"
                                    onClick={() => moveRule(r.id, -1)}
                                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
                                  >
                                    <FaArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Xuống"
                                    onClick={() => moveRule(r.id, 1)}
                                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
                                  >
                                    <FaArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => toggleEnabled(r)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    r.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      r.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-gray-900">{r.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{summarizeRule(r)}</p>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-700 max-w-xs">
                                {assigns.length ? assigns.join(' · ') : '—'}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openEdit(r)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm mr-1"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteId(r.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'preview' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadResources}
                    disabled={resLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaSearch className="w-4 h-4" />
                    {resLoading ? 'Đang tải…' : 'Tải danh sách tài nguyên'}
                  </button>
                  {canApply && previewStats.needApply > 0 && (
                    <button
                      type="button"
                      onClick={applyBulk}
                      disabled={bulkApplying}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <FaCheck className="w-4 h-4" />
                      {bulkApplying ? 'Đang áp dụng…' : `Áp dụng hàng loạt (${previewStats.needApply})`}
                    </button>
                  )}
                </div>
                <div className="flex-1 relative max-w-md lg:max-w-xs ml-auto">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Lọc theo tên / version…"
                    className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={!resources.length}
                  />
                  {searchPreview && (
                    <button
                      type="button"
                      onClick={() => setSearchPreview('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Đã tải: <strong>{previewStats.loaded}</strong> · Khớp ít nhất một quy tắc:{' '}
                <strong>{previewStats.withRule}</strong> · Cần cập nhật API:{' '}
                <strong>{previewStats.needApply}</strong>
                {!canApply && (
                  <span className="text-amber-700 ml-2">
                    (Bạn chỉ có quyền xem; cần quyền quản lý tài nguyên để áp dụng.)
                  </span>
                )}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {!resources.length ? (
                <div className="py-16 text-center text-sm text-gray-500">
                  Nhấn &quot;Tải danh sách tài nguyên&quot; để xem trước khớp quy tắc.
                </div>
              ) : previewRows.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500">Không có dòng nào khớp bộ lọc.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tài nguyên
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                          Ext.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quy tắc khớp
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Thay đổi đề xuất
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-36">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map(({ res, matched, patch }) => (
                        <tr key={res.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              to={`/resources/${res.id}`}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              {res.name}
                            </Link>
                            <p className="text-xs text-gray-500">v{res.version}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                            .{fileExtensionFromResource(res) || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {matched ? (
                              <>
                                <span className="font-medium">{matched.title}</span>
                                <p className="text-xs text-gray-500">{summarizeRule(matched)}</p>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {!patch || !Object.keys(patch).length ? (
                              <span className="text-gray-400">Không đổi</span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {describePatch(patch, options).map(({ key, label }) => (
                                  <span
                                    key={key}
                                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-left"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canApply && patch && Object.keys(patch).length > 0 ? (
                              <button
                                type="button"
                                onClick={() => applyOne(res, patch)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                              >
                                Áp dụng
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {modal && options !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {modal.mode === 'create' ? 'Thêm quy tắc' : 'Sửa quy tắc'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Chỉ các trường bạn chọn bên dưới mới được đưa vào bản vá khi áp dụng.
            </p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên quy tắc</label>
                <input
                  type="text"
                  value={modal.title}
                  onChange={(e) => setModal({ ...modal, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: APK nội bộ"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trường khớp</label>
                  <select
                    value={modal.matchField}
                    onChange={(e) =>
                      setModal({ ...modal, matchField: e.target.value as AutoMatchField })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="name">Tên tài nguyên</option>
                    <option value="extension">Phần mở rộng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kiểu khớp</label>
                  <select
                    value={modal.matchOp}
                    onChange={(e) => setModal({ ...modal, matchOp: e.target.value as AutoMatchOp })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="contains">Chứa</option>
                    <option value="startsWith">Bắt đầu bằng</option>
                    <option value="endsWith">Kết thúc bằng</option>
                    <option value="equals">Khớp chính xác</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                <input
                  type="text"
                  value={modal.pattern}
                  onChange={(e) => setModal({ ...modal, pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder={modal.matchOp === 'regex' ? '^release-.*' : 'internal'}
                />
              </div>

              {selectEl('Giai đoạn', modal.assignStageId, (v) => setModal({ ...modal, assignStageId: v }), options.stages)}
              {selectEl('Loại sản phẩm', modal.assignProductTypeId, (v) => setModal({ ...modal, assignProductTypeId: v }), options.productTypes)}
              {selectEl('Nền tảng', modal.assignPlatformId, (v) => setModal({ ...modal, assignPlatformId: v }), options.platforms)}
              {selectEl('Trạng thái', modal.assignStatusId, (v) => setModal({ ...modal, assignStatusId: v }), options.statuses)}
              {selectEl('Kho', modal.assignRepoId, (v) => setModal({ ...modal, assignRepoId: v }), options.repos)}
              {selectEl('Thẻ (tag)', modal.assignTagId, (v) => setModal({ ...modal, assignTagId: v }), options.tags)}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && !options && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 text-sm text-gray-600">Đang tải danh mục…</div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa quy tắc?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Hành động không hoàn tác. Quy tắc sẽ bị xóa khỏi máy chủ cho tài khoản của bạn.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryAutoClassification;
