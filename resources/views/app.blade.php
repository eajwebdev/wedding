<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
    <meta name="theme-color" content="#070d12">
    <meta name="color-scheme" content="dark">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $page === 'admin' ? 'Guest list | E & J' : 'Edwin & Jochel | Our Wedding' }}</title>
    @if ($page === 'admin')
        <meta name="robots" content="noindex,nofollow">
    @else
        <meta name="description" content="You're invited to Edwin and Jochel's wedding on Saturday, December 26, 2026 at AC Villa Private Resort.">
        <meta property="og:type" content="website">
        <meta property="og:title" content="Edwin & Jochel | Our Wedding">
        <meta property="og:description" content="Tap to open our invitation and RSVP.">
        <meta property="og:image" content="{{ asset('opengraph-image.jpg') }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta name="twitter:card" content="summary_large_image">
    @endif
    <link rel="icon" href="{{ asset('icon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('apple-icon.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Great+Vibes&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body>
    <noscript><style>.intro-gate{display:none!important}.wedding-site.is-gated .site-content{opacity:1!important;visibility:visible!important}</style></noscript>
    <div id="app" data-page="{{ $page }}"></div>
</body>
</html>
