import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MinusCircle, PlusCircle, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function SpinAdjustForm({ user }) {
    const addForm = useForm({ amount: 1, reason: 'إضافة لفات من الإدارة' });
    const removeForm = useForm({ amount: 1 });
    const setForm = useForm({ amount: user.active_wheel_spins_count || 0, reason: 'ضبط رصيد لفات العجلة من الإدارة' });

    const active = Number(user.active_wheel_spins_count || 0);

    return (
        <div className="grid gap-3 lg:grid-cols-3">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    addForm.post(route('wheel.admin.grant', user.id), { preserveScroll: true });
                }}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30"
            >
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-200"><PlusCircle className="h-4 w-4" /> إضافة</div>
                <div className="flex gap-2">
                    <Input type="number" min="1" max="100" value={addForm.data.amount} onChange={(e) => addForm.setData('amount', e.target.value)} className="h-10 w-20 bg-white text-slate-900 dark:bg-slate-900 dark:text-white" />
                    <Button disabled={addForm.processing} className="h-10 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500">إضافة</Button>
                </div>
            </form>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    removeForm.post(route('wheel.admin.remove', user.id), { preserveScroll: true });
                }}
                className="rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/60 dark:bg-rose-950/30"
            >
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-rose-700 dark:text-rose-200"><MinusCircle className="h-4 w-4" /> حذف</div>
                <div className="flex gap-2">
                    <Input type="number" min="1" max="100" value={removeForm.data.amount} onChange={(e) => removeForm.setData('amount', e.target.value)} className="h-10 w-20 bg-white text-slate-900 dark:bg-slate-900 dark:text-white" />
                    <Button disabled={removeForm.processing || active <= 0} className="h-10 flex-1 rounded-xl bg-rose-600 hover:bg-rose-500">حذف</Button>
                </div>
            </form>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setForm.post(route('wheel.admin.set', user.id), { preserveScroll: true });
                }}
                className="rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/60 dark:bg-sky-950/30"
            >
                <div className="mb-2 flex items-center gap-2 text-xs font-black text-sky-700 dark:text-sky-200"><SlidersHorizontal className="h-4 w-4" /> ضبط الرقم النهائي</div>
                <div className="flex gap-2">
                    <Input type="number" min="0" max="100" value={setForm.data.amount} onChange={(e) => setForm.setData('amount', e.target.value)} className="h-10 w-20 bg-white text-slate-900 dark:bg-slate-900 dark:text-white" />
                    <Button disabled={setForm.processing} className="h-10 flex-1 rounded-xl bg-sky-600 hover:bg-sky-500">ضبط</Button>
                </div>
            </form>
        </div>
    );
}

export default function Admin({ users = [], usersWithSpins = [], logs = { data: [] }, stats = {} }) {
    const [query, setQuery] = useState('');

    const filteredUsers = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const base = users?.length ? users : usersWithSpins;
        if (!needle) return base;
        return base.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(needle));
    }, [query, users, usersWithSpins]);

    return (
        <AdminLayout title="إدارة عجلة الفرصة">
            <Head title="إدارة عجلة الفرصة" />
            <div className="space-y-6 text-right text-slate-900 dark:text-slate-100">
                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300">اللفات الفعالة</div>
                        <div className="mt-2 text-3xl font-black text-amber-500">{stats.activeSpins || 0}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300">مستخدمون لديهم لفات</div>
                        <div className="mt-2 text-3xl font-black text-sky-500">{stats.usersWithSpins || 0}</div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300">لفات مستخدمة اليوم</div>
                        <div className="mt-2 text-3xl font-black text-emerald-500">{stats.spinsToday || 0}</div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">إضافة أو تعديل لفات أي مستخدم</h2>
                            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">ابحث عن المستخدم ثم أضف، احذف، أو اضبط رقم اللفات النهائي مباشرة.</p>
                        </div>
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم أو البريد..." className="h-12 rounded-2xl bg-slate-50 pr-11 text-right text-slate-900 dark:bg-slate-950 dark:text-white" />
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4">
                        {filteredUsers.slice(0, 80).map((user) => (
                            <div key={user.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-base font-black text-slate-950 dark:text-white">{user.name}</div>
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.email}</div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">{user.active_wheel_spins_count || 0} لفة</span>
                                        <Link href={route('user.edit', user.id)} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-black text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-200">صفحة المستخدم</Link>
                                    </div>
                                </div>
                                <SpinAdjustForm user={user} />
                            </div>
                        ))}
                        {!filteredUsers.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">لا يوجد مستخدم مطابق للبحث.</div>}
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-sky-500" />
                        <h2 className="text-xl font-black text-slate-950 dark:text-white">سجل عمليات العجلة</h2>
                    </div>
                    <div className="sh7nle-mobile-scroll">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><tr><th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">المستخدم</th><th className="px-4 py-3">الحركة</th><th className="px-4 py-3">الجائزة</th><th className="px-4 py-3">الرسالة</th></tr></thead>
                            <tbody className="text-slate-800 dark:text-slate-100">
                                {(logs?.data || []).map((log) => (
                                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="px-4 py-3">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-3">{log.user?.name || '—'}</td>
                                        <td className="px-4 py-3">{log.action}</td>
                                        <td className="px-4 py-3">{log.prize_name || '—'}</td>
                                        <td className="px-4 py-3">{log.message || '—'}</td>
                                    </tr>
                                ))}
                                {!(logs?.data || []).length && <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500 dark:text-slate-300">لا يوجد سجل بعد.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
