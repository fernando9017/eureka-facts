// App principal de Eureka!
class EurekaApp {
    constructor() {
        this.currentCategory = 'all';
        this.currentFactIndex = 0;
        this.availableFacts = [];
        this.savedFacts = this.loadSavedFacts();
        this.isTransitioning = false;
        
        this.init();
    }

    init() {
        this.updateAvailableFacts();
        this.displayCurrentFact();
        this.updateCategoryButtons();
        
        // Agregar listeners para gestos de swipe
        this.addSwipeListeners();
    }

    // Toggle panel de categorías
    toggleCategories() {
        const panel = document.querySelector('.categories-panel');
        panel.classList.toggle('active');
    }

    // Cambiar categoría activa
    setCategory(category) {
        if (this.isTransitioning) return;
        
        this.currentCategory = category;
        this.currentFactIndex = 0;
        this.updateAvailableFacts();
        this.updateCategoryButtons();
        this.displayCurrentFact(true);
        
        // Cerrar panel de categorías
        this.toggleCategories();
    }

    // Actualizar lista de hechos disponibles según categoría
    updateAvailableFacts() {
        if (this.currentCategory === 'all') {
            this.availableFacts = [...FACTS];
        } else {
            this.availableFacts = FACTS.filter(fact => fact.category === this.currentCategory);
        }
        
        // Barajar los hechos para variedad
        this.shuffleArray(this.availableFacts);
    }

    // Barajar array (Fisher-Yates shuffle)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Mostrar el hecho actual
    displayCurrentFact(withTransition = false) {
        const card = document.querySelector('.fact-card');
        const container = document.querySelector('.main-content');

        if (!this.availableFacts.length) {
            this.showNoFactsMessage();
            return;
        }

        const fact = this.availableFacts[this.currentFactIndex];
        
        if (withTransition && card) {
            this.isTransitioning = true;
            card.classList.add('swipe-out');
            
            setTimeout(() => {
                this.renderFact(fact);
                card.classList.remove('swipe-out');
                card.classList.add('swipe-in');
                
                setTimeout(() => {
                    card.classList.remove('swipe-in');
                    this.isTransitioning = false;
                }, 300);
            }, 300);
        } else {
            this.renderFact(fact);
        }
    }

    // Renderizar el HTML del hecho
    renderFact(fact) {
        const container = document.querySelector('.main-content');
        
        container.innerHTML = `
            <div class="fact-card">
                <span class="fact-emoji">${fact.emoji}</span>
                <h2 class="fact-title">${fact.title}</h2>
                <p class="fact-description">${fact.description}</p>
                <div class="fact-meta">
                    ${fact.era ? `<span>📅 ${fact.era}</span>` : ''}
                    ${fact.location ? `<span>📍 ${fact.location}</span>` : ''}
                </div>
            </div>
        `;
    }

    // Mostrar mensaje cuando no hay hechos
    showNoFactsMessage() {
        const container = document.querySelector('.main-content');
        const categoryInfo = CATEGORIES[this.currentCategory];
        
        container.innerHTML = `
            <div class="no-facts">
                <span class="emoji">${categoryInfo?.emoji || '🤔'}</span>
                <p>No hay datos curiosos en esta categoría aún.</p>
                <p><small>¡Prueba otra categoría!</small></p>
            </div>
        `;
    }

    // Ir al siguiente hecho
    nextFact() {
        if (this.isTransitioning || !this.availableFacts.length) return;
        
        this.currentFactIndex = (this.currentFactIndex + 1) % this.availableFacts.length;
        this.displayCurrentFact(true);
    }

