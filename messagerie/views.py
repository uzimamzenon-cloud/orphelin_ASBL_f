from django.shortcuts import render
from django.http import JsonResponse
from .models import MessageContact, Newsletter
from django.core.mail import EmailMessage, send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
import threading
import logging
import traceback

# Configuration du logger professionnel
logger = logging.getLogger('django')

# 1. Affiche le site (page d'accueil)
def page_accueil(request):
    return render(request, 'index.html')

# Fonction utilitaire pour envoyer l'email en arrière-plan
def send_email_background(sujet, corps, destinataire, reply_to):
    """
    Envoie un email de manière asynchrone pour ne pas bloquer la requête HTTP.
    Les erreurs sont logguées silencieusement pour ne pas perturber le thread principal.
    """
    try:
        email = EmailMessage(
            subject=sujet,
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[destinataire],
            reply_to=[reply_to],
        )
        email.send(fail_silently=False)
        logger.info(f"EMAIL SUCCÈS: Notification envoyée à {destinataire}")
    except Exception as e:
        logger.error(f"EMAIL ERREUR (Background): Impossible d'envoyer l'email : {str(e)}")

# 2. Reçoit, Stocke les informations et envoie un Email
@csrf_exempt
def enregistrer_message(request):
    if request.method == 'POST':
        try:
            # Parsing JSON avec sécurité
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"status": "error", "message": "Données invalides"}, status=400)
            
            # 1. Vérification stricte des données (Nettoyage)
            nom = data.get('nom', '').strip()
            email = data.get('email', '').strip()
            sujet_form = data.get('sujet', 'Pas de sujet').strip()
            motif = data.get('motif', 'Information').strip()
            message_texte = data.get('message', '').strip()

            if not nom or not email or not message_texte:
                return JsonResponse({"status": "error", "message": "Champs obligatoires manquants"}, status=400)

            logger.info(f"NOUVEAU MESSAGE: De {nom} ({email})")

            # 2. Sauvegarde immédiate en base de données (Prioritaire)
            try:
                nouveau_msg = MessageContact.objects.create(
                    nom=nom, email=email, sujet=sujet_form, motif=motif, message=message_texte
                )
                logger.info(f"DB SUCCÈS: Message {nouveau_msg.id} sauvegardé.")
            except Exception as db_err:
                logger.critical(f"DB ERREUR: {str(db_err)}")
                return JsonResponse({"status": "error", "message": "Erreur serveur (Base de données)"}, status=500)

            # 3. Envoi de l'e-mail (Threadé pour la vitesse "Ultra-Rapide")
            sujet_mail = f"Nouveau contact ASBL : {motif} - {nom}"
            corps_mail = f"""
            Vous avez reçu un nouveau message de votre site web :
            
            Nom : {nom}
            Email : {email}
            Sujet : {sujet_form}
            Motif : {motif}
            
            Message :
            {message_texte}
            ------------------------------------------------
            Ce message est sécurisé dans votre base de données.
            """
            
            def envoyer_mail_thread():
                try:
                    send_mail(
                        sujet_mail,
                        corps_mail,
                        settings.EMAIL_HOST_USER, # Expéditeur
                        ['uzimamzenon@gmail.com'], # Destinataire
                        fail_silently=False,
                    )
                    logger.info("EMAIL SUCCÈS: Envoyé via Thread.")
                except Exception as mail_err:
                    logger.error(f"EMAIL ERREUR (Background): {str(mail_err)}")

            # Lancement du thread (Non-bloquant)
            email_thread = threading.Thread(target=envoyer_mail_thread)
            email_thread.daemon = True
            email_thread.start()

            # Réponse immédiate
            return JsonResponse({
                "status": "success",
                "message": f"Merci {nom}, votre message a été enregistré et l'équipe a été prévenue !"
            }, status=201)

        except Exception as e:
            logger.error(f"ERREUR GLOBALE: {str(e)}")
            return JsonResponse({"status": "error", "message": "Erreur inattendue"}, status=500)
            
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)


# 3. Inscription à la newsletter
@csrf_exempt
def enregistrer_newsletter(request):
    if request.method == 'POST':
        try:
            try:
                donnees = json.loads(request.body)
            except json.JSONDecodeError:
                 return JsonResponse({"status": "error", "message": "JSON invalide"}, status=400)

            email = donnees.get('email', '').strip()
            
            if not email:
                return JsonResponse({
                    "status": "error",
                    "message": "L'adresse email est requise."
                }, status=400)
            
            if Newsletter.objects.filter(email=email).exists():
                return JsonResponse({
                    "status": "warning",
                    "message": "Vous êtes déjà inscrit à notre newsletter."
                }, status=200)
            
            Newsletter.objects.create(email=email)
            logger.info(f"NEWSLETTER: Nouvelle inscription {email}")
            
            return JsonResponse({
                "status": "success",
                "message": "Inscription réussie ! Merci."
            }, status=201)
            
        except Exception as e:
            logger.error(f"ERREUR NEWSLETTER: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Erreur lors de l'inscription."
            }, status=400)
    
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)
