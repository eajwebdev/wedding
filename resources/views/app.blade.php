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
        @php
            $siteUrl = rtrim(config('app.url'), '/');
            $previewImage = $siteUrl.'/opengraph-image.jpg?v=20261030';
            $previewTitle = 'Edwin & Jochel | Our Wedding';
            $previewDescription = "You're invited to celebrate with us on Saturday, December 26, 2026 at AC Villa Private Resort.";
        @endphp
        <meta name="description" content="You're invited to Edwin and Jochel's wedding on Saturday, December 26, 2026 at AC Villa Private Resort.">
        <link rel="canonical" href="{{ $siteUrl }}/">
        <meta property="og:type" content="website">
        <meta property="og:locale" content="en_PH">
        <meta property="og:site_name" content="Edwin & Jochel's Wedding">
        <meta property="og:title" content="{{ $previewTitle }}">
        <meta property="og:description" content="{{ $previewDescription }}">
        <meta property="og:url" content="{{ $siteUrl }}/">
        <meta property="og:image" content="{{ $previewImage }}">
        <meta property="og:image:secure_url" content="{{ $previewImage }}">
        <meta property="og:image:type" content="image/jpeg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Wedding invitation for Edwin and Jochel on December 26, 2026">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $previewTitle }}">
        <meta name="twitter:description" content="{{ $previewDescription }}">
        <meta name="twitter:image" content="{{ $previewImage }}">
        <meta name="twitter:image:alt" content="Wedding invitation for Edwin and Jochel on December 26, 2026">
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
