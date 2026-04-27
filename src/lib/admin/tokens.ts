// Token registry — store en memoria para los API tokens externos.
//
// Inicializa con valores de env vars (ANTHROPIC_API_KEY, REPLICATE_API_TOKEN).
// El admin puede sobreescribir vía PATCH /api/admin/tokens y los cambios
// duran mientras el server esté arriba (consistente con la decisión 1A
// del módulo admin de agentes).
//
// Restart → vuelven a los valores de env. "Restaurar" en la UI vuelve a env.
//
// Seguridad: los valores plenos NUNCA salen en GET. Se devuelven enmascarados
// (primeros 6 + últimos 4 chars) para mostrar al admin que están configurados
// sin filtrar el secret. PATCH acepta el valor pleno y lo guarda en memoria.

type TokenName = 'anthropic' | 'replicate';

const ENV_VALUES: Record<TokenName, string | undefined> = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  replicate: process.env.REPLICATE_API_TOKEN,
};

const store: Record<TokenName, string | undefined> = {
  anthropic: ENV_VALUES.anthropic,
  replicate: ENV_VALUES.replicate,
};

export function getAnthropicKey(): string | undefined {
  return store.anthropic;
}

export function getReplicateToken(): string | undefined {
  return store.replicate;
}

export function setToken(name: TokenName, value: string | null): void {
  if (value === null || value === '') {
    // Reset to env value (puede ser undefined si no había env).
    store[name] = ENV_VALUES[name];
    return;
  }
  if (typeof value !== 'string' || value.length < 8) {
    throw new Error(`Token "${name}" inválido: muy corto.`);
  }
  store[name] = value;
}

function maskToken(token: string | undefined): string {
  if (!token) return '(no configurado)';
  if (token.length < 12) return '••••';
  return `${token.slice(0, 6)}••••${token.slice(-4)}`;
}

export interface TokenStatus {
  configured: boolean;
  source: 'env' | 'override' | 'none';
  masked: string;
}

export function getTokenStatuses(): Record<TokenName, TokenStatus> {
  return (Object.keys(store) as TokenName[]).reduce(
    (acc, name) => {
      const current = store[name];
      const env = ENV_VALUES[name];
      const source: TokenStatus['source'] = !current
        ? 'none'
        : current === env
          ? 'env'
          : 'override';
      acc[name] = {
        configured: Boolean(current),
        source,
        masked: maskToken(current),
      };
      return acc;
    },
    {} as Record<TokenName, TokenStatus>,
  );
}
