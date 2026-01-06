from django.shortcuts import render
from django.http import JsonResponse
from .models import MessageContact, Newsletter
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
import threading
import logging
import traceback

# Configuration du logger
logger = logging.getLogger(__name__)

# 1. Affiche le site (page d'accueil)
def page_accueil(request):
    return render(request, 'index.html')

# Fonction utilitaire pour envoyer l'email en arrière-plan
def send_email_background(sujet, corps, destinataire, reply_to):
    """
    Envoie un email de manière asynchrone pour ne pas bloquer la requête HTTP.
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
        print(f"SUCCÈS: Email envoyé à {destinataire}")
    except Exception as e:
        # En prod, on loggue l'erreur, mais on ne plante pas le thread principal
        print(f"ERREUR ENVOI EMAIL (Background Thread): {str(e)}")

# 2. Reçoit, Stocke les informations et envoie un Email
@csrf_exempt
def enregistrer_message(request):
    if request.method == 'POST':
        try:
            # Vérifier le contenu de la requête
            if not request.body:
                return JsonResponse({
                    "status": "error",
                    "message": "Corps de la requête vide"
                }, status=400)
            
            # On transforme le JSON reçu en dictionnaire Python
            try:
                donnees = json.loads(request.body)
            except json.JSONDecodeError as e:
                return JsonResponse({
                    "status": "error",
                    "message": f"JSON invalide: {str(e)}"
                }, status=400)
            
            print("Données reçues :", donnees) 

            # A. STOCKAGE DANS LA BASE DE DONNÉES
            try:
                nouveau_message = MessageContact.objects.create(
                    nom=donnees.get('nom'),
                    email=donnees.get('email'),
                    sujet=donnees.get('sujet'),
                    motif=donnees.get('motif'),
                    message=donnees.get('message')
                )
                print(f"Message de {nouveau_message.nom} enregistré en base.")
            except Exception as db_error:
                print(f"ERREUR DB: {str(db_error)}")
                return JsonResponse({
                    "status": "error",
                    "message": "Erreur lors de l'enregistrement en base de données. Veuillez réessayer."
                }, status=500)

            # B. ENVOI DU GMAIL (ASYNC pour ne pas bloquer)
            sujet_alerte = f"SITE ASBL : Nouveau message de {donnees.get('nom')}"
            corps_du_mail = f"""
            Bonjour Zenon,
            
            Une nouvelle personne a contacté l'ASBL via le site :
            
            - Nom complet : {donnees.get('nom')}
            - Son Email : {donnees.get('email')}
            - Sujet : {donnees.get('sujet')}
            - Motif : {donnees.get('motif')}
            
            --- MESSAGE : ---
            {donnees.get('message')}
            
            ------------------
            Ce message est également enregistré dans ton tableau de bord Django.
            """
            
            # Lancement du thread pour l'envoi d'email
            # On envoie à l'admin (configuré dans settings) et on met l'utilisateur en Reply-To
            admin_email = 'uzimamzenon@gmail.com' 
            
            email_thread = threading.Thread(
                target=send_email_background,
                args=(sujet_alerte, corps_du_mail, admin_email, donnees.get('email'))
            )
            email_thread.daemon = True # Le thread s'arrêtera si le programme principal s'arrête (utile en dev)
            email_thread.start()

            print("Thread d'envoi d'email démarré.")

            return JsonResponse({
                "status": "success",
                "message": "Félicitations, c'est enregistré ! L'administrateur a été notifié.",
                "email_envoye": True 
            }, status=201)

        except Exception as e:
            # Catch-all pour éviter le 500 générique de Django (HTML)
            print("ERREUR GLOBALE NON GEREE:", str(e))
            print(traceback.format_exc())
            return JsonResponse({
                "status": "error",
                "message": f"Une erreur inattendue est survenue : {str(e)}"
            }, status=500)
            
    return JsonResponse({"message": "Erreur : Seule la méthode POST est autorisée"}, status=405)


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
            
            # Vérifier si l'email existe déjà
            if Newsletter.objects.filter(email=email).exists():
                return JsonResponse({
                    "status": "warning",
                    "message": "Cette adresse est déjà inscrite à notre newsletter."
                }, status=200)
            
            # Créer l'inscription
            Newsletter.objects.create(email=email)
            print(f"Newsletter : Nouvelle inscription - {email}")
            
            return JsonResponse({
                "status": "success",
                "message": "Merci ! Vous êtes maintenant inscrit à notre newsletter."
            }, status=201)
            
        except Exception as e:
            print(f"ERREUR Newsletter : {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": f"Erreur lors de l'inscription : {str(e)}"
            }, status=400)
    
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)