class WebAlbum {
    constructor() {
        this.photos = this.loadPhotos();
        this.currentIndex = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderGrid();
        this.loadSampleImages();
    }

    setupEventListeners() {
        // Grid view
        document.getElementById('btnUpload').addEventListener('click', () => this.handleUpload());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));

        // Photo viewer
        document.getElementById('btnBack').addEventListener('click', () => this.closeViewer());
        document.getElementById('btnPrev').addEventListener('click', () => this.prevPhoto());
        document.getElementById('btnNext').addEventListener('click', () => this.nextPhoto());
        document.getElementById('btnDownload').addEventListener('click', () => this.downloadPhoto());
        document.getElementById('btnShare').addEventListener('click', () => this.sharePhoto());

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

    loadPhotos() {
        const stored = localStorage.getItem('albumPhotos');
        return stored ? JSON.parse(stored) : [];
    }

    savePhotos() {
        localStorage.setItem('albumPhotos', JSON.stringify(this.photos));
    }

    loadSampleImages() {
        if (this.photos.length === 0) {
            // Load sample images from picsum.photos (free service)
            const samplePhotos = Array.from({ length: 12 }, (_, i) => ({
                id: i,
                url: `https://picsum.photos/400/400?random=${Date.now() + i}`,
                timestamp: Date.now() - i * 3600000
            }));
            this.photos = samplePhotos;
            this.savePhotos();
            this.renderGrid();
        }
    }

    handleUpload() {
        document.getElementById('fileInput').click();
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.photos.unshift({
                    id: Date.now(),
                    url: event.target.result,
                    timestamp: Date.now()
                });
                this.savePhotos();
                this.renderGrid();
            };
            reader.readAsDataURL(file);
        });
    }

    renderGrid() {
        const grid = document.getElementById('albumGrid');
        grid.innerHTML = '';

        this.photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.innerHTML = `<img src="${photo.url}" alt="Photo ${index}" loading="lazy">`;
            grid.appendChild(item);
        });
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
            thumb.innerHTML = `<img src="${photo.url}" alt="Thumb ${index}">`;
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
        link.href = photo.url;
        link.download = `photo-${this.currentIndex + 1}.jpg`;
        link.click();
    }

    sharePhoto() {
        const photo = this.photos[this.currentIndex];
        if (navigator.share) {
            navigator.share({
                title: 'My Album',
                text: 'Check out this photo!',
                url: photo.url
            }).catch(err => console.log('Share cancelled'));
        } else {
            alert('Share not supported on this browser');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WebAlbum();
});
