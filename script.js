// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch menu items from the backend
        const menuItems = await fetchMenu();
        populateMenu(menuItems);

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
        let currentIndex = 0;

        menuNav.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        menuNav.addEventListener('touchmove', (e) => {
            touchEndX = e.touches[0].clientX;
        }, { passive: true });

        menuNav.addEventListener('touchend', () => {
            const swipeThreshold = 50; // minimum distance for a swipe
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
                // Find current active button index
                currentIndex = Array.from(categoryButtons).findIndex(btn => btn.classList.contains('active'));

                if (swipeDistance > 0 && currentIndex > 0) {
                    // Swipe right - go to previous category
                    categoryButtons[currentIndex - 1].click();
                } else if (swipeDistance < 0 && currentIndex < categoryButtons.length - 1) {
                    // Swipe left - go to next category
                    categoryButtons[currentIndex + 1].click();
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

        // Add cart functionality
        const cart = [];
        const cartItemsElement = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        const checkoutModal = document.getElementById('checkout-modal');
        const checkoutTotalElement = document.getElementById('checkout-total');
        const closeModalButton = document.getElementById('close-modal');
        const checkoutForm = document.getElementById('checkout-form');

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.itemId;
                const itemPrice = parseFloat(button.dataset.price);
                const itemName = button.previousElementSibling.previousElementSibling.textContent;

                const existingItem = cart.find(item => item.id === itemId);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    cart.push({ id: itemId, name: itemName, price: itemPrice, quantity: 1 });
                }

                updateCart();
            });
        });

        function updateCart() {
            cartItemsElement.innerHTML = '';
            let total = 0;

            cart.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}`;

                const removeButton = document.createElement('span');
                removeButton.textContent = 'Remove';
                removeButton.classList.add('cart-item-remove');
                removeButton.addEventListener('click', () => {
                    removeFromCart(item.id);
                });

                li.appendChild(removeButton);
                cartItemsElement.appendChild(li);
                total += item.price * item.quantity;
            });

            cartTotalElement.textContent = total.toFixed(2);
        }

        function removeFromCart(itemId) {
            const itemIndex = cart.findIndex(item => item.id === itemId);
            if (itemIndex > -1) {
                cart.splice(itemIndex, 1);
                updateCart();
            }
        }

        document.getElementById('checkout-btn').addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            checkoutTotalElement.textContent = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
            checkoutModal.classList.remove('hidden');
        });

        closeModalButton.addEventListener('click', () => {
            checkoutModal.classList.add('hidden');
        });

        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(checkoutForm);
            const orderDetails = {
                name: formData.get('name'),
                address: formData.get('address'),
                phone: formData.get('phone'),
                items: cart,
                total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
            };

            try {
                const response = await fetch('http://localhost:3000/api/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderDetails),
                });

                if (!response.ok) throw new Error('Failed to place order');
                const result = await response.json();
                alert(`Order placed successfully! Order ID: ${result.orderId}`);
                cart.length = 0; // Clear the cart
                updateCart();
                checkoutModal.classList.add('hidden');
            } catch (error) {
                console.error('Error placing order:', error);
                alert('Failed to place order. Please try again.');
            }
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