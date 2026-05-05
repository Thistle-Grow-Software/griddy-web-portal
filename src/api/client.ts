import { client } from "@/api/generated/client.gen";

export type ApiClientDeps = {
	/** Returns the current Clerk session token, or null if unauthenticated. */
	getToken: () => Promise<string | null>;
	/** Returns a force-refreshed Clerk session token, or null if unauthenticated. */
	forceRefreshToken: () => Promise<string | null>;
	/** Signs the user out of Clerk and bounces them to /sign-in. */
	signOutAndRedirect: () => Promise<void>;
};

/**
 * Returns a request interceptor that attaches the Clerk session token as a
 * Bearer header.
 */
export function createAuthRequestInterceptor(deps: Pick<ApiClientDeps, "getToken">) {
	return async (request: Request): Promise<Request> => {
		const token = await deps.getToken();
		if (token) {
			request.headers.set("Authorization", `Bearer ${token}`);
		}
		return request;
	};
}

/**
 * Returns a response interceptor that, on a 401, force-refreshes the token and
 * retries the request once. If the retry also returns 401, signs out and
 * redirects to /sign-in.
 */
export function createUnauthorizedRetryInterceptor(
	deps: ApiClientDeps,
	fetchFn: typeof fetch = fetch,
) {
	return async (response: Response, request: Request): Promise<Response> => {
		if (response.status !== 401) {
			return response;
		}

		const fresh = await deps.forceRefreshToken();
		if (!fresh) {
			await deps.signOutAndRedirect();
			return response;
		}

		const retryRequest = request.clone();
		retryRequest.headers.set("Authorization", `Bearer ${fresh}`);
		const retryResponse = await fetchFn(retryRequest);

		if (retryResponse.status === 401) {
			await deps.signOutAndRedirect();
		}
		return retryResponse;
	};
}

/**
 * Idempotently wires the Clerk-aware interceptors into the generated client.
 * Safe to call multiple times — clears any previously-registered interceptors
 * first so HMR / re-renders don't stack handlers.
 */
export function configureApiClient(deps: ApiClientDeps): void {
	client.interceptors.request.clear();
	client.interceptors.response.clear();
	client.interceptors.request.use(createAuthRequestInterceptor(deps));
	client.interceptors.response.use(createUnauthorizedRetryInterceptor(deps));
}
