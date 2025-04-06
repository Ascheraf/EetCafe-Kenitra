// Mobile Features and Optimizations
class MobileEnhancer {
    constructor() {
        console.log('[MobileEnhancer] Initializing mobile enhancements...');
        // Add error boundary
        this.errorCount = 0;
        this.maxErrors = 3;  // Maximum number of errors before disabling features

        // Initialize instance properties
        this.scrollHandlers = new Set(); // Use a Set to store handlers
        this.handleScroll = this.handleScroll.bind(this);
        this.ticking = false;
        
        try {
            this.init();
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        console.error('[MobileEnhancer] Error encountered:', error);
        this.errorCount++;
        
        if (this.errorCount >= this.maxErrors) {
            console.warn('[MobileEnhancer] Too many errors, disabling mobile enhancements.');
            this.destroy();
        }
    }

    destroy() {
        // Cleanup event listeners
        window.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll() {
        if (!this.ticking) {
            window.requestAnimationFrame(() => {
                this.scrollHandlers.forEach(handler => handler()); // Use the Set of handlers
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    addScrollHandler(handler) {
        this.scrollHandlers.add(handler); // Add handler to the Set
        if (this.scrollHandlers.size === 1) {
            window.addEventListener('scroll', this.handleScroll, { passive: true });
        }
    }

    removeScrollHandler(handler) {
        this.scrollHandlers.delete(handler); // Remove handler from the Set
        if (this.scrollHandlers.size === 0) {
            window.removeEventListener('scroll', this.handleScroll);
        }
    }

    init() {
        console.log('[MobileEnhancer] Running initialization logic...');
        this.isMobile = window.innerWidth <= 768;
        if (this.isMobile) {
            this.setupScrollToTop();
            this.setupStickyHeader();
            this.setupLazyLoading();
            this.setupGestures();
        }
    }

    setupScrollToTop() {
        console.log('[MobileEnhancer] Setting up scroll-to-top button...');
        const button = document.createElement('button');
        button.className = 'scroll-top';
        button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/></svg>';
        button.setAttribute('aria-label', 'Scroll naar boven');
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.width = '50px';
        button.style.height = '50px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#4a7a8a';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.display = 'none';
        button.style.zIndex = '1000';
        button.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        document.body.appendChild(button);

        const handleScrollVisibility = () => {
            if (window.scrollY > 200) {
                button.style.display = 'block';
                button.style.opacity = '1';
                button.style.transform = 'scale(1)';
            } else {
                button.style.opacity = '0';
                button.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (window.scrollY <= 200) {
                        button.style.display = 'none';
                    }
                }, 300);
            }
        };

        window.addEventListener('scroll', handleScrollVisibility, { passive: true });

        button.addEventListener('click', () => {
            console.log('[MobileEnhancer] Scroll-to-top button clicked.');
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    setupStickyHeader() {
        console.log('[MobileEnhancer] Setting up sticky header...');
        const header = document.querySelector('.menu-header');
        const nav = document.querySelector('.menu-nav');
        let lastScroll = 0;
        let scrollTimer;

        const handleHeaderVisibility = () => {
            const currentScroll = window.scrollY;
            
            if (!header.classList.contains('smooth-transition')) {
                header.classList.add('smooth-transition');
                nav.classList.add('smooth-transition');
            }

            if (currentScroll > lastScroll && currentScroll > 100) {
                header.classList.add('header-hidden');
                nav.classList.add('nav-top');
            } else {
                header.classList.remove('header-hidden');
                nav.classList.remove('nav-top');
            }
            
            lastScroll = currentScroll;

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                header.classList.remove('smooth-transition');
                nav.classList.remove('smooth-transition');
            }, 150);
        };

        this.addScrollHandler(handleHeaderVisibility);
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.addEventListener('load', () => img.classList.add('loaded'));
            img.src = img.dataset.src;
        });
    }

    setupGestures() {
        console.log('[MobileEnhancer] Setting up gestures...');
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            console.log('[MobileEnhancer] Touch start:', touchStartX);
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            console.log('[MobileEnhancer] Touch end:', touchEndX);
            this.handleSwipe();
        }, { passive: true });

        this.handleSwipe = () => {
            const swipeDistance = touchEndX - touchStartX;
            console.log('[MobileEnhancer] Swipe distance:', swipeDistance);

            if (Math.abs(swipeDistance) > minSwipeDistance) {
                const categories = Array.from(document.querySelectorAll('.category-btn'));
                const activeIndex = categories.findIndex(btn => btn.classList.contains('active'));

                if (activeIndex !== -1) {
                    if (swipeDistance > 0 && activeIndex > 0) {
                        console.log('[MobileEnhancer] Swipe right, activating previous category.');
                        categories[activeIndex - 1].click();
                    } else if (swipeDistance < 0 && activeIndex < categories.length - 1) {
                        console.log('[MobileEnhancer] Swipe left, activating next category.');
                        categories[activeIndex + 1].click();
                    }
                }
            }
        };
    }
}

// Initialize mobile enhancements when DOM is loaded
let mobileEnhancer;
document.addEventListener('DOMContentLoaded', () => {
    mobileEnhancer = new MobileEnhancer();
});

// Replace 'unload' with 'beforeunload' to avoid deprecated warnings
window.addEventListener('beforeunload', (event) => {
    console.log('Page is about to be unloaded.');
    // Optionally, set a confirmation dialog using modern standards
    event.preventDefault();
});