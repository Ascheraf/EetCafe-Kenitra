// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Mobile menu navigation
        const categoryButtons = document.querySelectorAll('.category-btn');
        const menuSections = document.querySelectorAll('.menu-section');

        if (!categoryButtons.length || !menuSections.length) {
            console.warn('Menu navigation elements not found');
            return;
        }

        // Restore search functionality
        const searchInput = document.getElementById('menu-search');
        const menuItems = document.querySelectorAll('.menu-item');

        if (searchInput) {
            let debounceTimeout;
            let lastSearchTerm = '';  // Track last search term

            const performSearch = (searchTerm) => {
                if (searchTerm === lastSearchTerm) return;  // Prevent unnecessary searches
                lastSearchTerm = searchTerm;

                // Use DocumentFragment for better performance
                const fragment = document.createDocumentFragment();
                let visibleSections = new Set();

                menuItems.forEach(item => {
                    const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
                    const description = item.querySelector('.description')?.textContent.toLowerCase() || '';
                    const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
                    
                    item.style.display = isMatch ? 'block' : 'none';
                    if (isMatch) {
                        const section = item.closest('.menu-section');
                        if (section) visibleSections.add(section.id);
                    }
                });

                // Update section visibility efficiently
                menuSections.forEach(section => {
                    section.style.display = visibleSections.has(section.id) ? 'block' : 'none';
                });
            };

            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    const searchTerm = searchInput.value.toLowerCase().trim();
                    performSearch(searchTerm);
                }, 150);
            });
        }

        function initializeMenuNavigation() {
            let activeButton = null;  // Track active button
            const headerOffset = document.querySelector('.menu-nav')?.offsetHeight || 0;

            // Ensure only one section is active initially
            const ensureOnlyOneActiveSection = () => {
                const activeSections = document.querySelectorAll('.menu-section.active');
                if (activeSections.length > 1) {
                    // Keep only the first active section
                    for (let i = 1; i < activeSections.length; i++) {
                        activeSections[i].classList.remove('active');
                    }
                }
            };

            // Call once on initialization
            ensureOnlyOneActiveSection();

            categoryButtons.forEach(button => {
                button.addEventListener('click', (event) => {
                    try {
                        // Prevent default behavior to avoid any browser quirks
                        event.preventDefault();
                        
                        if (activeButton === button) return;  // Prevent unnecessary updates

                        // Remove active class from previous button and section
                        if (activeButton) {
                            activeButton.classList.remove('active');
                            activeButton.setAttribute('aria-pressed', 'false');
                            const prevSection = document.getElementById(activeButton.dataset.category);
                            if (prevSection) prevSection.classList.remove('active');
                        }

                        // Update active button
                        button.classList.add('active');
                        button.setAttribute('aria-pressed', 'true');
                        activeButton = button;

                        // Hide all sections first
                        menuSections.forEach(section => {
                            section.classList.remove('active');
                        });

                        // Show target section
                        const targetSection = document.getElementById(button.dataset.category);
                        if (targetSection) {
                            targetSection.classList.add('active');
                            
                            // Use requestAnimationFrame for smooth scrolling
                            requestAnimationFrame(() => {
                                const elementPosition = targetSection.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                                });
                            });
                        } else {
                            console.error(`Target section #${button.dataset.category} not found`);
                        }
                    } catch (error) {
                        console.error('Error in menu navigation:', error);
                    }
                });
            });

            // Set initial active button based on URL hash or default to first button
            const setInitialActiveButton = () => {
                const hash = window.location.hash.substring(1);
                let initialButton;
                
                if (hash) {
                    initialButton = document.querySelector(`.category-btn[data-category="${hash}"]`);
                }
                
                if (!initialButton) {
                    initialButton = categoryButtons[0];
                }
                
                if (initialButton) {
                    initialButton.click();
                }
            };
            
            setInitialActiveButton();
        }

        // Improve mobile scrolling with better touch handling
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        const menuNav = document.querySelector('.menu-nav');

        function handleSwipe() {
            try {
                const currentIndex = Array.from(categoryButtons).findIndex(btn => btn.classList.contains('active'));
                const swipeThreshold = 50;
                const verticalThreshold = 30;
                
                // Calculate swipe distances
                const horizontalDistance = touchEndX - touchStartX;
                const verticalDistance = Math.abs(touchEndY - touchStartY);

                // Only handle horizontal swipes (prevent accidental swipes while scrolling)
                if (verticalDistance < verticalThreshold) {
                    if (horizontalDistance < -swipeThreshold && currentIndex < categoryButtons.length - 1) {
                        // Swipe left
                        categoryButtons[currentIndex + 1].click();
                    } else if (horizontalDistance > swipeThreshold && currentIndex > 0) {
                        // Swipe right
                        categoryButtons[currentIndex - 1].click();
                    }
                }
            } catch (error) {
                console.error('Error handling swipe:', error);
            }
        }

        function initializeMobileSwipe() {
            if (!menuNav) return;

            menuNav.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            menuNav.addEventListener('touchend', e => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                handleSwipe();
            }, { passive: true });
        }

        // Initialize menu navigation
        initializeMenuNavigation();
        initializeMobileSwipe();

        // Add intersection observer for lazy loading with error handling
        try {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.1
            });

            // Observe menu items for lazy loading
            document.querySelectorAll('.menu-item').forEach(item => {
                observer.observe(item);
            });
        } catch (error) {
            console.error('Error setting up lazy loading:', error);
        }

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            try {
                const currentIndex = Array.from(categoryButtons).findIndex(btn => btn.classList.contains('active'));
                
                if (e.key === 'ArrowRight' && currentIndex < categoryButtons.length - 1) {
                    categoryButtons[currentIndex + 1].click();
                } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    categoryButtons[currentIndex - 1].click();
                }
            } catch (error) {
                console.error('Error in keyboard navigation:', error);
            }
        });

        // Add cleanup for event listeners
        window.addEventListener('unload', () => {
            try {
                // Remove event listeners
                categoryButtons.forEach(button => {
                    button.replaceWith(button.cloneNode(true));
                });
                
                if (searchInput) {
                    searchInput.replaceWith(searchInput.cloneNode(true));
                }
            } catch (error) {
                console.error('Error cleaning up event listeners:', error);
            }
        });

    } catch (error) {
        console.error('Error initializing menu:', error);
    }
}); 