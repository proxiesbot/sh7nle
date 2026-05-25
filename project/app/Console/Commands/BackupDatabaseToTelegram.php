<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupDatabaseToTelegram extends Command
{
    protected $signature = 'sh7nle:backup-telegram {--force : Run even if disabled in settings}';
    protected $description = 'Create a database backup and send it to a Telegram channel.';

    public function handle(): int
    {
        $enabled = (bool) Setting::get('backup.telegram_enabled', false);
        if (! $enabled && ! $this->option('force')) {
            $this->info('Telegram backup is disabled.');
            return self::SUCCESS;
        }

        $token = (string) Setting::get('backup.telegram_bot_token', env('TELEGRAM_BACKUP_BOT_TOKEN', ''));
        $chatId = (string) Setting::get('backup.telegram_chat_id', env('TELEGRAM_BACKUP_CHAT_ID', ''));
        if ($token === '' || $chatId === '') {
            $this->error('Telegram bot token/chat id is missing.');
            return self::FAILURE;
        }

        $filename = 'sh7nle-db-'.now()->format('Y-m-d-His').'.sql';
        $path = storage_path('app/backups/'.$filename);
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }

        $connection = config('database.connections.'.config('database.default'));
        if (($connection['driver'] ?? '') !== 'mysql') {
            $this->error('Only MySQL backup is supported by this command.');
            return self::FAILURE;
        }

        $process = new Process([
            'mysqldump',
            '-h'.($connection['host'] ?? '127.0.0.1'),
            '-P'.($connection['port'] ?? 3306),
            '-u'.($connection['username'] ?? ''),
            '-p'.($connection['password'] ?? ''),
            $connection['database'] ?? '',
        ]);
        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error($process->getErrorOutput() ?: 'mysqldump failed.');
            return self::FAILURE;
        }

        file_put_contents($path, $process->getOutput());
        $zipPath = $path.'.gz';
        file_put_contents($zipPath, gzencode(file_get_contents($path), 9));
        @unlink($path);

        $response = Http::attach('document', file_get_contents($zipPath), basename($zipPath))
            ->post("https://api.telegram.org/bot{$token}/sendDocument", [
                'chat_id' => $chatId,
                'caption' => 'Sh7nle database backup '.now()->format('Y-m-d H:i'),
            ]);

        if (! $response->successful()) {
            $this->error($response->body());
            return self::FAILURE;
        }

        $this->info('Backup sent to Telegram.');
        return self::SUCCESS;
    }
}
