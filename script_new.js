

cakes.sort((a, b) => b.id - a.id);


const PHOTOS_PER_PAGE = 28;
let filteredCakes = [];
let displayedCount = 0;
let currentFilter = 'all';
let currentIndex = 0;
let activeFilterResults = [];
let searchTimeout;
let touchStartX = 0;
let touchEndX = 0;


const galleryEl = document.getElementById('gallery');
const filterContainer = document.querySelector('.filters');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const closeBtn = document.querySelector('.modal-close');
const searchInput = document.getElementById('search');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const themeToggle = document.getElementById('themeToggle');



function createGalleryItem(cake) {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';

    const img = document.createElement('img');

    img.src = cake.thumb;
    img.alt = cake.title;
    img.loading = 'lazy';

    img.addEventListener('load', () => {
        skeleton.remove();
    });

    item.appendChild(skeleton);

    img.dataset.id = cake.id;

    const caption = document.createElement('div');
    caption.className = 'item-caption';
    const title = document.createElement('h3');
    title.textContent = cake.title;
    const year = document.createElement('span');
    year.textContent = cake.year;
    caption.appendChild(year);
    caption.appendChild(title);

    item.appendChild(img);
    item.appendChild(caption);

    item.addEventListener('click', () => {
        const index = filteredCakes.findIndex(c => c.id === cake.id);
        openModalByIndex(index);
    });

    return item;
}

function nextPhoto() {
    if (currentIndex < filteredCakes.length - 1) {
        openModalByIndex(currentIndex + 1);
    }
}

function prevPhoto() {
    if (currentIndex > 0) {
        openModalByIndex(currentIndex - 1);
    }
}

function handleSwipe() {

    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) < 60) {
        return;
    }

    if (swipeDistance > 0) {
        prevPhoto();
    } else {
        nextPhoto();
    }
}


function updateModalNav() {
    const counterEl = document.getElementById('modalCounter');
    if (counterEl) {
        counterEl.textContent = `${currentIndex + 1} из ${filteredCakes.length}`;
    }

    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');
    if (prevBtn) {
        prevBtn.classList.toggle('hidden', currentIndex === 0);
    }
    if (nextBtn) {
        nextBtn.classList.toggle('hidden', currentIndex === filteredCakes.length - 1);
    }
}

function loadMore() {
    const remaining = filteredCakes.length - displayedCount;
    if (remaining <= 0) return;

    const countToAdd = Math.min(PHOTOS_PER_PAGE, remaining);
    const itemsToAdd = filteredCakes.slice(displayedCount, displayedCount + countToAdd);

    const fragment = document.createDocumentFragment();

    itemsToAdd.forEach(cake => {
    fragment.appendChild(createGalleryItem(cake));
  });

    galleryEl.appendChild(fragment);

displayedCount += countToAdd;
updateLoadMoreButton();
updateResultsCounter();
}

function updateLoadMoreButton() {
    if (!loadMoreBtn) return;
    if (displayedCount >= filteredCakes.length) {
        loadMoreBtn.classList.add('hidden');
    } else {
        loadMoreBtn.classList.remove('hidden');
    }
}

function updateResultsCounter() {
    const counterEl = document.getElementById('resultsCounter');
    if (counterEl) {
        counterEl.textContent = `Показано ${displayedCount} из ${filteredCakes.length} работ`;
    }
}

function applyFilter(filterValue) {
    currentFilter = filterValue;

    if (filterValue === 'all') {

        activeFilterResults = cakes.slice();

    } else {

        const lowerFilter = filterValue.toLowerCase();

        activeFilterResults = cakes.filter(cake =>
            cake.tags.some(
                tag => tag.toLowerCase() === lowerFilter
           )
        );
    }

    filteredCakes = activeFilterResults.slice();

    displayedCount = 0;
    galleryEl.replaceChildren();

    loadMore();
    updateLoadMoreButton();
    updateResultsCounter();
}