    // Compartir hecho actual
    async share() {
        const fact = this.availableFacts[this.currentFactIndex];
        if (!fact) return;

        const shareText = `💡 ¡Dato curioso!\n\n${fact.title}\n\n${fact.description}\n\n🔗 Descubre más datos en Eureka!`;
        const shareUrl = window.location.href;

        // Web Share API si está disponible
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `💡 ${fact.title}`,
                    text: shareText,
                    url: shareUrl
                });
            } catch (err) {
                console.log('Compartir cancelado');
            }
        } else {
            // Fallback: copiar al clipboard
            try {
                await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                this.showIndicator('📋 ¡Copiado al portapapeles!');
            } catch (err) {
                // Fallback final: crear link mailto
                const mailtoLink = `mailto:?subject=${encodeURIComponent('💡 ' + fact.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                window.open(mailtoLink);
            }
        }
    }

    // Guardar/quitar de favoritos
    save() {
        const fact = this.availableFacts[this.currentFactIndex];
        if (!fact) return;

        const factId = this.getFactId(fact);
        const heartBtn = document.querySelector('.action-btn[onclick="App.save()"]');
        
        if (this.savedFacts.includes(factId)) {
            // Quitar de favoritos
            this.savedFacts = this.savedFacts.filter(id => id !== factId);
            heartBtn.style.color = '#667eea';
            this.showIndicator('💔 Quitado de favoritos');
        } else {
            // Agregar a favoritos
            this.savedFacts.push(factId);
            heartBtn.style.color = '#e74c3c';
            this.showIndicator('❤️ ¡Guardado en favoritos!');
        }

        this.saveFavoritesToStorage();
        this.updateSaveButton();
    }

    // Generar ID único para un hecho
    getFactId(fact) {
        return `${fact.category}-${fact.title.slice(0, 20)}`.replace(/\s+/g, '-').toLowerCase();
    }

    // Actualizar apariencia del botón de guardar
    updateSaveButton() {
        const fact = this.availableFacts[this.currentFactIndex];
        if (!fact) return;

        const factId = this.getFactId(fact);
        const heartBtn = document.querySelector('.action-btn[onclick="App.save()"]');
        
        if (heartBtn) {
            heartBtn.style.color = this.savedFacts.includes(factId) ? '#e74c3c' : '#667eea';
        }
    }

    // Actualizar botones de categoría activos
    updateCategoryButtons() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            const category = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
            btn.classList.toggle('active', category === this.currentCategory);
        });
    }

    // Mostrar indicador temporal
    showIndicator(message) {
        const indicator = document.createElement('div');
        indicator.className = 'saved-indicator';
        indicator.textContent = message;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 2000);
    }

    // Cargar favoritos del localStorage
    loadSavedFacts() {
        try {
            const saved = localStorage.getItem('eureka-favorites');
            return saved ? JSON.parse(saved) : [];
        } catch (err) {
            return [];
        }
    }

    // Guardar favoritos al localStorage
    saveFavoritesToStorage() {
        try {
            localStorage.setItem('eureka-favorites', JSON.stringify(this.savedFacts));
        } catch (err) {
            console.warn('No se pudieron guardar los favoritos');
        }
    }

    // Agregar listeners para gestos de swipe
    addSwipeListeners() {
        let startX = 0;
        let startY = 0;
        let isSwipe = false;

        const container = document.querySelector('.main-content');

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipe = false;
        });

        container.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);
            
            // Es un swipe horizontal si el movimiento horizontal > vertical
            if (diffX > diffY && diffX > 30) {
                isSwipe = true;
                e.preventDefault(); // Prevenir scroll
            }
        });

        container.addEventListener('touchend', (e) => {
            if (!isSwipe || !startX) return;
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            // Swipe left (siguiente hecho)
            if (diffX > 50) {
                this.nextFact();
            }
            
            // Reset
            startX = 0;
            startY = 0;
            isSwipe = false;
        });

        // También para mouse en desktop
        let isMouseDown = false;
        let mouseStartX = 0;

        container.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseStartX = e.clientX;
        });

        container.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
        });

        container.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            
            const diffX = mouseStartX - e.clientX;
            
            if (Math.abs(diffX) > 100) {
                if (diffX > 0) {
                    this.nextFact();
                }
            }
            
            isMouseDown = false;
            mouseStartX = 0;
        });
    }

    // Método para actualizar botón de guardar cuando cambie el hecho
    updateCurrentFact() {
        this.updateSaveButton();
    }
}

// Inicializar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.App = new EurekaApp();
    
    // Actualizar botón de guardar cuando se muestre un nuevo hecho
    const originalDisplayFact = window.App.displayCurrentFact;
    window.App.displayCurrentFact = function(withTransition = false) {
        originalDisplayFact.call(this, withTransition);
        setTimeout(() => this.updateSaveButton(), 100);
    };
});

// Prevenir zoom en doble tap en iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);