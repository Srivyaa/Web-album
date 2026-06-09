class WebAlbum {
    constructor() {
        this.photos = [];
        this.currentIndex = 0;
        this.unsplashAccessKey = 'your_unsplash_access_key'; // Replace with your Unsplash API key
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUnsplashPhotos();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchPhotos();
            }
        });
        document.getElementById('searchBtn').addEventListener('click', () => this.searchPhotos());

        // Load more button
        document.getElementById('loadMoreBtn').addEventListener('click', () => this.loadMorePhotos());

        // Photo viewer
        document.getElementById('btnBack').addEventListener('click', () => this.closeViewer());
        document.getElementById('btnPrev').addEventListener('click', () => this.prevPhoto());
        document.getElementById('btnNext').addEventListener('click', () => this.nextPhoto());
        document.getElementById('btnDownload').addEventListener('click', () => this.downloadPhoto());
        document.getElementById('btnShare').addEventListener('click', () => this.sharePhoto());
        document.getElementById('btnFull').addEventListener('click', () => this.openInNew());

        // Thumbnail strip
        document.getElementById('albumGrid').addEventListener('click', (e) => {
            const gridItem = e.target.closest('.grid-item');
            if (gridItem) {
                const index = Array.from(document.querySelectorAll('.grid-item')).indexOf(gridItem);
                this.openViewer(index);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('photoViewer').classList.contains('hidden')) {
                if (e.key === 'ArrowLeft') this.prevPhoto();
                if (e.key === 'ArrowRight') this.nextPhoto();
                if (e.key === 'Escape') this.closeViewer();
            }
        });

        // Touch gestures
        let touchStartX = 0;
        const photoViewer = document.getElementById('photoViewer');
        photoViewer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        photoViewer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.nextPhoto();
                else this.prevPhoto();
            }
        });
    }

    async loadUnsplashPhotos(query = 'nature', page = 1) {
        try {
            document.getElementById('loadingSpinner').style.display = 'flex';
            
            // Using Unsplash Source API (no API key required for basic usage)
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=20&client_id=YOUR_UNSPLASH_ACCESS_KEY`
            );

            if (!response.ok) {
                // Fallback to Unsplash Source endpoint (no auth needed)
                this.loadFallbackPhotos(query, page);
                return;
            }

            const data = await response.json();
            
            if (page === 1) {
                this.photos = [];
            }

            this.photos = this.photos.concat(data.results.map(photo => ({
                id: photo.id,
                url: photo.urls.regular,
                thumb: photo.urls.thumb,
                fullUrl: photo.urls.full,
                author: photo.user.name,
                link: photo.links.html,
                description: photo.description || photo.alt_description || 'Unsplash Photo'
            })));

            this.renderGrid();
            document.getElementById('loadingSpinner').style.display = 'none';
        } catch (error) {
            console.error('Error loading photos:', error);
            this.loadFallbackPhotos(query, page);
        }
    }

    loadFallbackPhotos(query = 'nature', page = 1) {
        // Fallback: Use Unsplash Source API (random or search-like results)
        const startIndex = (page - 1) * 20;
        const fallbackPhotos = Array.from({ length: 20 }, (_, i) => {
            const photoId = startIndex + i;
            return {
                id: `fallback-${photoId}`,
                url: `https://source.unsplash.com/600x600/?${query}&${photoId}`,
                thumb: `https://source.unsplash.com/200x200/?${query}&${photoId}`,
                fullUrl: `https://source.unsplash.com/1600x1200/?${query}&${photoId}`,
                author: 'Unsplash',
                link: 'https://unsplash.com',
                description: `${query} photography`
            };
        });

        if (page === 1) {
            this.photos = [];
        }

        this.photos = this.photos.concat(fallbackPhotos);
        this.renderGrid();
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    searchPhotos() {
        const query = document.getElementById('searchInput').value.trim();
        if (query) {
            this.loadUnsplashPhotos(query, 1);
        }
    }

    loadMorePhotos() {
        const currentPage = Math.ceil(this.photos.length / 20) + 1;
        const query = document.getElementById('searchInput').value.trim() || 'nature';
        this.loadUnsplashPhotos(query, currentPage);
    }

    renderGrid() {
        const grid = document.getElementById('albumGrid');
        grid.innerHTML = '';

        this.photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `<img src="${photo.thumb}" alt="${photo.description}" loading="lazy">`;
            grid.appendChild(item);
        });

        // Show load more button if we have photos
        document.getElementById('loadMoreBtn').style.display = this.photos.length > 0 ? 'block' : 'none';
    }

    openViewer(index) {
        this.currentIndex = index;
        document.getElementById('photoViewer').classList.remove('hidden');
        document.body.classList.add('viewer-open');
        this.displayPhoto();
        this.renderThumbnails();
        this.scrollThumbnailToActive();
    }

    closeViewer() {
        document.getElementById('photoViewer').classList.add('hidden');
        document.body.classList.remove('viewer-open');
    }

    displayPhoto() {
        const photo = this.photos[this.currentIndex];
        document.getElementById('mainPhoto').src = photo.url;
        document.getElementById('photoAuthor').textContent = `Photo by ${photo.author}`;
        document.getElementById('currentPhoto').textContent = this.currentIndex + 1;
        document.getElementById('totalPhotos').textContent = this.photos.length;
    }

    nextPhoto() {
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this.displayPhoto();
        this.scrollThumbnailToActive();
    }

    prevPhoto() {
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this.displayPhoto();
        this.scrollThumbnailToActive();
    }

    renderThumbnails() {
        const strip = document.getElementById('thumbnailStrip');
        strip.innerHTML = '';

        this.photos.forEach((photo, index) => {
            const thumb = document.createElement('div');
            thumb.className = `thumbnail ${index === this.currentIndex ? 'active' : ''}`;
            thumb.innerHTML = `<img src="${photo.thumb}" alt="Thumb ${index}">`;
            thumb.addEventListener('click', () => {
                this.currentIndex = index;
                this.displayPhoto();
                this.scrollThumbnailToActive();
                this.updateActiveThumbnail();
            });
            strip.appendChild(thumb);
        });
    }

    scrollThumbnailToActive() {
        const strip = document.getElementById('thumbnailStrip');
        const activeThumbnail = strip.querySelector('.thumbnail.active');
        
        if (activeThumbnail) {
            this.updateActiveThumbnail();
            activeThumbnail.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    updateActiveThumbnail() {
        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            if (index === this.currentIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }

    downloadPhoto() {
        const photo = this.photos[this.currentIndex];
        const link = document.createElement('a');
        link.href = photo.fullUrl;
        link.download = `unsplash-${photo.id}.jpg`;
        link.click();
    }

    sharePhoto() {
        const photo = this.photos[this.currentIndex];
        if (navigator.share) {
            navigator.share({
                title: 'Unsplash Photo',
                text: photo.description,
                url: photo.link
            }).catch(err => console.log('Share cancelled'));
        } else {
            // Fallback: Copy link to clipboard
            const text = `${photo.description}\n${photo.link}`;
            navigator.clipboard.writeText(text).then(() => {
                alert('Photo link copied to clipboard!');
            });
        }
    }

    openInNew() {
        const photo = this.photos[this.currentIndex];
        window.open(photo.link, '_blank');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WebAlbum();
});
