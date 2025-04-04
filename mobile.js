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
        this.sectionObserver = null;
        this.imageObserver = null;
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
        window.removeEventListener('scroll', this.setViewportHeight);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.setupOrientationChange);
        // Remove intersection observers
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
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
        // Initialize based on screen size
        this.isMobile = window.innerWidth <= 768;
        if (this.isMobile) {
            this.setupScrollToTop();
            this.enhanceTouchFeedback();
            this.setupStickyHeader();
            this.setupMobileMenu();
            this.setupLazyLoading();
            this.setupGestures();
            
            // Remove overflow restrictions
            document.body.style.overscrollBehavior = 'auto';
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
            
            // Ensure menu container is scrollable
            const menuContainer = document.querySelector('.menu-container');
            if (menuContainer) {
                menuContainer.style.height = 'auto';
                menuContainer.style.overflow = 'visible';
            }
        }
    }

    setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        });
    }

    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateLayoutOnResize();
                this.setViewportHeight();
            }, 250);
        }, { passive: true });
    }

    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            this.updateLayoutOnResize();
            // Small delay to ensure new dimensions are available
            setTimeout(() => this.setViewportHeight(), 100);
        }, { passive: true });
    }

    updateLayoutOnResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        if (wasMobile !== this.isMobile) {
            this.init();
        }
        
        // Update header positions
        this.updateHeaderPositions();
    }

    setupScrollToTop() {
        console.log('[MobileEnhancer] Setting up scroll-to-top button...');
        const button = document.createElement('button');
        button.className = 'scroll-top';
        button.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)"/></svg>';
        button.setAttribute('aria-label', 'Scroll naar boven');
        document.body.appendChild(button);

        const handleScrollVisibility = () => {
            if (window.scrollY > 200) {
                button.classList.add('visible');
            } else {
                button.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', handleScrollVisibility, { passive: true });

        button.addEventListener('click', () => {
            console.log('[MobileEnhancer] Scroll-to-top button clicked.');
            this.smoothScrollTo(0);
        });
    }

    setupMobileMenu() {
        const menuContainer = document.querySelector('.menu-container');
        
        try {
            // Enable smooth scrolling only for non-iOS devices
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (!isIOS) {
                menuContainer.style.scrollBehavior = 'smooth';
            }

            // Don't set up a separate observer for sections - rely on script.js
            // This prevents conflicts between the two scripts
            
            // Just ensure all sections are visible for proper rendering
            document.querySelectorAll('.menu-section').forEach(section => {
                section.style.opacity = '1';
                section.style.transform = 'none';
            });
            
            // Add a helper method to update active category if needed
            this.updateActiveCategory = (button) => {
                // Only update if not already being handled by script.js
                if (!button.classList.contains('active')) {
                    button.click(); // Use the click handler from script.js
                }
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    enhanceTouchFeedback() {
        const elements = document.querySelectorAll('.menu-item, .category-btn');
        
        elements.forEach(element => {
            let startX, startY, isScrolling;
            
            element.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isScrolling = undefined;
                element.style.transition = 'transform 0.1s ease';
                element.style.transform = 'scale(0.98)';
            }, { passive: true });

            element.addEventListener('touchmove', (e) => {
                if (isScrolling === undefined) {
                    isScrolling = Math.abs(e.touches[0].clientY - startY) > Math.abs(e.touches[0].clientX - startX);
                }
                
                if (!isScrolling) {
                    e.preventDefault();
                }
            }, { passive: false });

            element.addEventListener('touchend', () => {
                element.style.transform = '';
                setTimeout(() => {
                    element.style.transition = '';
                }, 100);
            }, { passive: true });
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
        console.log('[MobileEnhancer] Setting up lazy loading...');
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    console.log('[MobileEnhancer] Lazy loading image:', img.dataset.src);
                    this.loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });

        images.forEach(img => imageObserver.observe(img));
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

    smoothScrollTo(targetY) {
        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }

    updateActiveCategory(activeButton) {
        if (!activeButton) return;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        activeButton.classList.add('active');
        
        // Ensure active button is visible in the navigation
        const nav = document.querySelector('.menu-nav');
        const buttonRect = activeButton.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        
        if (buttonRect.left < navRect.left || buttonRect.right > navRect.right) {
            activeButton.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        img.src = src;
        img.removeAttribute('data-src');
        
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
    }

    updateHeaderPositions() {
        const header = document.querySelector('.menu-header');
        const nav = document.querySelector('.menu-nav');
        
        if (this.isMobile) {
            nav.style.top = header.offsetHeight + 'px';
        } else {
            nav.style.top = '0';
        }
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