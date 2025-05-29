document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');

    const sectionsToLoadConfig = [
        { id: 'portifolio', url: 'portifolio.html', loaded: false, contentSelector: 'main', element: document.getElementById('portifolio') },
        { id: 'sobre', url: 'sobremim.html', loaded: false, contentSelector: 'main', element: document.getElementById('sobre') },
        { id: 'curriculo', url: 'curriculo.html', loaded: false, contentSelector: 'main', element: document.getElementById('curriculo') }
    ];
    // Ajuste '.conteudo-principal-pagina' para o seletor real do conteúdo em suas sub-páginas.
    // Ex: 'main' se o conteúdo principal estiver dentro da tag <main> da sub-página.

    // --- Função para carregar conteúdo de uma seção específica ---
    async function loadSectionContent(sectionId) {
        const config = sectionsToLoadConfig.find(s => s.id === sectionId);
        if (!config || config.loaded || !config.element) {
            // Se não há configuração, já foi carregado, ou o elemento não existe, não faz nada.
            // Se já foi carregado, apenas retorna true para permitir o scroll.
            return config && config.loaded;
        }

        if (loader) loader.style.display = 'block';
        try {
            const response = await fetch(config.url);
            if (!response.ok) {
                throw new Error(`Erro ao carregar ${config.url}: ${response.statusText}`);
            }
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const contentToInject = doc.querySelector(config.contentSelector);

            if (contentToInject) {
                config.element.innerHTML = contentToInject.innerHTML;
                config.loaded = true;

                // Observar sub-seções e a própria seção recém-carregada com o animationObserver
                config.element.querySelectorAll('section').forEach(subSection => animationObserver.observe(subSection));
                animationObserver.observe(config.element); // Observa a seção principal que foi preenchida
                
                return true; // Conteúdo carregado com sucesso
            } else {
                config.element.innerHTML = `<p>Erro: Conteúdo não encontrado em ${config.url} (seletor: '${config.contentSelector}').</p>`;
                console.warn(`Elemento '${config.contentSelector}' não encontrado em ${config.url}`);
                return false; // Falha ao encontrar conteúdo
            }
        } catch (error) {
            console.error(`Falha ao carregar conteúdo para #${sectionId}:`, error);
            if (config.element) {
                config.element.innerHTML = `<p>Erro ao carregar conteúdo. Tente novamente mais tarde.</p>`;
            }
            return false; // Falha no carregamento
        } finally {
            if (loader) loader.style.display = 'none';
        }
    }

    // --- IntersectionObserver para CARREGAR o conteúdo das seções (por scroll) ---
    const contentLoaderObserver = new IntersectionObserver(async (entries, observerInstance) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                await loadSectionContent(entry.target.id); // Usa a nova função
                observerInstance.unobserve(entry.target); // Para de observar após a tentativa de carregar
            }
        }
    }, { threshold: 0.1 });

    sectionsToLoadConfig.forEach(config => {
        if (config.element) {
            contentLoaderObserver.observe(config.element);
        }
    });

    // --- IntersectionObserver para ADICIONAR CLASSE 'active' (animação) ---
    const animationObserverOptions = { threshold: 0.4 };
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                // entry.target.classList.remove('active'); // Opcional: para re-animar
            }
        });
    }, animationObserverOptions);

    document.querySelectorAll('section').forEach(section => {
        // Se a seção #home já tem 'active' no HTML e você não quer re-animá-la,
        // você pode pular a observação dela ou tratar de forma diferente.
        // Para simplificar, vamos observar todas.
        animationObserver.observe(section);
    });

    // --- Lógica para cliques nos links de navegação ---
    const navLinks = document.querySelectorAll('.cabecalho__menu__links');
    navLinks.forEach(link => {
        link.addEventListener('click', async (event) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) { // Apenas para links internos (ex: #portifolio)
                event.preventDefault(); // Previne o comportamento padrão de "pular" para a âncora
                const sectionId = href.substring(1); // Remove o '#' para obter o ID
                const targetSectionElement = document.getElementById(sectionId);

                if (targetSectionElement) {
                    // Garante que o conteúdo da seção seja carregado ANTES de rolar
                    const loadedSuccessfully = await loadSectionContent(sectionId);

                    // Rola para a seção mesmo se o carregamento falhar,
                    // mas idealmente você quer que carregue primeiro.
                    // Se 'loadedSuccessfully' for importante, você pode condicionar o scroll.
                    targetSectionElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});