// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu navigation
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuSections = document.querySelectorAll('.menu-section');
    const menuNav = document.querySelector('.menu-nav');
    if (!categoryButtons.length || !menuSections.length) {
        console.warn('Menu navigation elements not found');
        return;
    }

    // Touch swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;
    let currentIndex = 0;
    let lastSwipeTime = 0;
    menuNav.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    }, { passive: true });
    menuNav.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    menuNav.addEventListener('touchend', () => {
        const swipeThreshold = 100; // increased from 50 to 100 pixels
        const minSwipeSpeed = 0.5; // pixels per millisecond
        const swipeDebounce = 300; // milliseconds between swipes

        const currentTime = Date.now();
        const swipeTime = currentTime - touchStartTime;
        const swipeDistance = touchEndX - touchStartX;
        const swipeSpeed = Math.abs(swipeDistance) / swipeTime;
        if (currentTime - lastSwipeTime < swipeDebounce) {
            return; // Prevent rapid consecutive swipes
        }
        if (Math.abs(swipeDistance) > swipeThreshold && swipeSpeed > minSwipeSpeed) {
            // Find current active button index
            currentIndex = Array.from(categoryButtons).findIndex(btn => btn.classList.contains('active'));
            if (swipeDistance > 0 && currentIndex > 0) {
                // Swipe right - go to previous category
                categoryButtons[currentIndex - 1].click();
                lastSwipeTime = currentTime;
            } else if (swipeDistance < 0 && currentIndex < categoryButtons.length - 1) {
                // Swipe left - go to next category
                categoryButtons[currentIndex + 1].click();
                lastSwipeTime = currentTime;
            }
        }
    });

    // Handle category button clicks
    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default action

            // Update active states
            categoryButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');

            // Show/hide sections
            const targetCategory = button.dataset.category;
            menuSections.forEach(section => {
                if (section.id === targetCategory) {
                    section.classList.add('active');
                    section.style.display = 'block';
                } else {
                    section.classList.remove('active');
                    section.style.display = 'none';
                }
            });
        });
    });

    // Show initial category
    const initialCategory = categoryButtons[0];
    if (initialCategory) {
        initialCategory.click();
    }

    // Restore search functionality
    const searchInput = document.getElementById('menu-search');
    const menuItemsElements = document.querySelectorAll('.menu-item');
    if (searchInput) {
        let debounceTimeout;
        const performSearch = (searchTerm) => {
            const visibleSections = new Set();
            menuItemsElements.forEach(item => {
                const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
                const description = item.querySelector('.description')?.textContent.toLowerCase() || '';
                const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
                item.style.display = isMatch ? 'block' : 'none';
                if (isMatch) {
                    const section = item.closest('.menu-section');
                    if (section) visibleSections.add(section.id);
                }
            });
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
});