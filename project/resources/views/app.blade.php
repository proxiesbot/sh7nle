<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Sh7nle منصة شحن ألعاب وخدمات رقمية وبطاقات هدية بسرعة وأمان.">
        <meta name="robots" content="index,follow">
        <meta property="og:title" content="Sh7nle - متجر الشحن والخدمات الرقمية">
        <meta property="og:description" content="اشحن ألعابك وخدماتك الرقمية واشترِ بطاقات هدية من Sh7nle.">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <link rel="canonical" href="{{ url()->current() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite('resources/js/app.jsx')
        @inertiaHead
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/images/brand/favicon-32.png">
    <link rel="apple-touch-icon" href="/images/brand/sh7nle-icon-192.png">
    <meta property="og:image" content="/images/brand/sh7nle-logo.png">
    <link rel="manifest" href="/site.webmanifest">
</head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
