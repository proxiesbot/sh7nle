import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

const STORAGE_KEY = 'sh7nle_global_text_edit_mode';
const PREFIX = 'global_text:';
const originalTextMap = new WeakMap();

function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function hashText(value) {
    const text = normalizeText(value);
    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return (hash >>> 0).toString(36);
}

function textKey(value) {
    return `${PREFIX}${hashText(value)}`;
}

function rememberOriginalText(node) {
    const current = normalizeText(node?.nodeValue);

    if (!current) {
        return '';
    }

    if (!originalTextMap.has(node)) {
        originalTextMap.set(node, current);
    }

    return originalTextMap.get(node);
}

function replaceNodeText(node, nextText) {
    const raw = String(node.nodeValue || '');
    const leading = raw.match(/^\s*/)?.[0] || '';
    const trailing = raw.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${leading}${nextText}${trailing}`;
}

function isEditableTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
        return false;
    }

    const text = normalizeText(node.nodeValue);
    if (!text) {
        return false;
    }

    const parent = node.parentElement;
    if (!parent) {
        return false;
    }

    if (parent.closest('[data-no-global-edit="true"], textarea, input, select, option, script, style, svg, canvas')) {
        return false;
    }

    const style = window.getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
    }

    return true;
}

function collectTextNodes(root = document.body) {
    if (!root) {
        return [];
    }

    const startNode = root.nodeType === Node.TEXT_NODE ? root.parentElement : root;
    if (!startNode) {
        return [];
    }

    const walker = document.createTreeWalker(startNode, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            return isEditableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });

    const nodes = [];
    let current = walker.nextNode();

    while (current) {
        rememberOriginalText(current);
        nodes.push(current);
        current = walker.nextNode();
    }

    return nodes;
}

function findTextNodeInside(element) {
    if (!element) {
        return null;
    }

    if (element.closest('[data-no-global-edit="true"], textarea, input, select, option, script, style, svg, canvas')) {
        return null;
    }

    const nodes = collectTextNodes(element);
    return nodes.find((node) => normalizeText(node.nodeValue).length >= 1) || null;
}

function runWhenBrowserIsIdle(callback) {
    if (typeof window === 'undefined') {
        return null;
    }

    if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(callback, { timeout: 700 });
    }

    return window.setTimeout(callback, 120);
}

function cancelIdle(id) {
    if (id === null || typeof window === 'undefined') {
        return;
    }

    if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(id);
        return;
    }

    window.clearTimeout(id);
}

export default function GlobalTextEditor() {
    const { isSuperAdmin, contentTexts = {} } = usePage().props;
    const [enabled, setEnabled] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(STORAGE_KEY) === '1';
    });
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState('');
    const globalTextsRef = useRef({});
    const observerRef = useRef(null);
    const pendingIdleRef = useRef(null);
    const pendingRootsRef = useRef(new Set());

    const globalTexts = useMemo(() => {
        return Object.entries(contentTexts || {})
            .filter(([key]) => key.startsWith(PREFIX))
            .reduce((carry, [key, value]) => {
                carry[key] = value;
                return carry;
            }, {});
    }, [contentTexts]);

    const hasSavedGlobalTexts = useMemo(() => Object.keys(globalTexts).length > 0, [globalTexts]);

    useEffect(() => {
        globalTextsRef.current = globalTexts;
    }, [globalTexts]);

    const applySavedTextsToRoot = useCallback((root = document.body) => {
        const savedTexts = globalTextsRef.current || {};

        if (!Object.keys(savedTexts).length) {
            return;
        }

        collectTextNodes(root).forEach((node) => {
            const original = rememberOriginalText(node);
            const key = textKey(original);
            const savedText = savedTexts[key];

            if (typeof savedText === 'string' && savedText.length > 0 && normalizeText(node.nodeValue) !== savedText) {
                replaceNodeText(node, savedText);
            }
        });
    }, []);

    const scheduleApplySavedTexts = useCallback((roots = [document.body]) => {
        if (!hasSavedGlobalTexts || typeof document === 'undefined') {
            return;
        }

        roots.forEach((root) => {
            if (root) {
                pendingRootsRef.current.add(root.nodeType === Node.TEXT_NODE ? root.parentElement : root);
            }
        });

        if (pendingIdleRef.current) {
            return;
        }

        pendingIdleRef.current = runWhenBrowserIsIdle(() => {
            pendingIdleRef.current = null;
            const rootsToProcess = Array.from(pendingRootsRef.current).filter(Boolean);
            pendingRootsRef.current.clear();

            if (!rootsToProcess.length) {
                applySavedTextsToRoot(document.body);
                return;
            }

            rootsToProcess.forEach((root) => applySavedTextsToRoot(root));
        });
    }, [applySavedTextsToRoot, hasSavedGlobalTexts]);

    useEffect(() => {
        // Root performance fix:
        // The previous implementation scanned the whole page on every DOM mutation,
        // including menu open/close and text changes. On mobile this made the options
        // menu lag badly after editing a label. Now we only scan once initially, and
        // for future DOM changes we scan the newly-added nodes only, debounced during
        // browser idle time.
        if (!hasSavedGlobalTexts || typeof document === 'undefined') {
            observerRef.current?.disconnect?.();
            observerRef.current = null;
            return undefined;
        }

        scheduleApplySavedTexts([document.body]);

        const observer = new MutationObserver((mutations) => {
            const roots = [];

            mutations.forEach((mutation) => {
                mutation.addedNodes?.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                        roots.push(node);
                    }
                });
            });

            if (roots.length) {
                scheduleApplySavedTexts(roots);
            }
        });

        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        observerRef.current = observer;

        return () => {
            observer.disconnect();
            if (pendingIdleRef.current) {
                cancelIdle(pendingIdleRef.current);
                pendingIdleRef.current = null;
            }
            pendingRootsRef.current.clear();
        };
    }, [hasSavedGlobalTexts, scheduleApplySavedTexts]);

    useEffect(() => {
        if (!isSuperAdmin || typeof window === 'undefined') {
            return undefined;
        }

        const handleExternalToggle = () => {
            setEnabled((current) => {
                const next = !current;
                window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
                return next;
            });
        };

        window.addEventListener('sh7nle:toggle-global-text-editor', handleExternalToggle);
        return () => window.removeEventListener('sh7nle:toggle-global-text-editor', handleExternalToggle);
    }, [isSuperAdmin]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return undefined;
        }

        document.body.classList.toggle('sh7nle-global-text-editing', Boolean(isSuperAdmin && enabled));

        return () => document.body.classList.remove('sh7nle-global-text-editing');
    }, [enabled, isSuperAdmin]);

    useEffect(() => {
        if (!isSuperAdmin || !enabled) {
            return undefined;
        }

        const handleClick = async (event) => {
            if (event.target?.closest?.('[data-no-global-edit="true"]')) {
                return;
            }

            const node = findTextNodeInside(event.target);
            if (!node) {
                return;
            }

            const originalText = rememberOriginalText(node);
            const currentText = normalizeText(node.nodeValue);
            if (!originalText || !currentText) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const key = textKey(originalText);
            const savedTexts = globalTextsRef.current || {};
            const nextText = window.prompt('تعديل النص:', savedTexts[key] || currentText);

            if (nextText === null) {
                return;
            }

            const cleanText = String(nextText).trim();
            if (!cleanText || cleanText === currentText) {
                return;
            }

            setSaving(true);
            setLastSaved('');

            try {
                await window.axios.post(route('contentTexts.update'), {
                    key,
                    text: cleanText,
                    defaultText: originalText,
                    context: window.location.pathname,
                });

                globalTextsRef.current = {
                    ...globalTextsRef.current,
                    [key]: cleanText,
                };

                // Only update the clicked text and matching visible nodes during idle,
                // not synchronously across the whole page. This keeps the mobile menu smooth.
                replaceNodeText(node, cleanText);
                scheduleApplySavedTexts([document.body]);

                setLastSaved('تم الحفظ');
                window.setTimeout(() => setLastSaved(''), 1800);
            } catch (exception) {
                window.alert(exception.response?.data?.message || 'تعذر حفظ النص.');
            } finally {
                setSaving(false);
            }
        };

        document.addEventListener('click', handleClick, true);

        return () => document.removeEventListener('click', handleClick, true);
    }, [enabled, isSuperAdmin, scheduleApplySavedTexts]);

    if (!isSuperAdmin) {
        return null;
    }

    const toggle = () => {
        const next = !enabled;
        setEnabled(next);
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    };

    return (
        <div data-no-global-edit="true" className="fixed bottom-5 right-5 z-[9999] flex max-w-[calc(100vw-2.5rem)] flex-wrap items-center gap-2 rounded-3xl border border-amber-300 bg-white/95 p-2 shadow-2xl shadow-amber-500/25 backdrop-blur dark:border-amber-500/60 dark:bg-slate-950/95">
            <button
                type="button"
                onClick={toggle}
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${enabled ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'}`}
            >
                {enabled ? '✅ تعديل النصوص مفعّل' : '✏️ تعديل النصوص'}
            </button>
            {saving && <span className="px-2 text-xs font-bold text-sky-600">حفظ...</span>}
            {lastSaved && <span className="px-2 text-xs font-bold text-emerald-600">{lastSaved}</span>}
            {enabled && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">اضغط على أي نص لتعديله</span>}
        </div>
    );
}
