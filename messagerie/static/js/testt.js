<!-- JavaScript -->
    <script>
        // =====================================================================
        // VARIABLES GLOBALES
        // =====================================================================
        const preloader = document.getElementById('preloader');
        const header = document.getElementById('header');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');
        const dropdowns = document.querySelectorAll('.nav-dropdown');
        const backToTopBtn = document.getElementById('backToTop');
        const donationModal = document.getElementById('donationModal');
        const modalClose = document.getElementById('modalClose');
        const galleryModal = document.getElementById('galleryModal');
        const galleryModalClose = document.getElementById('galleryModalClose');
        const galleryModalImg = document.getElementById('galleryModalImg');
        const galleryModalCaption = document.getElementById('galleryModalCaption');
        const contactForm = document.getElementById('contactForm');
        const themeToggle = document.getElementById('themeToggle');

        // =====================================================================
        // CAROUSEL SCROLLABLE - VARIABLES ET FONCTIONS
        // =====================================================================
        const carouselTrack = document.getElementById('carouselTrack');
        const carouselPrev = document.getElementById('carouselPrev');
        const carouselNext = document.getElementById('carouselNext');
        const carouselIndicators = document.getElementById('carouselIndicators');

        // Données du carousel
        const carouselImages = [
            {
                url: 'IMG-20251212-WA0000.jpg',
                title: 'Notre équipe en action',
                description: 'Réunion de travail avec notre équipe sur le terrain'
            },
            {
                url: 'IMG-20251212-WA0005.jpg',
                title: 'Distribution scolaire',
                description: 'Remise de kits scolaires aux enfants'
            },
            {
                url: 'Screenshot_20251211-124109.png',
                title: 'Activités éducatives',
                description: 'Ateliers éducatifs avec les enfants'
            },
            {
                url: 'IMG-20251212-WA0002.jpg',
                title: 'Visites communautaires',
                description: 'Rencontres avec les familles dans les communautés'
            },
            {
                url: 'Screenshot_20251211-124304.png',
                title: 'Formations',
                description: 'Formation des bénévoles et membres de l\'équipe'
            },
            {
                url: 'IMG-20251212-WA0003.jpg',
                title: 'Nos réalisations',
                description: 'Bilan des projets réalisés cette année'
            }
        ];

        let currentSlideIndex = 0;

        // =====================================================================
        // THÈME SOMBRE/CLAIR
        // =====================================================================

        // Initialiser le thème
        function initTheme() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            // Utiliser le thème sauvegardé, sinon détecter les préférences système
            let theme = savedTheme;
            if (!theme) {
                theme = prefersDark ? 'dark' : 'light';
            }

            // Appliquer le thème
            document.documentElement.setAttribute('data-theme', theme);

            // Mettre à jour l'icône
            updateThemeIcon(theme);
        }

        // Basculer le thème
        function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            // Appliquer le nouveau thème
            html.setAttribute('data-theme', newTheme);

            // Sauvegarder la préférence
            localStorage.setItem('theme', newTheme);

            // Mettre à jour l'icône
            updateThemeIcon(newTheme);
        }

        // Mettre à jour l'icône du thème
        function updateThemeIcon(theme) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.setAttribute('aria-label',
                theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre');
            themeToggle.setAttribute('title',
                theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre');
        }

        // Écouter les changements de préférences système
        function watchThemeChanges() {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Seulement si l'utilisateur n'a pas déjà choisi un thème
                if (!localStorage.getItem('theme')) {
                    const theme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', theme);
                    updateThemeIcon(theme);
                }
            });
        }

        // =====================================================================
        // FONCTIONS DU CAROUSEL SCROLLABLE
        // =====================================================================

        // Initialiser le carousel
        function initCarousel() {
            renderCarousel();
            updateCarouselControls();
            setupCarouselEvents();
        }

        // Rendre le carousel avec les images
        function renderCarousel() {
            // Vider le carousel
            carouselTrack.innerHTML = '';
            carouselIndicators.innerHTML = '';

            // Ajouter chaque image au carousel
            carouselImages.forEach((image, index) => {
                // Créer la diapositive
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                slide.dataset.index = index;
                slide.setAttribute('role', 'group');
                slide.setAttribute('aria-roledescription', 'slide');
                slide.setAttribute('aria-label', `${index + 1} sur ${carouselImages.length}`);

                // Vérifier si l'image existe
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = image.title;
                img.loading = 'lazy';
                img.onerror = function() {
                    // Si l'image ne charge pas, afficher un placeholder
                    this.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'image-placeholder';
                    placeholder.innerHTML = `
                        <i class="fas fa-image" aria-hidden="true"></i>
                        <p>${image.title}</p>
                    `;
                    slide.appendChild(placeholder);
                };

                // Ajouter l'image à la diapositive
                slide.appendChild(img);

                // Ajouter la légende
                const caption = document.createElement('div');
                caption.className = 'carousel-caption';
                caption.innerHTML = `
                    <h4>${image.title}</h4>
                    <p>${image.description}</p>
                `;
                slide.appendChild(caption);

                // Ajouter la diapositive au track
                carouselTrack.appendChild(slide);

                // Créer l'indicateur
                const indicator = document.createElement('button');
                indicator.className = 'carousel-indicator';
                indicator.dataset.index = index;
                indicator.setAttribute('aria-label', `Aller à la diapositive ${index + 1}`);
                indicator.setAttribute('aria-controls', 'carouselTrack');
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

        // Mettre à jour les contrôles du carousel
        function updateCarouselControls() {
            // Désactiver le bouton précédent si on est au début
            carouselPrev.disabled = currentSlideIndex === 0;

            // Désactiver le bouton suivant si on est à la fin
            carouselNext.disabled = currentSlideIndex >= carouselImages.length - 1;

            // Mettre à jour les indicateurs
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

        // Configurer les événements du carousel
        function setupCarouselEvents() {
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

            // Gestion du défilement horizontal
            carouselTrack.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    // Défilement vertical - permettre le défilement normal
                    return;
                }

                // Défilement horizontal - empêcher le comportement par défaut
                e.preventDefault();

                // Déplacer le carousel
                carouselTrack.scrollLeft += e.deltaY;

                // Mettre à jour l'index de la diapositive active
                updateActiveSlideIndex();
            });

            // Gestion du défilement avec la souris
            let isDown = false;
            let startX;
            let scrollLeft;

            carouselTrack.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - carouselTrack.offsetLeft;
                scrollLeft = carouselTrack.scrollLeft;
                carouselTrack.style.cursor = 'grabbing';
            });

            carouselTrack.addEventListener('mouseleave', () => {
                isDown = false;
                carouselTrack.style.cursor = 'grab';
            });

            carouselTrack.addEventListener('mouseup', () => {
                isDown = false;
                carouselTrack.style.cursor = 'grab';
                updateActiveSlideIndex();
            });

            carouselTrack.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - carouselTrack.offsetLeft;
                const walk = (x - startX) * 2; // Vitesse de défilement
                carouselTrack.scrollLeft = scrollLeft - walk;
            });

            // Mettre à jour l'index de la diapositive active lors du défilement
            carouselTrack.addEventListener('scroll', () => {
                updateActiveSlideIndex();
            });
        }

        // Faire défiler jusqu'à une diapositive spécifique
        function scrollToSlide(index) {
            const slides = document.querySelectorAll('.carousel-slide');
            if (slides[index]) {
                slides[index].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
                currentSlideIndex = index;
                updateCarouselControls();
            }
        }

        // Mettre à jour l'index de la diapositive active
        function updateActiveSlideIndex() {
            const slides = document.querySelectorAll('.carousel-slide');
            const trackRect = carouselTrack.getBoundingClientRect();

            let closestSlide = null;
            let closestDistance = Infinity;

            slides.forEach((slide, index) => {
                const slideRect = slide.getBoundingClientRect();
                const slideCenter = slideRect.left + slideRect.width / 2;
                const trackCenter = trackRect.left + trackRect.width / 2;
                const distance = Math.abs(slideCenter - trackCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSlide = index;
                }
            });

            if (closestSlide !== null && closestSlide !== currentSlideIndex) {
                currentSlideIndex = closestSlide;
                updateCarouselControls();
            }
        }

        // =====================================================================
        // FONCTIONS RESPONSIVE
        // =====================================================================

        // Détecter le type d'appareil
        function getDeviceType() {
            const width = window.innerWidth;
            if (width < 576) return 'mobile';
            if (width < 768) return 'mobile-landscape';
            if (width < 992) return 'tablet';
            if (width < 1200) return 'tablet-landscape';
            if (width < 1400) return 'laptop';
            return 'desktop';
        }

        // =====================================================================
        // PRELOADER
        // =====================================================================
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');

                // Initialiser les animations
                setTimeout(() => {
                    const elements = document.querySelectorAll('.animate-on-scroll');
                    elements.forEach(el => {
                        if (isElementInViewport(el)) {
                            el.classList.add('visible');
                        }
                    });
                }, 300);

                // Initialiser les compteurs
                animateCounters();

                // Initialiser le carousel
                initCarousel();
            }, 1000);
        });

        // =====================================================================
        // HEADER SCROLL EFFECT
        // =====================================================================
        window.addEventListener('scroll', () => {
            // Header scroll effect
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Back to top button
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }

            // Active navigation link based on scroll position
            setActiveNavLink();

            // Animate elements on scroll
            const animatedElements = document.querySelectorAll('.animate-on-scroll');
            animatedElements.forEach(el => {
                if (isElementInViewport(el)) {
                    el.classList.add('visible');
                }
            });

            // Animate counters
            animateCounters();
        });

        // =====================================================================
        // MOBILE MENU RESPONSIVE
        // =====================================================================
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            navMenu.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            const icon = mobileMenuBtn.querySelector('i');
            icon.className = navMenu.classList.contains('active')
                ? 'fas fa-times'
                : 'fas fa-bars';

            // Bloquer/débloquer le défilement du body
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';

                // Update active link
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const isMobile = window.innerWidth <= 992;
            if (isMobile && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // =====================================================================
        // SMOOTH SCROLLING RESPONSIVE
        // =====================================================================
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight;

                    // Fermer le menu mobile si ouvert
                    if (window.innerWidth <= 992 && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                        mobileMenuBtn.setAttribute('aria-expanded', 'false');
                        document.body.style.overflow = '';
                    }

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // =====================================================================
        // BACK TO TOP
        // =====================================================================
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // =====================================================================
        // ACTIVE NAV LINK
        // =====================================================================
        function setActiveNavLink() {
            const sections = document.querySelectorAll('section[id]');
            const scrollPosition = window.scrollY + 150;

            let currentSectionId = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSectionId = sectionId;
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href').substring(1);
                if (href === currentSectionId) {
                    link.classList.add('active');
                }
            });
        }

        // =====================================================================
        // ANIMATE ELEMENTS ON SCROLL
        // =====================================================================
        function isElementInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.9
            );
        }

        // =====================================================================
        // ANIMATE COUNTERS
        // =====================================================================
        function animateCounters() {
            const counters = document.querySelectorAll('.stat-number, .impact-number');
            counters.forEach(counter => {
                if (isElementInViewport(counter) && !counter.classList.contains('animated')) {
                    counter.classList.add('animated');
                    const target = parseInt(counter.getAttribute('data-count')) || 0;
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // 60fps

                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.textContent = target.toLocaleString();
                            clearInterval(timer);
                        } else {
                            counter.textContent = Math.floor(current).toLocaleString();
                        }
                    }, 16);
                }
            });
        }

        // =====================================================================
        // PROGRAM TABS
        // =====================================================================
        const programTabs = document.querySelectorAll('.program-tab');
        programTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                programTabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');

                // Get tab ID
                const tabId = tab.getAttribute('data-tab');

                // Filter program cards (in a real implementation, this would filter content)
                // For now, we'll just show an alert
                console.log(`Selected program tab: ${tabId}`);
            });
        });

        // =====================================================================
        // CONTACT FORM RESPONSIVE
        // =====================================================================
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => { // On a ajouté "async" ici
                e.preventDefault();

                // 1. Récupération des valeurs du formulaire
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const subject = document.getElementById('subject').value;
                const reason = document.getElementById('reason').value;
                const message = document.getElementById('message').value;

                // 2. Ta validation (on la garde, elle est parfaite)
                if (!name || !email || !reason || !message) {
                    showToast('Veuillez remplir tous les champs obligatoires.', 'error');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showToast('Veuillez entrer une adresse email valide.', 'error');
                    return;
                }

                // 3. État visuel du bouton
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
                submitBtn.disabled = true;

                // 4. CONNEXION RÉELLE À DJANGO
                try {
                    const response = await fetch('http://127.0.0.1:8000/envoyer-contact/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nom: name,     // Doit correspondre au modèle Django
                            email: email,
                            sujet: subject,
                            motif: reason, // Ton ID HTML "reason" devient "motif" pour Django
                            message: message
                        })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // --- SUCCÈS ---
                        showToast(`Merci ${name}, votre message a bien été enregistré !`, 'success');
                        contactForm.reset();
                    } else {
                        // --- ERREUR DU SERVEUR ---
                        showToast(`Erreur : ${result.message}`, 'error');
                    }
                } catch (error) {
                    // --- ERREUR DE RÉSEAU (Si Django n'est pas allumé) ---
                    console.error("Erreur connexion :", error);
                    showToast('Le serveur Django est éteint. Allumez-le dans le terminal.', 'error');
                } finally {
                    // On remet le bouton à son état normal
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }

        // =====================================================================
        // DONATION MODAL RESPONSIVE
        // =====================================================================
        function showDonationModal(type) {
            let title = '';
            let content = '';

            if (type === 'bank') {
                title = 'Faire un virement bancaire';
                content = `
                    <p>Pour effectuer un virement bancaire, veuillez utiliser les coordonnées suivantes :</p>
                    <div style="background-color: var(--light); padding: 20px; border-radius: var(--border-radius); margin: 20px 0;">
                        <p><strong>Banque :</strong> À préciser</p>
                        <p><strong>IBAN :</strong> À préciser</p>
                        <p><strong>Code Swift :</strong> À préciser</p>
                        <p><strong>Titulaire :</strong> Orphelin Priorité ASBL</p>
                        <p><strong>Adresse :</strong> Q. Katindo, Avenue Masisi, N°26, Goma, RDC</p>
                    </div>
                    <p>Après avoir effectué votre virement, merci de nous envoyer un email à <strong>donations@orphelinpriorite.org</strong> avec votre nom et le montant du don pour que nous puissions vous envoyer un reçu.</p>
                    <p style="margin-top: 20px;"><strong>Note :</strong> Pour les dons supérieurs à 40€, un reçu fiscal vous sera délivré.</p>
                `;
            } else if (type === 'mobile') {
                title = 'Donner via Mobile Money';
                content = `
                    <p>Pour effectuer un don via Mobile Money, veuillez utiliser l'un des numéros suivants :</p>
                    <div style="background-color: var(--light); padding: 20px; border-radius: var(--border-radius); margin: 20px 0;">
                        <p><strong>M-Pesa :</strong> 081 787 9584</p>
                        <p><strong>Airtel Money :</strong> 099 597 4028</p>
                        <p><strong>Orange Money :</strong> À préciser</p>
                    </div>
                    <p><strong>Instructions :</strong></p>
                    <ol style="margin-left: 20px;">
                        <li>Accédez à l'application de votre opérateur mobile</li>
                        <li>Sélectionnez "Envoyer de l'argent"</li>
                        <li>Entrez le numéro correspondant à votre opérateur</li>
                        <li>Indiquez le montant de votre don</li>
                        <li>Dans le message, écrivez "DON ORPHELIN"</li>
                        <li>Validez la transaction</li>
                    </ol>
                    <p style="margin-top: 20px;">Après votre don, vous pouvez nous envoyer un screenshot à <strong>+243 817 879 584</strong> sur WhatsApp pour recevoir un reçu.</p>
                `;
            }

            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalContent').innerHTML = content;
            donationModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Focus management for accessibility
            setTimeout(() => {
                modalClose.focus();
            }, 100);
        }

        modalClose.addEventListener('click', () => {
            donationModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === donationModal) {
                donationModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && donationModal.classList.contains('active')) {
                donationModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // =====================================================================
        // GALLERY MODAL RESPONSIVE
        // =====================================================================
        function openGalleryModal(galleryItem) {
            const img = galleryItem.querySelector('img') || galleryItem.querySelector('.fas');
            const title = galleryItem.querySelector('h4')?.textContent || '';
            const description = galleryItem.querySelector('p')?.textContent || '';

            if (img) {
                if (img.tagName === 'IMG') {
                    galleryModalImg.src = img.src;
                    galleryModalImg.alt = img.alt;
                } else {
                    // Handle font awesome icons
                    galleryModalImg.src = '';
                    galleryModalImg.alt = title;
                }

                galleryModalCaption.textContent = `${title} - ${description}`;
                galleryModal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Focus management for accessibility
                setTimeout(() => {
                    galleryModalClose.focus();
                }, 100);
            }
        }

        galleryModalClose.addEventListener('click', () => {
            galleryModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Close gallery modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === galleryModal) {
                galleryModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close gallery modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && galleryModal.classList.contains('active')) {
                galleryModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // =====================================================================
        // NEWSLETTER FORM RESPONSIVE
        // =====================================================================
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            const newsletterBtn = newsletterForm.querySelector('.newsletter-btn');
            const newsletterInput = newsletterForm.querySelector('.newsletter-input');

            newsletterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const email = newsletterInput.value;

                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (email && emailRegex.test(email)) {
                    // Show loading state
                    const originalText = newsletterBtn.innerHTML;
                    newsletterBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    newsletterBtn.disabled = true;

                    setTimeout(() => {
                        showToast(`Merci de vous être inscrit à notre newsletter avec l'adresse: ${email}`);
                        newsletterInput.value = '';

                        // Reset button
                        newsletterBtn.innerHTML = originalText;
                        newsletterBtn.disabled = false;
                    }, 1000);
                } else {
                    showToast('Veuillez entrer une adresse email valide.', 'error');
                }
            });

            // Allow submission with Enter key
            newsletterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    newsletterBtn.click();
                }
            });
        }

        // =====================================================================
        // TOAST NOTIFICATIONS
        // =====================================================================
        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${type === 'success' ? 'var(--success)' :
                           type === 'warning' ? 'var(--warning)' :
                           type === 'error' ? 'var(--accent)' : 'var(--primary)'};
                color: white;
                padding: 12px 20px;
                border-radius: var(--border-radius);
                z-index: 10000;
                box-shadow: var(--shadow);
                animation: fadeIn 0.3s ease-out;
            `;
            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s';
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }

        // =====================================================================
        // FINAL INITIALIZATION
        // =====================================================================
        // Initialize theme
        initTheme();
        watchThemeChanges();

        // Add event listener for theme toggle
        themeToggle.addEventListener('click', toggleTheme);

        // Support pour les navigateurs sans JavaScript
        document.body.classList.remove('no-js');

        // Initialisation pour les images d'équipe
        document.addEventListener('DOMContentLoaded', () => {
            const teamImages = document.querySelectorAll('.team-img.loading');
            teamImages.forEach(img => {
                img.addEventListener('load', () => {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                });

                // Si l'image a déjà été chargée
                if (img.complete) {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                }
            });
        });

        // Gestion du défilement fluide pour les anciens navigateurs
        if (!('scrollBehavior' in document.documentElement.style)) {
            const smoothScroll = () => {
                const links = document.querySelectorAll('a[href^="#"]');
                links.forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const targetId = this.getAttribute('href');
                        if (targetId === '#') return;

                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            const headerHeight = header.offsetHeight;
                            const targetPosition = targetElement.offsetTop - headerHeight;

                            window.scrollTo({
                                top: targetPosition,
                                behavior: 'auto'
                            });
                        }
                    });
                });
            }
            smoothScroll();
        }
    </script>

