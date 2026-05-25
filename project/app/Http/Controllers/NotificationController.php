<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Notification/Index', [
            'notifications' => Notification::with('sender', 'receiver')->latest()->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Notification/Create', [
            'users' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'exists:users,email'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $notification = new Notification();
        $notification->title = $validated['title'] ?? null;
        $notification->message = $validated['message'];
        $notification->sender_id = auth()->id();

        if (! empty($validated['user_id'])) {
            $notification->receiver_id = $validated['user_id'];
        } elseif (! empty($validated['email'])) {
            $notification->receiver_id = User::query()->where('email', $validated['email'])->value('id');
        }

        $notification->save();

        return redirect()->route('notification.index')->with('success', $notification->receiver_id ? 'تم إرسال الإشعار للمستخدم المحدد.' : 'تم إرسال إشعار عام لجميع المستخدمين.');
    }

    public function show(Notification $notification)
    {
    }

    public function edit(Notification $notification)
    {
    }

    public function update(Request $request, Notification $notification)
    {
    }

    public function destroy(Notification $notification): RedirectResponse
    {
        $notification->delete();

        return back()->with('success', 'تم حذف الإشعار.');
    }
}
