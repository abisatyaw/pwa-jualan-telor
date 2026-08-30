import type {
  Asset,
  AssetInput,
  DashboardOverview,
  Debt,
  DebtInput,
  DropdownOption,
  EggPrice,
  Production,
  ProductionInput,
  Sale,
  SaleInput,
  Transaction,
  TransactionInput,
  User,
  UserCreateInput,
} from '../types';

const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:8001/api` : '/api';

// FastAPI returns `detail` as a plain string for HTTPException, but as an array of
// {loc, msg, type} objects for 422 validation errors. Flatten both to a readable
// string so callers never surface "[object Object]".
function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((e) => (e && typeof e === 'object' && 'msg' in e ? String((e as { msg: unknown }).msg) : null))
      .filter(Boolean);
    if (parts.length) return parts.join('; ');
  }
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(extractErrorMessage(body) ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function qs(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const api = {
  auth: {
    me: () => request<User>('/auth/me'),
    login: (username: string, password: string) =>
      request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },
  users: {
    list: () => request<User[]>('/users'),
    create: (data: UserCreateInput) => request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },
  assets: {
    list: (params: { asset_type?: string; search?: string } = {}) => request<Asset[]>(`/assets${qs(params)}`),
    get: (id: number) => request<Asset>(`/assets/${id}`),
    create: (data: AssetInput) => request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: AssetInput) =>
      request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ deleted: boolean }>(`/assets/${id}`, { method: 'DELETE' }),
  },
  productions: {
    list: (params: { date_from?: string; date_to?: string; chicken_group?: string } = {}) =>
      request<Production[]>(`/productions${qs(params)}`),
    get: (id: number) => request<Production>(`/productions/${id}`),
    create: (data: ProductionInput) =>
      request<Production>('/productions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: ProductionInput) =>
      request<Production>(`/productions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ deleted: boolean }>(`/productions/${id}`, { method: 'DELETE' }),
  },
  sales: {
    list: (
      params: {
        date_from?: string;
        date_to?: string;
        product_type?: string;
        payment_status?: string;
        search?: string;
      } = {}
    ) => request<Sale[]>(`/sales${qs(params)}`),
    get: (id: number) => request<Sale>(`/sales/${id}`),
    create: (data: SaleInput) => request<Sale>('/sales', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: SaleInput) =>
      request<Sale>(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    recordPayment: (id: number, paid_amount: number) =>
      request<Sale>(`/sales/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paid_amount }) }),
    remove: (id: number) => request<{ deleted: boolean }>(`/sales/${id}`, { method: 'DELETE' }),
  },
  transactions: {
    list: (params: { date_from?: string; date_to?: string; category?: string; search?: string } = {}) =>
      request<Transaction[]>(`/transactions${qs(params)}`),
    get: (id: number) => request<Transaction>(`/transactions/${id}`),
    create: (data: TransactionInput) =>
      request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: TransactionInput) =>
      request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ deleted: boolean }>(`/transactions/${id}`, { method: 'DELETE' }),
  },
  debts: {
    list: (params: { search?: string } = {}) => request<Debt[]>(`/debts${qs(params)}`),
    get: (id: number) => request<Debt>(`/debts/${id}`),
    create: (data: DebtInput) => request<Debt>('/debts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: DebtInput) =>
      request<Debt>(`/debts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    recordPayment: (id: number, paid_amount: number) =>
      request<Debt>(`/debts/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ paid_amount }) }),
    remove: (id: number) => request<{ deleted: boolean }>(`/debts/${id}`, { method: 'DELETE' }),
  },
  dashboard: (params: { period: string; from?: string; to?: string }) =>
    request<DashboardOverview>(`/dashboard${qs(params)}`),
  eggPrices: {
    list: () => request<EggPrice[]>('/egg-prices'),
    refresh: () => request<EggPrice[]>('/egg-prices/refresh', { method: 'POST' }),
  },
  settings: {
    listOptions: (listKey: string) =>
      request<DropdownOption[]>(`/settings/options${qs({ list_key: listKey })}`),
    createOption: (listKey: string, value: string) =>
      request<DropdownOption>('/settings/options', {
        method: 'POST',
        body: JSON.stringify({ list_key: listKey, value }),
      }),
    removeOption: (id: number) =>
      request<{ deleted: boolean }>(`/settings/options/${id}`, { method: 'DELETE' }),
    getKotakToKg: () => request<{ value: number }>('/settings/kotak-to-kg'),
    updateKotakToKg: (value: number) =>
      request<{ value: number }>('/settings/kotak-to-kg', { method: 'PUT', body: JSON.stringify({ value }) }),
  },
};
