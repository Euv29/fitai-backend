
export const getWelcomePage = () => {
    return `
<!DOCTYPE html>
<html lang="pt-AO">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FitAI API - Backend</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; }
        .grid-bg {
            background-image: radial-gradient(#334155 1px, transparent 1px);
            background-size: 24px 24px;
        }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex flex-col relative overflow-x-hidden">
    
    <!-- Background Effect -->
    <div class="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>

    <!-- Header -->
    <header class="relative z-10 w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <span class="text-2xl font-bold tracking-tight">FitAI <span class="text-indigo-400">Backend</span></span>
        </div>
        <div class="flex gap-4">
            <a href="https://github.com/Euv29/fitai-backend" target="_blank" class="text-slate-400 hover:text-white transition-colors">
                GitHub
            </a>
            <a href="/docs" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/50">
                Documentação API
            </a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto">
        
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-sm font-medium mb-8 animate-fade-in-up">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistema Operacional v1.0.0
        </div>

        <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-sm">
            Inteligência Artificial <br> para Fitness & Saúde
        </h1>

        <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            API robusta e escalável desenvolvida para alimentar a próxima geração de aplicativos fitness. 
            Integrada com Gemini AI, Stripe, Supabase e Twilio.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            <a href="/docs" class="group bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-left">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold text-white">Documentação Swagger</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </div>
                <p class="text-slate-400 text-sm">Explore todos os endpoints, schemas e teste as requisições em tempo real.</p>
            </a>

            <a href="https://github.com/Euv29/fitai-backend" target="_blank" class="group bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-800 transition-all text-left">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold text-white">Contribua no GitHub</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </div>
                <p class="text-slate-400 text-sm">Projeto Open Source. Sinta-se livre para abrir issues e pull requests.</p>
            </a>
        </div>

        <!-- Tech Stack -->
        <div class="mt-16 flex flex-wrap justify-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
            <span class="px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700">Node.js</span>
            <span class="px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700">TypeScript</span>
            <span class="px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700">Express</span>
            <span class="px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700">Supabase</span>
            <span class="px-4 py-2 bg-slate-800 rounded-lg text-sm border border-slate-700">Gemini AI</span>
        </div>

    </main>

    <!-- Footer / Author -->
    <footer class="relative z-10 w-full py-8 text-center border-t border-slate-800 mt-auto bg-slate-900/80 backdrop-blur">
        <div class="max-w-6xl mx-auto px-6">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-slate-500 text-sm">
                    &copy; ${new Date().getFullYear()} FitAI Project. Open Source Software.
                </p>
                
                <div class="flex items-center gap-3">
                    <span class="text-slate-400 text-sm">Desenvolvido por</span>
                    <a href="https://github.com/Euv29" target="_blank" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors border border-slate-700">
                        <img src="https://github.com/Euv29.png" alt="Venâncio Wapinda" class="w-6 h-6 rounded-full">
                        <span class="text-sm font-medium text-slate-200">Venâncio Wapinda</span>
                    </a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Simple Script to Check Health -->
    <script>
        fetch('/health')
            .then(res => res.json())
            .then(data => {
                console.log('System Status:', data);
            })
            .catch(err => console.error('Health Check Failed', err));
    </script>
</body>
</html>
    `;
};
