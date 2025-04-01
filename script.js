// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch menu items from the backend
        const menuItems = await fetchMenu();
        populateMenu(menuItems);

        // Mobile menu navigation
        const categoryButtons = document.querySelectorAll('.category-btn');
        const menuSections = document.querySelectorAll('.menu-section');

        if (!categoryButtons.length || !menuSections.length) {
            console.warn('Menu navigation elements not found');
            return;
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

        // Menu section switching functionality
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');

                categoryButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');

                menuSections.forEach(section => {
                    section.classList.toggle('active', section.id === category);
                });

                const section = document.getElementById(category);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        async function fetchMenu() {
            try {
                const response = await fetch('http://localhost:3000/api/menu');
                if (!response.ok) throw new Error('Failed to fetch menu');
                return await response.json();
            } catch (error) {
                console.error('Error fetching menu:', error);
                return [];
            }
        }

        function populateMenu(menuItems) {
            const menuSections = document.querySelectorAll('.menu-section');
            menuItems.forEach(item => {
                const section = menuSections[0]; // Example: Add all items to the first section
                const menuItem = document.createElement('div');
                menuItem.classList.add('menu-item');
                menuItem.innerHTML = `
                    <div class="item-header">
                        <h3>${item.name}</h3>
                        <span class="price">€${item.price.toFixed(2)}</span>
                    </div>
                    <p class="description">${item.description}</p>
                    <button class="order-button">
                        Order
                        <div class="upgrade-options hidden">
                            <p>Upgrade Options:</p>
                            <ul>
                                <li>Extra Cheese</li>
                                <li>Large Size</li>
                                <li>Extra Sauce</li>
                            </ul>
                        </div>
                    </button>
                `;
                section.querySelector('.menu-items').appendChild(menuItem);
            });
        }

        document.querySelectorAll('.order-button').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const upgradeOptions = button.querySelector('.upgrade-options');
                if (upgradeOptions) {
                    upgradeOptions.classList.toggle('hidden');
                }
            });
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.upgrade-options').forEach(options => {
                options.classList.add('hidden');
            });
        });

    } catch (error) {
        console.error('Error initializing menu:', error);
    }
});