function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function isSupabaseEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function buildUrl(tableName, searchParams = {}) {
  const baseUrl = requireEnv("SUPABASE_URL").replace(/\/+$/, "");
  const url = new URL(`${baseUrl}/rest/v1/${tableName}`);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === null || typeof value === "undefined") {
      continue;
    }

    url.searchParams.set(key, value);
  }

  return url.toString();
}

function headers(extra = {}) {
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...extra
  };
}

export async function selectRows(tableName, { filters = {}, columns = "*", order = null, limit = null } = {}) {
  const params = { select: columns };

  for (const [key, value] of Object.entries(filters)) {
    params[key] = value;
  }

  if (order) {
    params.order = order;
  }

  if (limit) {
    params.limit = String(limit);
  }

  const response = await fetch(buildUrl(tableName, params), {
    method: "GET",
    headers: headers()
  });

  if (!response.ok) {
    throw new Error(`Supabase select failed for ${tableName}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function upsertRows(tableName, rows, { onConflict } = {}) {
  const params = {};

  if (onConflict) {
    params.on_conflict = onConflict;
  }

  const response = await fetch(buildUrl(tableName, params), {
    method: "POST",
    headers: headers({
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    }),
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    throw new Error(`Supabase upsert failed for ${tableName}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function deleteRows(tableName, { filters = {} } = {}) {
  const response = await fetch(buildUrl(tableName, filters), {
    method: "DELETE",
    headers: headers({
      Prefer: "return=minimal"
    })
  });

  if (!response.ok) {
    throw new Error(`Supabase delete failed for ${tableName}: ${response.status} ${await response.text()}`);
  }
}
