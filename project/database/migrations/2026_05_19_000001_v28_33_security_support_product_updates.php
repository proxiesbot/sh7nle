<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_messages', function (Blueprint $table) {
            if (! Schema::hasColumn('support_messages', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('message');
            }
            if (! Schema::hasColumn('support_messages', 'attachment_original_name')) {
                $table->string('attachment_original_name')->nullable()->after('attachment_path');
            }
            if (! Schema::hasColumn('support_messages', 'attachment_mime')) {
                $table->string('attachment_mime')->nullable()->after('attachment_original_name');
            }
            if (! Schema::hasColumn('support_messages', 'attachment_size')) {
                $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_mime');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable()->after('remember_token');
            }
            if (! Schema::hasColumn('users', 'last_security_confirmation_sent_at')) {
                $table->timestamp('last_security_confirmation_sent_at')->nullable()->after('last_seen_at');
            }
            if (! Schema::hasColumn('users', 'account_verification_status')) {
                $table->string('account_verification_status')->default('not_requested')->after('whatsapp_number');
            }
            if (! Schema::hasColumn('users', 'account_verification_notes')) {
                $table->text('account_verification_notes')->nullable()->after('account_verification_status');
            }
        });

        if (! Schema::hasTable('login_activities')) {
            Schema::create('login_activities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('event')->default('login');
                $table->string('ip_address', 64)->nullable();
                $table->text('user_agent')->nullable();
                $table->string('browser')->nullable();
                $table->string('platform')->nullable();
                $table->string('device_type')->nullable();
                $table->boolean('is_new_device')->default(false);
                $table->timestamps();
                $table->index(['user_id', 'created_at']);
            });
        }

        Schema::table('cards', function (Blueprint $table) {
            if (! Schema::hasColumn('cards', 'order_count')) {
                $table->unsignedInteger('order_count')->default(0)->after('is_active');
            }
            if (! Schema::hasColumn('cards', 'manual_unavailable')) {
                $table->boolean('manual_unavailable')->default(false)->after('order_count');
            }
            if (! Schema::hasColumn('cards', 'provider_unavailable_at')) {
                $table->timestamp('provider_unavailable_at')->nullable()->after('manual_unavailable');
            }
            if (! Schema::hasColumn('cards', 'availability_note')) {
                $table->string('availability_note')->nullable()->after('provider_unavailable_at');
            }
            if (! Schema::hasColumn('cards', 'meta_title')) {
                $table->string('meta_title')->nullable()->after('availability_note');
            }
            if (! Schema::hasColumn('cards', 'meta_description')) {
                $table->text('meta_description')->nullable()->after('meta_title');
            }
        });

        // Remove only untouched demo/placeholder root sections that do not contain products or child sections.
        if (Schema::hasTable('sections')) {
            DB::table('sections')
                ->whereIn('name', ['الألعاب', 'بطاقات المتاجر', 'الاشتراكات'])
                ->where(function ($query) {
                    $query->where('icon', 'like', '%/demo/sections/%')
                        ->orWhere('background', 'like', '%/demo/sections/%');
                })
                ->whereNotExists(fn ($query) => $query->selectRaw(1)->from('cards')->whereColumn('cards.section_id', 'sections.id'))
                ->whereNotExists(fn ($query) => $query->selectRaw(1)->from('sections as child_sections')->whereColumn('child_sections.section_id', 'sections.id'))
                ->delete();
        }
    }

    public function down(): void
    {
        // Safe patch migration: keep data and columns on rollback.
    }
};
