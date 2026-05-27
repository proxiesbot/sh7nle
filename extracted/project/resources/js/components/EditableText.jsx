import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function resolveText(contentTexts, textKey, defaultText) {
    const savedText = contentTexts?.[textKey];
    return typeof savedText === 'string' && savedText.length > 0 ? savedText : defaultText;
}

export default function EditableText({
    textKey,
    defaultText,
    context = '',
    as: Tag = 'span',
    className = '',
    multiline = false,
}) {
    const { isSuperAdmin, contentTexts = {} } = usePage().props;
    const initialText = useMemo(
        () => resolveText(contentTexts, textKey, defaultText),
        [contentTexts, textKey, defaultText],
    );
    const [text, setText] = useState(initialText);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(initialText);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setText(initialText);
        if (!editing) {
            setDraft(initialText);
        }
    }, [initialText, editing]);

    const save = async () => {
        const nextText = String(draft || '').trim();

        if (!nextText) {
            setError('النص لا يمكن أن يكون فارغًا.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const response = await window.axios.post(route('contentTexts.update'), {
                key: textKey,
                text: nextText,
                defaultText,
                context,
            });

            setText(response.data?.text || nextText);
            setDraft(response.data?.text || nextText);
            setEditing(false);
        } catch (exception) {
            setError(exception.response?.data?.message || 'تعذر حفظ النص.');
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setDraft(text);
        setEditing(false);
        setError('');
    };

    if (!isSuperAdmin) {
        return <Tag className={className}>{text}</Tag>;
    }

    return (
        <span data-no-global-edit="true" className="inline-flex max-w-full items-center gap-2 align-middle">
            {editing ? (
                <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-2 shadow-sm dark:border-sky-900 dark:bg-sky-950/30">
                    <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                                event.preventDefault();
                                save();
                            }
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                cancel();
                            }
                        }}
                        rows={multiline ? Math.min(8, Math.max(2, String(draft).split('\n').length)) : 1}
                        className="min-w-[260px] max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-200 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {saving ? 'حفظ...' : 'حفظ'}
                    </button>
                    <button type="button" onClick={cancel} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                        إلغاء
                    </button>
                    {error && <span className="text-xs font-bold text-rose-600">{error}</span>}
                </span>
            ) : (
                <>
                    <Tag className={className}>{text}</Tag>
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
                        title="تعديل النص"
                    >
                        ✎
                    </button>
                </>
            )}
        </span>
    );
}
