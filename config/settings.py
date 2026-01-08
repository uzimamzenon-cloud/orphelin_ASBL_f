import os
from pathlib import Path
from dotenv import load_dotenv  # Nouveau

# Charge les variables d'environnement
load_dotenv()

# --- CHEMINS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SÉCURITÉ ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-cle-de-test-a-changer-en-production')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'  # False par défaut

# ⚠️ CORRECTION CRITIQUE : ALLOWED_HOSTS correctement configuré
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'orphelin-asbl.onrender.com',
    '.onrender.com',  # Accepte tous les sous-domaines Render
]

# --- APPLICATIONS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Ton application
    'messagerie.apps.MessagerieConfig',
    
    # Extensions
    'corsheaders',
]

# --- MIDDLEWARE (L'ordre est très strict !) ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # AVANT CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',  # Juste après WhiteNoise
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- BASE DE DONNÉES (Configuration Intelligente) ---
# Utilise PostgreSQL sur Render, SQLite en local
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Configuration automatique pour Render
if os.environ.get('RENDER'):
    print("--- 🚀 RENDER ENVIRONMENT DETECTED ---")
    
    # Ajoute le hostname Render
    if 'RENDER_EXTERNAL_HOSTNAME' in os.environ:
        ALLOWED_HOSTS.append(os.environ['RENDER_EXTERNAL_HOSTNAME'])
    
    # Configure PostgreSQL depuis DATABASE_URL
    import dj_database_url
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    if DATABASE_URL:
        DATABASES['default'] = dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True
        )
        print(f"--- ✅ DATABASE CONFIGURED FROM DATABASE_URL ---")
    else:
        print("!!! ⚠️ WARNING: NO DATABASE_URL FOUND. USING SQLITE !!!")

# --- VALIDATION DES MOTS DE PASSE ---
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
]

# --- LANGUE ET TEMPS ---
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- FICHIERS STATIQUES (CSS, JS, IMAGES) ---
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Configuration WhiteNoise pour Django 4.2+
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- CONFIGURATION CORS (CORRIGÉE) ---
CORS_ALLOW_CREDENTIALS = True

# ⚠️ CORRECTION : TOUTES les URLs doivent avoir un schéma (http:// ou https://)
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'https://orphelin-asbl.onrender.com',  # AVEC https://
    'https://*.onrender.com',  # Tous les sites Render
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Confiance pour CSRF (CORRIGÉ)
CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'https://orphelin-asbl.onrender.com',  # AVEC https://
    'https://*.onrender.com',
]

# --- SÉCURITÉ COOKIES (pour HTTPS sur Render) ---
if os.environ.get('RENDER'):
    # Sécurité renforcée sur Render
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
else:
    # En développement local
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False
    SECURE_SSL_REDIRECT = False

# --- CONFIGURATION EMAIL (CORRIGÉE avec variables d'environnement) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# ⚠️ CORRECTION CRITIQUE : Utilise DES VARIABLES D'ENVIRONNEMENT
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'uzimamzenon@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')  # À configurer dans Render

DEFAULT_FROM_EMAIL = f"Orphelin Priorité ASBL <{EMAIL_HOST_USER}>"
EMAIL_TIMEOUT = 10

# --- LOGGING PROFESSIONNEL ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'django_errors.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'messagerie': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CONFIGURATION SUPPLÉMENTAIRE POUR RENDER ---
# Désactive le collectstatic automatique de Render (on le fait dans build.sh)
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)