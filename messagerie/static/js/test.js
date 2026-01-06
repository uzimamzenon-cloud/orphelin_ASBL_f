// =====================================================================
// VARIABLES GLOBALES
// =====================================================================
const API_BASE_URL = window.location.origin;
let isSubmitting = false;
let contactForm = null;

// Variables pour les autres fonctionnalités
let preloader, header, mobileMenuBtn, navMenu, navLinks, backToTopBtn;
let donationModal, modalClose, galleryModal, galleryModalClose, galleryModalImg, galleryModalCaption;
let themeToggle;
let carouselTrack, carouselPrev, carouselNext, carouselIndicators;

// Données du carousel principal
const carouselImages = [
    {
        url: '/static/images/IMG-20251212-WA0000.jpg',
        title: 'Notre équipe en action',
        description: 'Réunion de travail avec notre équipe sur le terrain'
    },
    {
        url: '/static/images/IMG-20251212-WA0005.jpg',
        title: 'Distribution scolaire',
        description: 'Remise de kits scolaires aux enfants'
    },
    {
        url: '/static/images/Screenshot_20251211-124109.png',
        title: 'Activités éducatives',
        description: 'Ateliers éducatifs avec les enfants'
    },
    {
        url: '/static/images/IMG-20251212-WA0002.jpg',
        title: 'Visites communautaires',
        description: 'Rencontres avec les familles dans les communautés'
    },
    {
        url: '/static/images/Screenshot_20251211-124304.png',
        title: 'Formation des bénévoles',
        description: "Formation des membres de l'équipe"
    },
    {
        url: '/static/images/IMG-20251212-WA0003.jpg',
        title: 'Nos réalisations',
        description: 'Bilan des projets réalisés cette année'
    }
];

let currentSlideIndex = 0;
let isMobile = false;
let touchStartX = 0;
let touchEndX = 0;

// =====================================================================
// FONCTIONS UTILITAIRES CSRF - OPTIMISÉES
// =====================================================================
function getCSRFToken() {
    // 1. Chercher dans les cookies
    const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
    if (csrfCookie) return csrfCookie.split('=')[1];

    // 2. Chercher dans le DOM
    const csrfInput = document.querySelector('[name="csrfmiddlewaretoken"]');
    if (csrfInput) return csrfInput.value;

    // 3. Chercher dans les meta tags
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) return metaToken.content;

    console.warn('CSRF token non trouvé');
    return null;
}

// =====================================================================
// FONCTIONS DU FORMULAIRE DE CONTACT - VERSION PROFESSIONNELLE
// =====================================================================
function initContactForm() {
    contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        console.error('❌ Formulaire de contact introuvable');
        return;
    }

    console.log('✅ Formulaire de contact initialisé');

    // Vérifier que tous les champs existent
    const requiredFields = ['name', 'email', 'message'];
    const missingFields = requiredFields.filter(field => !document.getElementById(field));

    if (missingFields.length > 0) {
        console.error('❌ Champs manquants:', missingFields);
        return;
    }

    // Ajouter le token CSRF si manquant
    ensureCSRFToken();

    // Événement de soumission
    contactForm.addEventListener('submit', handleFormSubmit);
}

function ensureCSRFToken() {
    if (!contactForm) return;

    const csrfToken = getCSRFToken();
    if (csrfToken && !contactForm.querySelector('[name="csrfmiddlewaretoken"]')) {
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrfmiddlewaretoken';
        csrfInput.value = csrfToken;
        contactForm.appendChild(csrfInput);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
        showToast('⏳ Un envoi est déjà en cours...', 'warning');
        return;
    }

    // 1. RÉCUPÉRATION ET VALIDATION DES DONNÉES
    const formData = collectFormData();
    if (!formData) return;

    // 2. PRÉPARATION DE L'INTERFACE
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;
    isSubmitting = true;

    // 3. ENVOI DES DONNÉES
    const success = await sendFormData(formData);

    // 4. RÉINITIALISATION
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    isSubmitting = false;

    // 5. RÉINITIALISER LE FORMULAIRE SI SUCCÈS
    if (success) {
        contactForm.reset();
    }
}

