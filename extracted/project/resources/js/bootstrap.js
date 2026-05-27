import axios from 'axios';

window.axios = axios;

window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
window.axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

const token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}


window.refreshCsrfToken = async function refreshCsrfToken() {
    const response = await window.axios.get('/csrf-token', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    const freshToken = response?.data?.token;
    if (freshToken) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = freshToken;
        const meta = document.head.querySelector('meta[name="csrf-token"]');
        if (meta) {
            meta.setAttribute('content', freshToken);
        }
    }

    return freshToken;
};

window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const config = error?.config || {};

        if (status === 419 && !config._csrfRetry && !String(config.url || '').includes('/csrf-token')) {
            config._csrfRetry = true;

            try {
                const freshToken = await window.refreshCsrfToken();
                if (freshToken) {
                    config.headers = config.headers || {};
                    config.headers['X-CSRF-TOKEN'] = freshToken;
                    config.headers['X-Requested-With'] = 'XMLHttpRequest';
                    return window.axios(config);
                }
            } catch (_) {
                // Fall through to the original error so the UI can show a safe message.
            }
        }

        return Promise.reject(error);
    },
);
