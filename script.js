

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
let masonryFrame;
let featuredCakes = [];
let featuredIndex = 0;
let featuredAutoTimer;
let featuredDragStartX = null;
let featuredDragged = false;


const galleryEl = document.getElementById('gallery');
const filterContainer = document.querySelector('.filters');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.getElementById('modal-caption');
const closeBtn = document.querySelector('.modal-close');
const searchInput = document.getElementById('search');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const themeToggle = document.getElementById('themeToggle');
const featuredGallery = document.getElementById('featuredGallery');
const pagePanels = document.querySelectorAll('.page-panel');
const navLinks = document.querySelectorAll('.nav-link');


function updateMasonryLayout() {
    const styles = getComputedStyle(galleryEl);
    const gap = parseFloat(styles.getPropertyValue('--gallery-gap')) || 20;
    const minItemWidth = 280;
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingRight = parseFloat(styles.paddingRight);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const paddingLeft = parseFloat(styles.paddingLeft);
    const galleryWidth = galleryEl.clientWidth - paddingLeft - paddingRight;

    if (!galleryWidth) return;

    const columnCount = Math.max(
        1,
        Math.floor((galleryWidth + gap) / (minItemWidth + gap))
    );
    const itemWidth = (galleryWidth - gap * (columnCount - 1)) / columnCount;
    const columnHeights = Array(columnCount).fill(0);

    galleryEl.querySelectorAll('.gallery-item').forEach(item => {
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
        item.style.width = `${itemWidth}px`;
        item.style.left = `${paddingLeft + shortestColumn * (itemWidth + gap)}px`;
        item.style.top = `${paddingTop + columnHeights[shortestColumn]}px`;

        columnHeights[shortestColumn] += item.getBoundingClientRect().height + gap;
    });

    const contentHeight = Math.max(0, Math.max(...columnHeights) - gap);
    galleryEl.style.height = `${paddingTop + contentHeight + paddingBottom}px`;
}

function scheduleMasonryLayout() {
    cancelAnimationFrame(masonryFrame);
    masonryFrame = requestAnimationFrame(updateMasonryLayout);
}



function createGalleryItem(cake) {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';

    const img = document.createElement('img');

    img.alt = cake.title;
    img.loading = 'lazy';

    img.addEventListener('load', () => {
        skeleton.remove();
        scheduleMasonryLayout();
    });

    img.addEventListener('error', () => {
        skeleton.remove();
        scheduleMasonryLayout();
    });

    img.src = cake.thumb;

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
scheduleMasonryLayout();
updateLoadMoreButton();
}

function initFeaturedGallery() {
    if (!featuredGallery) return;

    const featuredImageNames = [
        '2026_43', '2026_38', '2026_27', '2026_01', '2025_61', '2025_16',
        '2025_12', '2024_66', '2024_38', '2024_30', '2025_25', '2024_26',
        '2023_115', '2023_092', '2023_085', '2023_063', '2023_042', '2023_008'
    ];
    featuredCakes = featuredImageNames
        .map(name => cakes.find(cake => cake.src === `Images/${name}.webp`))
        .filter(Boolean);
    const fragment = document.createDocumentFragment();

    featuredCakes.forEach((cake, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'featured-card';
        card.setAttribute('aria-label', `Открыть: ${cake.title}`);

        const image = document.createElement('img');
        image.alt = cake.title;
        image.loading = 'lazy';
        image.addEventListener('load', () => {
            card.dataset.aspect = String(image.naturalWidth / image.naturalHeight);
            renderFeaturedCarousel();
        });
        image.src = cake.thumb;

        const label = document.createElement('span');
        label.className = 'featured-card-label';
        label.textContent = cake.title;

        card.append(image, label);
        card.addEventListener('click', () => {
            if (featuredDragged) return;
            if (index !== featuredIndex) {
                setFeaturedIndex(index);
                return;
            }

            filteredCakes = featuredCakes;
            openModalByIndex(featuredIndex);
        });
        fragment.appendChild(card);
    });

    featuredGallery.replaceChildren(fragment);
    featuredGallery.addEventListener('pointerdown', startFeaturedDrag);
    featuredGallery.addEventListener('pointerup', endFeaturedDrag);
    featuredGallery.addEventListener('pointercancel', endFeaturedDrag);
    featuredGallery.addEventListener('pointerenter', stopFeaturedAutoplay);
    featuredGallery.addEventListener('pointerleave', () => {
        if (document.getElementById('featured').classList.contains('active')) startFeaturedAutoplay();
    });
    renderFeaturedCarousel();
}

function getFeaturedOffset(index) {
    const count = featuredCakes.length;
    let offset = index - featuredIndex;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;
    return offset;
}