function collectFormData() {
    const fields = {
        name: document.getElementById('name'),
        email: document.getElementById('email'),
        subject: document.getElementById('subject'),
        reason: document.getElementById('reason'),
        message: document.getElementById('message')
    };

    // Validation des champs obligatoires
    if (!fields.name.value.trim()) {
        showToast('❌ Le nom est obligatoire', 'error');
        fields.name.focus();
        return null;
    }

    if (!fields.email.value.trim()) {
        showToast('❌ L\'email est obligatoire', 'error');
        fields.email.focus();
        return null;
    }

    if (!validateEmail(fields.email.value)) {
        showToast('❌ Format d\'email invalide', 'error');
        fields.email.focus();
        fields.email.select();
        return null;
    }

    if (!fields.message.value.trim()) {
        showToast('❌ Le message est obligatoire', 'error');
        fields.message.focus();
        return null;
    }

    // Préparation des données
    return {
        nom: fields.name.value.trim(),
        email: fields.email.value.trim(),
        sujet: fields.subject?.value.trim() || "Sans sujet",
        motif: fields.reason?.value || "Information",
        message: fields.message.value.trim(),
        csrfmiddlewaretoken: getCSRFToken()
    };
}

async function sendFormData(formData) {
    try {
        console.log('📤 Envoi des données:', formData);

        // Essayer d'abord avec FormData (recommandé pour Django)
        let response;
        const formDataToSend = new FormData();

        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                formDataToSend.append(key, formData[key]);
            }
        });

        try {
            response = await fetch('/envoyer-contact/', {
                method: 'POST',
                body: formDataToSend,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
        } catch (fetchError) {
            console.warn('Erreur avec FormData, tentative avec JSON...');

            // Fallback avec JSON
            const jsonData = { ...formData };
            delete jsonData.csrfmiddlewaretoken;

            response = await fetch('/envoyer-contact/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': formData.csrfmiddlewaretoken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
        }

        console.log('📥 Réponse reçue - Status:', response.status);

        if (response.ok) {
            return await handleSuccessResponse(response, formData.nom);
        } else {
            return await handleErrorResponse(response);
        }

    } catch (error) {
        console.error('🔥 Erreur réseau:', error);
        showToast('🌐 Erreur de connexion au serveur', 'error');
        return false;
    }
}

async function handleSuccessResponse(response, userName) {
    try {
        const result = await response.json();

        if (result.success || result.message) {
            const message = result.message || `Merci ${userName}, votre message a été envoyé avec succès !`;
            showToast(`✅ ${message}`, 'success');
            return true;
        } else {
            showToast('⚠️ Réponse inattendue du serveur', 'warning');
            return true;
        }
    } catch (jsonError) {
        const text = await response.text();
        if (text.includes('success') || response.status === 200) {
            showToast(`✅ Merci ${userName}, votre message a été envoyé !`, 'success');
            return true;
        }
        showToast('✅ Message envoyé', 'success');
        return true;
    }
}

async function handleErrorResponse(response) {
    try {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || `Erreur ${response.status}`;
        showToast(`❌ ${errorMessage}`, 'error');
    } catch {
        const errorText = await response.text();

        if (response.status === 403 && errorText.includes('CSRF')) {
            showToast('🔒 Erreur de sécurité. Veuillez rafraîchir la page.', 'error');
            setTimeout(() => location.reload(), 2000);
        } else {
            showToast(`❌ Erreur serveur (${response.status})`, 'error');
        }
    }
    return false;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// =====================================================================
// CAROUSEL PRINCIPAL
// =====================================================================
function initCarousel() {
    carouselTrack = document.getElementById('carouselTrack');
    carouselPrev = document.getElementById('carouselPrev');
    carouselNext = document.getElementById('carouselNext');
    carouselIndicators = document.getElementById('carouselIndicators');

    if (!carouselTrack || !carouselIndicators) {
        console.warn('Carousel non trouvé');
        return;
    }

    renderCarousel();
    updateCarouselControls();
    setupCarouselEvents();

    // Auto-rotation toutes les 5 secondes
    setInterval(() => {
        if (currentSlideIndex < carouselImages.length - 1) {
            currentSlideIndex++;
        } else {
            currentSlideIndex = 0;
        }
        scrollToSlide(currentSlideIndex);
    }, 5000);
}

function renderCarousel() {
    carouselTrack.innerHTML = '';
    carouselIndicators.innerHTML = '';

    carouselImages.forEach((image, index) => {
        // Créer la diapositive
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.dataset.index = index;

        // Conteneur d'image
        const imgContainer = document.createElement('div');
        imgContainer.className = 'carousel-img-container';

        // Créer l'image
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.title;
        img.loading = 'lazy';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        img.onload = function () {
            this.style.opacity = '1';
        };

        img.onerror = function () {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-image" aria-hidden="true"></i>
                <p>${image.title}</p>
            `;
            imgContainer.appendChild(placeholder);
        };

        imgContainer.appendChild(img);
        slide.appendChild(imgContainer);

        // Ajouter la légende
        const caption = document.createElement('div');
        caption.className = 'carousel-caption';
        caption.innerHTML = `
            <h4>${image.title}</h4>
            <p>${image.description}</p>
        `;
        slide.appendChild(caption);

        carouselTrack.appendChild(slide);

        // Créer l'indicateur
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.dataset.index = index;
        indicator.setAttribute('aria-label', `Aller à la diapositive ${index + 1}`);

        if (index === 0) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
        }

        indicator.addEventListener('click', () => {
            scrollToSlide(index);
        });

        carouselIndicators.appendChild(indicator);
    });
}

function updateCarouselControls() {
    if (!carouselPrev || !carouselNext) return;

    carouselPrev.disabled = currentSlideIndex === 0;
    carouselNext.disabled = currentSlideIndex >= carouselImages.length - 1;

    carouselPrev.style.opacity = carouselPrev.disabled ? '0.5' : '1';
    carouselNext.style.opacity = carouselNext.disabled ? '0.5' : '1';

    document.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
        if (index === currentSlideIndex) {
            indicator.classList.add('active');
            indicator.setAttribute('aria-current', 'true');
        } else {
            indicator.classList.remove('active');
            indicator.removeAttribute('aria-current');
        }
    });
}

function setupCarouselEvents() {
    if (!carouselTrack || !carouselPrev || !carouselNext) return;

    // Bouton précédent
    carouselPrev.addEventListener('click', () => {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            scrollToSlide(currentSlideIndex);
        }
    });

    // Bouton suivant
    carouselNext.addEventListener('click', () => {
        if (currentSlideIndex < carouselImages.length - 1) {
            currentSlideIndex++;
            scrollToSlide(currentSlideIndex);
        }
    });

    // Gestion du défilement tactile pour mobile
    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentSlideIndex < carouselImages.length - 1) {
                currentSlideIndex++;
            } else if (diff < 0 && currentSlideIndex > 0) {
                currentSlideIndex--;
            }
            scrollToSlide(currentSlideIndex);
        }
    });
}

function scrollToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides[index]) {
        currentSlideIndex = index;

        if (isMobile) {
            const slideWidth = slides[index].offsetWidth;
            carouselTrack.scrollTo({
                left: slideWidth * index,
                behavior: 'smooth'
            });
        } else {
            slides[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }

        updateCarouselControls();
    }
}

// =====================================================================
// GESTION DU THÈME
// =====================================================================
function initTheme() {
    themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);

    showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'success');
}

function updateThemeIcon(theme) {
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    themeToggle.setAttribute('aria-label',
        theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
}

// =====================================================================
// GESTION DU MENU MOBILE
// =====================================================================
function initMobileMenu() {
    mobileMenuBtn = document.getElementById('mobileMenuBtn');
    navMenu = document.getElementById('navMenu');
    navLinks = document.querySelectorAll('.nav-link');

    if (!mobileMenuBtn || !navMenu) return;

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // Fermer le menu en cliquant sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 992 && navMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !mobileMenuBtn.contains(e.target)) {
            toggleMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    navMenu.classList.toggle('active');
    mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);

    const icon = mobileMenuBtn.querySelector('i');
    icon.className = navMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';

    // Bloquer/débloquer le défilement
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

// =====================================================================
// GESTION DU SCROLL
// =====================================================================
function initScroll() {
    header = document.getElementById('header');
    backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', handleScroll);

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
    }

    // Smooth scroll pour les ancres
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Fermer le menu mobile si ouvert
                if (window.innerWidth <= 992 && navMenu && navMenu.classList.contains('active')) {
                    toggleMobileMenu();
                }
            }
        });
    });
}

function handleScroll() {
    // Header scroll effect
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Back to top button
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    }

    // Animation des éléments au scroll
    animateOnScroll();
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// =====================================================================
// ANIMATIONS AU SCROLL
// =====================================================================
function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    elements.forEach(el => {
        if (isElementInViewport(el)) {
            el.classList.add('visible');
        }
    });
}

function isElementInViewport(el) {
    if (!el) return false;

    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    return (
        rect.top <= windowHeight * 0.85 &&
        rect.bottom >= 0
    );
}

// =====================================================================
// ANIMATION DES COMPTEURS
// =====================================================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number, .impact-number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(counter) {
    const target = parseInt(counter.getAttribute('data-count') || '0');
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
        } else {
            counter.textContent = Math.floor(current);
        }
    }, 16);
}

// =====================================================================
// GESTION DES MODALES
// =====================================================================
function initModals() {
    donationModal = document.getElementById('donationModal');
    modalClose = document.getElementById('modalClose');
    galleryModal = document.getElementById('galleryModal');
    galleryModalClose = document.getElementById('galleryModalClose');
    galleryModalImg = document.getElementById('galleryModalImg');
    galleryModalCaption = document.getElementById('galleryModalCaption');

    // Modal de donation
    if (modalClose) {
        modalClose.addEventListener('click', closeDonationModal);
    }

    // Modal de galerie
    if (galleryModalClose) {
        galleryModalClose.addEventListener('click', closeGalleryModal);
    }

    // Fermer les modales en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (donationModal && e.target === donationModal) {
            closeDonationModal();
        }
        if (galleryModal && e.target === galleryModal) {
            closeGalleryModal();
        }
    });

    // Fermer les modales avec Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (donationModal && donationModal.classList.contains('active')) {
                closeDonationModal();
            }
            if (galleryModal && galleryModal.classList.contains('active')) {
                closeGalleryModal();
            }
        }
    });
}

function showDonationModal(type) {
    let title = '';
    let content = '';

    if (type === 'bank') {
        title = 'Faire un virement bancaire';
        content = `
            <div class="donation-info">
                <p>Pour effectuer un virement bancaire, veuillez utiliser les coordonnées suivantes :</p>
                <div class="bank-details">
                    <p><strong>Banque :</strong> Rawbank</p>
                    <p><strong>IBAN :</strong> CD08 01002 0500007194 89</p>
                    <p><strong>Code Swift :</strong> RAWBCDKI</p>
                    <p><strong>Titulaire :</strong> ORPHELIN PRIORITE ASBL</p>
                    <p><strong>Adresse :</strong> Q. Katindo, Avenue Masisi, N°26, Goma, RDC</p>
                </div>
                <p>Après avoir effectué votre virement, merci de nous envoyer un email à <strong>donations@orphelinpriorite.org</strong> avec votre nom et le montant du don pour que nous puissions vous envoyer un reçu.</p>
                <p class="donation-note"><strong>Note :</strong> Pour les dons supérieurs à 40€, un reçu fiscal vous sera délivré.</p>
            </div>
        `;
    } else if (type === 'mobile') {
        title = 'Donner via Mobile Money';
        content = `
            <div class="donation-info">
                <p>Pour effectuer un don via Mobile Money, veuillez utiliser l'un des numéros suivants :</p>
                <div class="mobile-money-details">
                    <p><strong>M-Pesa :</strong> +243 81 787 9584</p>
                    <p><strong>Airtel Money :</strong> +243 99 597 4028</p>
                    <p><strong>Orange Money :</strong> +243 97 000 0000</p>
                </div>
                <p><strong>Instructions :</strong></p>
                <ol>
                    <li>Accédez à l'application de votre opérateur mobile</li>
                    <li>Sélectionnez "Envoyer de l'argent"</li>
                    <li>Entrez le numéro correspondant à votre opérateur</li>
                    <li>Indiquez le montant de votre don</li>
                    <li>Dans le message, écrivez "DON ORPHELIN"</li>
                    <li>Validez la transaction</li>
                </ol>
                <p class="donation-note">Après votre don, vous pouvez nous envoyer un screenshot à <strong>+243 817 879 584</strong> sur WhatsApp pour recevoir un reçu.</p>
            </div>
        `;
    }

    if (donationModal) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalContent').innerHTML = content;
        donationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDonationModal() {
    if (donationModal) {
        donationModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openGalleryModal(galleryItem) {
    const img = galleryItem.querySelector('img') || galleryItem.querySelector('.fas');
    const title = galleryItem.querySelector('h4')?.textContent || galleryItem.querySelector('.gallery-title')?.textContent || '';
    const description = galleryItem.querySelector('p')?.textContent || galleryItem.querySelector('.gallery-description')?.textContent || '';

    if (img && galleryModalImg && galleryModalCaption && galleryModal) {
        if (img.tagName === 'IMG') {
            galleryModalImg.src = img.src;
            galleryModalImg.alt = img.alt;
            galleryModalImg.style.display = 'block';
        } else {
            galleryModalImg.style.display = 'none';
        }

        galleryModalCaption.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeGalleryModal() {
    if (galleryModal) {
        galleryModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// =====================================================================
// GESTION DES ONGLETS PROGRAMMES
// =====================================================================
function initProgramTabs() {
    const programTabs = document.querySelectorAll('.program-tab');
    const programContents = document.querySelectorAll('.program-content');

    programTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');

            // Mettre à jour les onglets actifs
            programTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Afficher le contenu correspondant
            programContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// =====================================================================
// GESTION DES IMAGES D'ÉQUIPE
// =====================================================================
function initTeamImages() {
    const teamImages = document.querySelectorAll('.team-img');

    teamImages.forEach((img) => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', function () {
                this.style.opacity = '1';
            });

            img.addEventListener('error', function () {
                this.style.opacity = '1';
                const container = this.closest('.team-img-container');
                if (container) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'team-img-placeholder';
                    placeholder.innerHTML = `
                        <i class="fas fa-user"></i>
                        <span>Photo non disponible</span>
                    `;
                    container.appendChild(placeholder);
                }
            });
        }
    });

    // Optimiser après un court délai
    setTimeout(optimizeTeamImages, 100);
}

function optimizeTeamImages() {
    const teamCards = document.querySelectorAll('.team-card');

    if (!teamCards.length) return;

    teamCards.forEach((card, index) => {
        const imgContainer = card.querySelector('.team-img-container');
        if (!imgContainer) return;

        // S'assurer que le conteneur est visible
        imgContainer.style.opacity = '1';
        imgContainer.style.visibility = 'visible';

        const img = imgContainer.querySelector('img');
        if (img) {
            // Forcer l'affichage de l'image
            img.style.opacity = '1';
            img.style.visibility = 'visible';

            // Styles responsives
            if (isMobile) {
                imgContainer.style.width = '180px';
                imgContainer.style.height = '180px';
                imgContainer.style.margin = '0 auto 20px auto';
                imgContainer.style.borderRadius = '12px';
                imgContainer.style.overflow = 'hidden';

                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '12px';
            } else {
                imgContainer.style.width = '100%';
                imgContainer.style.height = '280px';
                imgContainer.style.borderRadius = '10px';
                imgContainer.style.overflow = 'hidden';
                imgContainer.style.marginBottom = '20px';

                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '10px';
            }
        }

        // Animation d'apparition
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// =====================================================================
// GESTION DU PRELOADER
// =====================================================================
function initPreloader() {
    preloader = document.getElementById('preloader');

    // Masquer le preloader après le chargement complet
    window.addEventListener('load', function () {
        setTimeout(() => {
            if (preloader) {
                preloader.style.transition = 'opacity 0.5s ease';
                preloader.style.opacity = '0';

                setTimeout(() => {
                    if (preloader) {
                        preloader.style.display = 'none';
                    }
                }, 500);
            }
        }, 1000);
    });
}

// =====================================================================
// GESTION DU RESPONSIVE
// =====================================================================
function checkMobileView() {
    isMobile = window.innerWidth <= 768;
}

function handleResize() {
    checkMobileView();

    // Réinitialiser le menu mobile si on passe en desktop
    if (window.innerWidth > 992 && navMenu && navMenu.classList.contains('active')) {
        toggleMobileMenu();
    }

    // Ré-optimiser les images d'équipe
    optimizeTeamImages();
}

// =====================================================================
// FONCTION TOAST AMÉLIORÉE
// =====================================================================
function showToast(message, type = 'success') {
    // Supprimer les anciens toasts
    document.querySelectorAll('.custom-toast').forEach(toast => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    });

    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    // Icône selon le type
    const icon = type === 'success' ? '✓' :
        type === 'error' ? '✗' :
            type === 'warning' ? '⚠' : 'ℹ';

    toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;

    // Styles
    const isMobile = window.innerWidth <= 768;
    toast.style.cssText = `
        position: fixed;
        top: ${isMobile ? '20px' : '30px'};
        right: ${isMobile ? '50%' : '30px'};
        transform: ${isMobile ? 'translateX(50%)' : 'none'};
        background: ${type === 'success' ? '#10b981' :
            type === 'error' ? '#ef4444' :
                type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: ${isMobile ? '12px 20px' : '15px 25px'};
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 500;
        font-size: ${isMobile ? '14px' : '15px'};
        text-align: center;
        max-width: ${isMobile ? '90vw' : '400px'};
        word-wrap: break-word;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
        border: none;
        backdrop-filter: blur(10px);
    `;

    document.body.appendChild(toast);

    // Auto-destruction
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// =====================================================================
// INITIALISATION GLOBALE
// =====================================================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initialisation du site...');

    // Afficher le contenu immédiatement
    document.body.classList.remove('no-js');

    // Initialiser le responsive
    checkMobileView();

    // Initialiser le preloader
    initPreloader();

    // Initialiser le formulaire de contact
    initContactForm();

    // Initialiser le carousel
    initCarousel();

    // Initialiser le thème
    initTheme();

    // Initialiser le menu mobile
    initMobileMenu();

    // Initialiser le scroll
    initScroll();

    // Initialiser les compteurs
    initCounters();

    // Initialiser les modales
    initModals();

    // Initialiser les onglets programmes
    initProgramTabs();

    // Initialiser les images d'équipe
    initTeamImages();

    // Écouter le redimensionnement
    window.addEventListener('resize', handleResize);

    // Vérifier si on est en développement
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        initDebugTools();
    }

    console.log('✅ Site initialisé avec succès');
});

// =====================================================================
// OUTILS DE DÉBOGAGE POUR LE DÉVELOPPEMENT
// =====================================================================
function initDebugTools() {
    const debugPanel = document.createElement('div');
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    debugPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #60a5fa;">Debug Panel</div>
        <button onclick="testForm()" style="background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 11px;">
            Test Form
        </button>
        <button onclick="checkFields()" style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-size: 11px;">
            Check Fields
        </button>
        <button onclick="checkCSRF()" style="background: #f59e0b; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            Check CSRF
        </button>
        <div id="debug-output" style="margin-top: 10px; font-size: 10px; color: #d1d5db;"></div>
    `;

    document.body.appendChild(debugPanel);
}

// Fonctions de débogage globales
window.testForm = function () {
    if (!contactForm) {
        console.error('Formulaire non initialisé');
        return;
    }

    // Remplir avec des données de test
    const testData = {
        name: 'Jean Dupont',
        email: 'test@example.com',
        subject: 'Test automatique',
        reason: 'Information',
        message: 'Ceci est un message de test envoyé par le bouton debug.'
    };

    Object.keys(testData).forEach(key => {
        const field = document.getElementById(key);
        if (field) field.value = testData[key];
    });

    // Déclencher la soumission
    contactForm.dispatchEvent(new Event('submit'));
};

window.checkFields = function () {
    const fields = ['name', 'email', 'subject', 'reason', 'message'];
    const output = document.getElementById('debug-output');

    let html = '<div>Champs du formulaire:</div>';
    fields.forEach(field => {
        const element = document.getElementById(field);
        html += `<div style="margin: 2px 0; padding: 2px; background: ${element ? '#059669' : '#dc2626'}">
            ${field}: ${element ? '✓' : '✗'}
        </div>`;
    });

    if (output) output.innerHTML = html;
};

window.checkCSRF = function () {
    const token = getCSRFToken();
    const output = document.getElementById('debug-output');

    let html = `<div>CSRF Token: ${token ? '✓' : '✗'}</div>`;
    if (token) {
        html += `<div style="word-break: break-all; font-size: 9px; margin-top: 5px;">${token.substring(0, 20)}...</div>`;
    }

    if (output) output.innerHTML = html;
};

// =====================================================================
// EXPOSITION DES FONCTIONS GLOBALES
// =====================================================================
window.showToast = showToast;
window.showDonationModal = showDonationModal;
window.openGalleryModal = openGalleryModal;
window.testForm = window.testForm || function () { };
window.checkFields = window.checkFields || function () { };
window.checkCSRF = window.checkCSRF || function () { };

// Ajouter les styles CSS pour les animations
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Animation slideIn pour les toasts */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Styles pour le carousel */
        .carousel-track {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }
        
        .carousel-slide {
            flex: 0 0 auto;
            width: 100%;
            scroll-snap-align: start;
        }
        
        .carousel-indicator.active {
            background-color: #007bff;
        }
        
        /* Animation pour les éléments au scroll */
        .animate-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-on-scroll.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Styles pour le menu mobile */
        @media (max-width: 992px) {
            .nav-menu {
                position: fixed;
                top: 80px;
                left: 0;
                width: 100%;
                height: calc(100vh - 80px);
                background: var(--light);
                transform: translateX(100%);
                transition: transform 0.3s ease;
                z-index: 1000;
            }
            
            .nav-menu.active {
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Ajouter les styles dynamiques
addDynamicStyles();