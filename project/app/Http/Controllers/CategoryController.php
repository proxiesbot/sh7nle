<?php

namespace App\Http\Controllers;

use App\Http\FileUtils;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\In;
use Inertia\Inertia;
use Laravel\Jetstream\Role;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
//        dd(Auth::user());
//        dd(Auth::user()->roles[0]->name === 'Super-Admin');
        return Inertia::render('Category/Index', [
            'categories' => Category::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Category/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'icon' => 'required',
        ]);

        $category = new Category();
        $category->name = $validated['name'];
        if($request->description) $category->description = $request->description;

        // save the Icon and the background Image
        $iconFile = $request->file('icon');
        $category->icon = Storage::url($iconFile->storePublicly('images/category'));

        $backgroundFile = $request->file('backgroundImage');
        if($backgroundFile) {
            $category->background = Storage::url($backgroundFile->storePublicly('images/category'));
        }

        $category->save();

        return redirect()->route('category.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category)
    {
        return Inertia::render('Category/Edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category)
    {
        if($request->name) $category->name = $request->name;
        if($request->description) $category->description = $request->description;

        // save the Icon and the background Image
        $iconFile = $request->file('icon');
        if($iconFile){
            // remove the old image from the storage
            FileUtils::deleteImage($category->icon);

            $category->icon = Storage::url($iconFile->storePublicly('images/category'));
        }

        $backgroundFile = $request->file('backgroundImage');
        if($backgroundFile) {
            // remove the old image from the storage
            if($category->background) FileUtils::deleteImage($category->background);

            $category->background = Storage::url($backgroundFile->storePublicly('images/category'));
        }

        $category->save();

        return redirect()->route('category.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        // remove the icon and background images from the storage
        FileUtils::deleteImage($category->icon);
        if($category->background) FileUtils::deleteImage($category->background);

        $category->delete();
    }

    public function addSubcategory(Category $category) {
        return Inertia::render('Subcategory/Create', [
            'category' => $category,
        ]);
    }

    public function getSubcategories(Category $category){
        return Inertia::render('Subcategory/Index', [
            'category' => $category,
            'subcategories' => $category->subcategories,
        ]);
    }

}
