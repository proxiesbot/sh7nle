<?php

namespace App\Http\Controllers;

use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    public function userIndex(): Response
    {
        return Inertia::render('Support/UserIndex', [
            'tickets' => SupportTicket::query()
                ->where('user_id', Auth::id())
                ->withCount('messages')
                ->latest('updated_at')
                ->paginate(10),
            'adminOnline' => $this->hasOnlineAdmin(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'required_without:attachment', 'string', 'max:3000'],
            'attachment' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'],
            'status' => $this->hasOnlineAdmin() ? 'live' : 'open',
            'last_reply_at' => now(),
        ]);

        $this->createMessage($request, $ticket, false, $validated['message'] ?? '');

        return redirect()->route('support.show', $ticket)->with('success', $this->hasOnlineAdmin() ? 'تم فتح محادثة مباشرة مع الدعم.' : 'تم إرسال رسالتك للدعم.');
    }

    public function show(SupportTicket $ticket): Response
    {
        abort_unless($ticket->user_id === Auth::id() || $this->isAdminUser(request()->user()), 403);

        $ticket->load(['user', 'messages.user']);

        return Inertia::render($this->isAdminUser(request()->user()) ? 'Support/AdminShow' : 'Support/UserShow', [
            'ticket' => $ticket,
            'adminOnline' => $this->hasOnlineAdmin(),
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        abort_unless($ticket->user_id === Auth::id() || $this->isAdminUser($request->user()), 403);

        $validated = $request->validate([
            'message' => ['nullable', 'required_without:attachment', 'string', 'max:3000'],
            'attachment' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $isAdmin = $this->isAdminUser($request->user());

        $this->createMessage($request, $ticket, $isAdmin, $validated['message'] ?? '');

        $ticket->update([
            'status' => $isAdmin ? 'answered' : ($this->hasOnlineAdmin() ? 'live' : 'open'),
            'last_reply_at' => now(),
        ]);

        return back()->with('success', 'تم إرسال الرد.');
    }

    public function adminIndex(): Response
    {
        return Inertia::render('Support/AdminIndex', [
            'tickets' => SupportTicket::query()
                ->with(['user'])
                ->withCount('messages')
                ->latest('updated_at')
                ->paginate(15),
        ]);
    }

    public function close(SupportTicket $ticket): RedirectResponse
    {
        $ticket->update(['status' => 'closed']);

        return back()->with('success', 'تم إغلاق التذكرة.');
    }

    protected function createMessage(Request $request, SupportTicket $ticket, bool $isAdmin, string $message): void
    {
        $payload = [
            'support_ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'is_admin' => $isAdmin,
            'message' => trim($message) !== '' ? trim($message) : 'صورة مرفقة',
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $payload['attachment_path'] = Storage::url($file->storePublicly('support/attachments'));
            $payload['attachment_original_name'] = $file->getClientOriginalName();
            $payload['attachment_mime'] = $file->getClientMimeType();
            $payload['attachment_size'] = $file->getSize();
        }

        SupportMessage::create($payload);
    }

    protected function hasOnlineAdmin(): bool
    {
        if (! Schema::hasColumn('users', 'last_seen_at')) {
            return false;
        }

        return User::query()
            ->where('last_seen_at', '>=', now()->subMinutes(5))
            ->where(function ($query) {
                $query->whereHas('roles', function ($roleQuery) {
                    $roleQuery->whereIn('name', ['Super-Admin', 'super-admin', 'superadmin', 'admin', 'Admin', 'administrator']);
                })->orWhere('email', 'like', '%admin%');
            })
            ->exists();
    }

    protected function isAdminUser($user): bool
    {
        if (! $user) {
            return false;
        }

        $email = mb_strtolower((string) $user->email);
        if (str_contains($email, 'admin')) {
            return true;
        }

        return $user->roles()->whereIn('name', ['Super-Admin', 'super-admin', 'superadmin', 'admin', 'Admin', 'administrator'])->exists();
    }
}
