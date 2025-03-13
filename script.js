document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const menuSections = document.querySelectorAll('.menu-section');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and sections
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            menuSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked button and corresponding section
            button.classList.add('active');
            const category = button.dataset.category;
            document.getElementById(category).classList.add('active');
        });
    });
});
