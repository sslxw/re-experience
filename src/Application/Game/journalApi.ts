import { JournalProgress } from './journalGame';

export interface JournalUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    onboarded: boolean;
}

const BRIDGE_TIMEOUT_MS = 8000;

function getTerminalIframe(): HTMLIFrameElement | null {
    return document.getElementById(
        'computer-screen'
    ) as HTMLIFrameElement | null;
}

function terminalBridgeRequest<T>(payload: {
    action: string;
    path?: string;
    method?: string;
    body?: unknown;
}): Promise<T> {
    return new Promise((resolve, reject) => {
        const iframe = getTerminalIframe();
        if (!iframe?.contentWindow) {
            reject(new Error('Terminal not available.'));
            return;
        }

        const id = `journal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const timeout = window.setTimeout(() => {
            window.removeEventListener('message', onMessage);
            reject(new Error('Terminal did not respond.'));
        }, BRIDGE_TIMEOUT_MS);

        const onMessage = (event: MessageEvent) => {
            const data = event.data;
            if (!data || data.type !== 'journalBridgeResponse' || data.id !== id) {
                return;
            }
            window.clearTimeout(timeout);
            window.removeEventListener('message', onMessage);
            if (data.ok) {
                resolve(data.result as T);
            } else {
                const err = new Error(
                    data.error || 'Terminal request failed'
                ) as Error & { status?: number };
                err.status = data.status;
                reject(err);
            }
        };

        window.addEventListener('message', onMessage);
        iframe.contentWindow.postMessage(
            { type: 'journalBridgeRequest', id, ...payload },
            '*'
        );
    });
}

function parseBody(body: RequestInit['body']): unknown {
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return body;
        }
    }
    return body;
}

async function parentFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<{ data: T; status: number }> {
    const res = await fetch(path, {
        credentials: 'include',
        ...options,
        headers: {
            ...(options.body instanceof FormData
                ? {}
                : { 'Content-Type': 'application/json' }),
            ...options.headers,
        },
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { data, status: res.status };
}

function apiError(
    data: { error?: string },
    status: number,
    fallback: string
): Error & { status?: number } {
    const err = new Error(data?.error || fallback) as Error & { status?: number };
    err.status = status;
    return err;
}

/** Journal API runs in the terminal iframe where the session cookie is set. */
async function journalApiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const body = parseBody(options.body);
    const iframe = getTerminalIframe();

    if (iframe?.contentWindow) {
        try {
            return await terminalBridgeRequest<T>({
                action: 'api',
                path,
                method,
                body: method === 'GET' || method === 'HEAD' ? undefined : body,
            });
        } catch {
            /* fall back to parent request */
        }
    }

    const { data, status } = await parentFetch<T>(path, options);
    if (status >= 200 && status < 300) {
        return data;
    }
    throw apiError(data as { error?: string }, status, 'Request failed');
}

export async function fetchJournalUser(): Promise<JournalUser | null> {
    if (getTerminalIframe()?.contentWindow) {
        try {
            const bridged = await terminalBridgeRequest<{ user: JournalUser | null }>(
                { action: 'authMe' }
            );
            if (bridged.user) return bridged.user;
        } catch {
            /* try parent */
        }
    }

    try {
        const { data, status } = await parentFetch<{ user: JournalUser | null }>(
            '/api/auth/me'
        );
        if (status >= 200 && status < 300) {
            return data.user ?? null;
        }
    } catch {
        /* ignore */
    }
    return null;
}

export async function fetchJournalProgress(): Promise<JournalProgress> {
    const data = await journalApiFetch<{ progress: JournalProgress }>(
        '/api/journal/progress'
    );
    return normalizeProgress(data.progress);
}

export async function submitJournalAnswer(
    questionId: string,
    answer: string
): Promise<{
    correct: boolean;
    progress: JournalProgress;
    alreadySolved?: boolean;
}> {
    const data = await journalApiFetch<{
        correct: boolean;
        progress: JournalProgress;
        alreadySolved?: boolean;
    }>('/api/journal/submit', {
        method: 'POST',
        body: JSON.stringify({ questionId, answer }),
    });
    return {
        ...data,
        progress: normalizeProgress(data.progress),
    };
}

export async function resetJournalProgress(): Promise<JournalProgress> {
    const data = await journalApiFetch<{ progress: JournalProgress }>(
        '/api/journal/reset',
        { method: 'POST', body: '{}' }
    );
    return normalizeProgress(data.progress);
}

function normalizeProgress(raw: JournalProgress | undefined): JournalProgress {
    const progress = raw ?? { solved: [], won: false };
    return {
        solved: Array.isArray(progress.solved) ? progress.solved : [],
        won: Boolean(progress.won),
        wonAt: progress.wonAt,
    };
}
