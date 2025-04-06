document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuSections = document.querySelectorAll('.menu-section');
    if (!categoryButtons.length || !menuSections.length) {
        console.warn('Menu navigation elements not found');
        return;
    }

    categoryButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const button = e.target;

            categoryButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');

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

    const initialCategory = categoryButtons[0];
    if (initialCategory) {
        initialCategory.click();
    }
});