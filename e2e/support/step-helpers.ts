import { DataTable } from '@cucumber/cucumber';

export function parseDataTable(table: DataTable): Record<string, any> {
  const data: Record<string, any> = {};
  for (const [key, value] of table.raw()) {
    if (value === 'true') data[key] = true;
    else if (value === 'false') data[key] = false;
    else if (value === 'current-entity') data[key] = null;
    else if (value === 'different-entity') data[key] = null;
    else data[key] = value;
  }
  return data;
}

export function buildQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}