function getUniqueFilters() {
    const allTags = cakes.flatMap(c => c.tags);
    const tags = [...new Set(allTags)].sort();
    return { tags };
}

function createFilterButton(filterValue, displayText) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = filterValue;
    btn.textContent = displayText;
    if (filterValue === 'all') {
        btn.classList.add('all-filter');
    }

    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilter(filterValue);
    });

    return btn;
}

function initFilters() {
    filterContainer.replaceChildren();
    const { tags } = getUniqueFilters();

    filterContainer.appendChild(createFilterButton('all', 'Все'));

    tags.forEach(tag => {
        filterContainer.appendChild(createFilterButton(tag, tag));
    });
}

function openModalByIndex(index) {
    if (index < 0 || index >= filteredCakes.length) return;
    currentIndex = index;
    const cake = filteredCakes[currentIndex];

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalImg.src = cake.src;
    modalImg.alt = cake.title;

    let captionHTML = `
        <h2>${cake.title}</h2>
        <p>${cake.description}</p>
        <p>Год: ${cake.year}</p>
    `;

    if (cake.filling) {
        captionHTML += `<p class="cake-filling">Состав/начинка: ${cake.filling}</p>`;
    }

    modalCaption.innerHTML = captionHTML;
    updateModalNav();
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();

            if (query === '') {
                applyFilter(currentFilter);
            } else {
                const source = currentFilter === 'all'
                    ? cakes
                    : activeFilterResults;

                const searchResults = source.filter(cake =>
                    cake.title.toLowerCase().includes(query) ||
                    cake.tags.some(tag => tag.toLowerCase().includes(query)) ||
                    (cake.description &&
                     cake.description.toLowerCase().includes(query))
                );

                filteredCakes = searchResults;
                displayedCount = 0;

                galleryEl.replaceChildren();

                loadMore();
                updateLoadMoreButton();
                updateResultsCounter();
            }
        }, 325);
    });
}


closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!cakes || cakes.length === 0) {
        console.error('Массив cakes не определён или пуст!');
        return;
    }

    initFilters();
    applyFilter('all');

    const allBtn = document.querySelector('[data-filter="all"]');
    if (allBtn) allBtn.classList.add('active');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }

    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');

    if (prevBtn) {
        prevBtn.addEventListener('click', prevPhoto);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextPhoto);
    }
    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;

        handleSwipe();
    }, { passive: true });
});

window.addEventListener('keydown', (e) => {
    if (modal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') {
            prevPhoto();
        } else if (e.key === 'ArrowRight') {
            nextPhoto();
        } else if (e.key === 'Escape') {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }
});

const scrollBtn = document.getElementById('scrollToTop');

if (scrollBtn) {
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
} else {
    console.warn('Кнопка "Наверх" не найдена. Проверь ID в HTML.');
}

const disclaimerBtn = document.getElementById('disclaimerBtn');
const disclaimerPopup = document.getElementById('disclaimerPopup');
const popupClose = document.getElementById('popupClose');

if (disclaimerBtn && disclaimerPopup && popupClose) {
    disclaimerBtn.addEventListener('click', () => {
        disclaimerPopup.style.display = 'block';
    });

    popupClose.addEventListener('click', () => {
        disclaimerPopup.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (!disclaimerPopup.contains(e.target) && e.target !== disclaimerBtn) {
            disclaimerPopup.style.display = 'none';
        }
    });
}


if (themeToggle) {

    themeToggle.addEventListener('click', () => {

        document.body.classList.toggle('dark-mode');

        const isDark =
            document.body.classList.contains('dark-mode');

        themeToggle.textContent =
            isDark ? '☀️' : '🌙';

        localStorage.setItem(
            'theme',
            isDark ? 'dark' : 'light'
        );
    });

    const savedTheme =
        localStorage.getItem('theme');

    if (savedTheme === 'dark') {

        document.body.classList.add('dark-mode');

        themeToggle.textContent = '☀️';
    }
}