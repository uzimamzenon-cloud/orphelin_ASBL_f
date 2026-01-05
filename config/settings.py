import os
from pathlib import Path

# Construit les chemins à l'intérieur du projet (utile pour la base de données)
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SÉCURITÉ ---
SECRET_KEY = 'django-insecure-cle-de-test-a-changer-en-production'
DEBUG = True  # Laisse sur True pendant que tu apprends
ALLOWED_HOSTS = ['*'] # Permet l'accès depuis n'importe quelle adresse en local

# --- APPLICATIONS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Ton application est ici :
    'messagerie.apps.MessagerieConfig',
    
    # Pour autoriser ton frontend (on installera le plugin juste après)
    'corsheaders',
]


# --- MIDDLEWARE (L'ordre est important !) ---
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Doit être tout en haut
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.csrf',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- BASE DE DONNÉES ---
# Par défaut, Django utilise SQLite (un fichier local, très simple pour débuter)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# --- VALIDATION DES MOTS DE PASSE ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# --- LANGUE ET TEMPS ---
LANGUAGE_CODE = 'fr-fr' # Mis en français
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- FICHIERS STATIQUES (CSS, JS) ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CONFIGURATION CORS ---
# Comme tu as un frontend, ceci autorise ton code frontend à parler au backend
CORS_ALLOW_ALL_ORIGINS = True 
# Pour le développement local seulement

# --- CONFIGURATION EMAIL (GMAIL) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'uzimamzenon@gmail.com' # Ton Gmail
#EMAIL_HOST_USER = 'uzimamzenon@gmail.com'
#EMAIL_HOST_PASSWORD = '' # SANS les espaces

# ICI : Colle les 16 lettres (SANS les espaces)
EMAIL_HOST_PASSWORD = 'dktj wksi qcpk lewn ' 

# L'email qui envoie (le même que celui du dessus)
DEFAULT_FROM_EMAIL = 'uzimamzenon@gmail.com'