function renderFeaturedCarousel() {
    if (!featuredGallery || !featuredCakes.length) return;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const spacing = Math.min(featuredGallery.clientWidth * (isMobile ? .3 : .22), 285);
    const maxWidth = Math.min(featuredGallery.clientWidth * (isMobile ? .68 : .44), isMobile ? 390 : 590);
    const maxHeight = featuredGallery.clientHeight - 24;

    featuredGallery.querySelectorAll('.featured-card').forEach((card, index) => {
        const offset = getFeaturedOffset(index);
        const distance = Math.abs(offset);
        const isVisible = distance <= 4;
        const aspect = Number(card.dataset.aspect) || 1;
        const width = Math.min(maxWidth, maxHeight * aspect);
        const height = width / aspect;
        card.style.setProperty('--card-x', `${offset * spacing}px`);
        card.style.setProperty('--card-width', `${width}px`);
        card.style.setProperty('--card-height', `${height}px`);
        card.style.setProperty('--card-scale', `${Math.max(.4, 1 - distance * .16)}`);
        card.style.setProperty('--card-opacity', `${isVisible ? 1 : 0}`);
        card.style.setProperty('--card-layer', `${20 - distance}`);
        card.style.setProperty('--card-events', isVisible ? 'auto' : 'none');
        card.classList.toggle('is-current', distance === 0);
        card.setAttribute('aria-hidden', String(!isVisible));
    });
}

function setFeaturedIndex(index) {
    featuredIndex = (index + featuredCakes.length) % featuredCakes.length;
    renderFeaturedCarousel();
}

function nextFeatured() { setFeaturedIndex(featuredIndex + 1); }
function previousFeatured() { setFeaturedIndex(featuredIndex - 1); }

function stopFeaturedAutoplay() {
    clearInterval(featuredAutoTimer);
    featuredAutoTimer = undefined;
}

function startFeaturedAutoplay() {
    stopFeaturedAutoplay();
    if (featuredCakes.length) featuredAutoTimer = setInterval(nextFeatured, 6000);
}

function startFeaturedDrag(event) {
    featuredDragStartX = event.clientX;
    featuredDragged = false;
    featuredGallery.classList.add('is-dragging');
    featuredGallery.setPointerCapture?.(event.pointerId);
    stopFeaturedAutoplay();
}

function endFeaturedDrag(event) {
    if (featuredDragStartX === null) return;
    const distance = event.clientX - featuredDragStartX;
    featuredDragged = Math.abs(distance) > 8;
    featuredDragStartX = null;
    featuredGallery.classList.remove('is-dragging');
    if (distance > 35) previousFeatured();
    if (distance < -35) nextFeatured();
    window.setTimeout(() => { featuredDragged = false; }, 0);
    if (document.getElementById('featured').classList.contains('active')) startFeaturedAutoplay();
}

function showPage(pageId, updateHash = true) {
    const target = document.getElementById(pageId);
    if (!target || !target.classList.contains('page-panel')) return;

    pagePanels.forEach(panel => panel.classList.toggle('active', panel === target));
    navLinks.forEach(link => {
        const isActive = link.dataset.page === pageId;
        link.classList.toggle('active', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    if (updateHash) {
        history.replaceState(null, '', pageId === 'home' ? location.pathname : `#${pageId}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'home') scheduleMasonryLayout();
    if (pageId === 'featured') {
        renderFeaturedCarousel();
        startFeaturedAutoplay();
    }
    else stopFeaturedAutoplay();
}

function updateLoadMoreButton() {
    if (!loadMoreBtn) return;
    if (displayedCount >= filteredCakes.length) {
        loadMoreBtn.classList.add('hidden');
    } else {
        loadMoreBtn.classList.remove('hidden');
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

    const title = document.createElement('h2');
    title.textContent = cake.title;

    const description = document.createElement('p');
    description.textContent = cake.description;

    const year = document.createElement('p');
    year.textContent = `Год: ${cake.year}`;

    modalCaption.replaceChildren(title, description, year);

    if (cake.filling) {
        const filling = document.createElement('p');
        filling.className = 'cake-filling';
        filling.textContent = `Состав/начинка: ${cake.filling}`;
        modalCaption.appendChild(filling);
    }
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
            }
        }, 325);
    });
}


function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (!cakes || cakes.length === 0) {
        console.error('Массив cakes не определён или пуст!');
        return;
    }

    initFilters();
    applyFilter('all');
    initFeaturedGallery();

    navLinks.forEach(link => {
        link.addEventListener('click', () => showPage(link.dataset.page));
    });

    const initialPage = location.hash.slice(1);
    if (initialPage && document.getElementById(initialPage)) {
        showPage(initialPage, false);
    }

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
            closeModal();
        }
    }
});

window.addEventListener('hashchange', () => {
    const pageId = location.hash.slice(1) || 'home';
    showPage(pageId, false);
});

window.addEventListener('resize', scheduleMasonryLayout);
window.addEventListener('resize', renderFeaturedCarousel);

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
