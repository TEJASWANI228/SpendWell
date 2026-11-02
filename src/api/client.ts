import type { SpendWellApi } from '@/api/types';
import { mockApi } from '@/api/mock';
import { httpApi } from '@/api/http';

/**
 * Single switch between the in-browser mock backend and the real REST API.
 * Set VITE_USE_MOCK=false (and VITE_API_URL) to talk to the backend.
 */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const api: SpendWellApi = useMock ? mockApi : httpApi;
