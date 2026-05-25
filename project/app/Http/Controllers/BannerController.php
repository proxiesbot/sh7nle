<?php

namespace App\Http\Controllers;

use App\Http\FileUtils;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Banner/Index', [
            'banners' => Banner::query()->latest()->paginate(10),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Banner/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $banner = new Banner();
        $this->saveBanner($request, $banner);

        return redirect()->route('banners.index')->with('success', 'تمت إضافة البانر بنجاح.');
    }

    public function edit(Banner $banner): Response
    {
        return Inertia::render('Banner/Edit', ['banner' => $banner]);
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $this->saveBanner($request, $banner);

        return redirect()->route('banners.index')->with('success', 'تم تحديث البانر بنجاح.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        if ($banner->image) {
            FileUtils::deleteImage($banner->image);
        }
        $banner->delete();

        return redirect()->route('banners.index')->with('success', 'تم حذف البانر.');
    }

    protected function saveBanner(Request $request, Banner $banner): void
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'link' => ['nullable', 'string', 'max:500'],
            'isActive' => ['required', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'image' => [$banner->exists ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $banner->title = $validated['title'];
        $banner->subtitle = $validated['subtitle'] ?? null;
        $banner->link = $validated['link'] ?? null;
        $banner->is_active = (bool) $validated['isActive'];
        $banner->sort_order = (int) ($validated['sortOrder'] ?? 0);

        if ($image = $request->file('image')) {
            if ($banner->image) {
                FileUtils::deleteImage($banner->image);
            }
            $banner->image = Storage::url($image->storePublicly('images/banners'));
        }

        $banner->save();
    }
}
