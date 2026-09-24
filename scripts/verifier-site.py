#!/usr/bin/env python3
"""Vérifications automatiques de solution-phone.fr avant publication.

Usage : python3 scripts/verifier-site.py
Contrôle les pages publiées (celles qui ne sont pas exclues par _config.yml) :
  1. JSON-LD valide (json.loads) ;
  2. liens href/src locaux qui pointent vers un fichier existant ;
  3. aucun visuel interdit (microscope, outils, plan de travail) ;
  4. pages du sitemap : existent, avec <title>, meta description et canonical ;
  5. numéros de version ?v= identiques pour un même fichier sur toutes les pages ;
  6. faits clés : formulations interdites absentes, informations obligatoires présentes.
Code de sortie 1 s'il y a au moins une erreur.
"""
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse
from collections import defaultdict

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RACINE)

erreurs = []
avertissements = []


def erreur(message):
    erreurs.append(message)


def lire(chemin):
    with open(chemin, encoding="utf-8") as fichier:
        return fichier.read()


def exclusions():
    texte = lire("_config.yml")
    return {ligne.strip()[2:].strip() for ligne in texte.splitlines() if ligne.strip().startswith("- ")}


EXCLUS = exclusions()


def est_exclu(chemin):
    return any(chemin == e or chemin.startswith(e.rstrip("/") + "/") for e in EXCLUS)


fichiers = subprocess.check_output(["git", "ls-files"], text=True).split()
pages = [f for f in fichiers if f.endswith(".html") and not est_exclu(f)]
redirections = [p for p in pages if 'http-equiv="refresh"' in lire(p)]

# 1. JSON-LD
for page in pages:
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', lire(page), re.S):
        try:
            donnees = json.loads(bloc)
        except ValueError as exc:
            erreur(f"{page} : JSON-LD invalide ({exc})")
            continue
        if "aggregateRating" in json.dumps(donnees):
            erreur(f"{page} : aggregateRating auto-déclaré interdit")

# 2. Liens locaux
IGNORER = ("http://", "https://", "mailto:", "tel:", "#", "javascript:", "data:", "sms:", "//")
for page in pages:
    texte = lire(page)
    texte = re.sub(r"<script\b(?![^>]*\bsrc=).*?</script>", "", texte, flags=re.S)
    for cible in re.findall(r'(?:href|src)="([^"]+)"', texte):
        if cible.startswith(IGNORER) or "${" in cible or "{{" in cible:
            continue
        chemin = urllib.parse.unquote(cible.split("#")[0].split("?")[0])
        if not chemin:
            continue
        if chemin.startswith("/"):
            complet = chemin.lstrip("/") or "index.html"
        else:
            complet = os.path.normpath(os.path.join(os.path.dirname(page), chemin))
        if complet.endswith("/") or os.path.isdir(complet):
            complet = os.path.join(complet, "index.html")
        if not os.path.exists(complet):
            erreur(f"{page} : lien local cassé -> {cible}")
        elif est_exclu(os.path.normpath(complet)):
            erreur(f"{page} : lien vers un fichier non publié -> {cible}")

# 3. Visuels interdits
MOTIF_INTERDIT = re.compile(r"microscope[^)]*\.(jpg|jpeg|png|webp)|microscope-reparation|atelier-solution-phone-outils|plan[-_ ]?de[-_ ]?travail|workbench", re.I)
for f in fichiers:
    if f.endswith((".html", ".css", ".js")) and not est_exclu(f) and not f.startswith(("scripts/", "supabase/")):
        if MOTIF_INTERDIT.search(lire(f)):
            erreur(f"{f} : visuel interdit (microscope, outils, plan de travail)")

# 4. Sitemap
for url in re.findall(r"<loc>([^<]+)</loc>", lire("sitemap.xml")):
    chemin = urllib.parse.urlparse(url).path.lstrip("/") or "index.html"
    if chemin.endswith("/"):
        chemin += "index.html"
    if not os.path.exists(chemin):
        erreur(f"sitemap : page absente -> {url}")
        continue
    texte = lire(chemin)
    titre = re.search(r"<title>(.*?)</title>", texte, re.S)
    description = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', texte)
    if not titre:
        erreur(f"{chemin} : <title> manquant")
    elif len(html.unescape(titre.group(1).strip())) > 60:
        avertissements.append(f"{chemin} : titre de {len(html.unescape(titre.group(1).strip()))} caractères (> 60)")
    if not description:
        erreur(f"{chemin} : meta description manquante")
    elif not 70 <= len(description.group(1)) <= 160:
        avertissements.append(f"{chemin} : meta description de {len(description.group(1))} caractères (70-160 conseillés)")
    if 'rel="canonical"' not in texte and "rel='canonical'" not in texte and not re.search(r'rel=\s*"canonical"', texte):
        erreur(f"{chemin} : canonical manquant")

# 5. Versions ?v= homogènes
versions = defaultdict(set)
for page in pages:
    for nom, version in re.findall(r'(?:href|src)="/?([\w./-]+\.(?:css|js))(\?v=[^"]*)?"', lire(page)):
        versions[os.path.basename(nom)].add(version or "(sans version)")
for nom, ensemble in sorted(versions.items()):
    if len(ensemble) > 1:
        erreur(f"versions différentes pour {nom} : {', '.join(sorted(ensemble))}")

# 6. Faits clés
INTERDITS = [
    (r"certifi[ée]+s? (par l|QualiR)", "« certifié » (dire « labellisé »)"),
    (r"l[’']État finance|agréé et audité|certification officielle du Minist", "QualiRépar présenté comme financé ou certifié par l'État"),
    (r"comme neuf", "« comme neuf »"),
    (r"Apple Expert", "« Apple Expert »"),
    (r"4,6 ?/ ?5|550 ?avis|550\+", "ancienne note Google"),
    (r"46\.3065|4\.8336", "anciennes coordonnées GPS"),
    (r"Paiement en 3 fois|jusqu'à 3000", "moyens de paiement erronés"),
    (r"est urgente|demande urgente", "message « urgent » par défaut"),
    (r"Vous êtes au bon endroit", "texte « Vous êtes au bon endroit »"),
    (r"Concret\. Vérifiable\.", "texte robotique"),
]
for page in pages:
    if page in redirections:
        continue
    texte = urllib.parse.unquote(lire(page))
    for motif, libelle in INTERDITS:
        if page == "roulette.html" and "bon endroit" in motif:
            continue  # roulette : textes gérés par le dirigeant, seules les fautes sont corrigées
        if re.search(motif, texte, re.I):
            erreur(f"{page} : {libelle}")
    if re.search(r'wa\.me/33783921884"', texte):
        erreur(f"{page} : lien WhatsApp sans texte prérempli")

accueil = lire("index.html")
for obligatoire in ["03 85 33 06 89", "21 rue Gambetta", "https://solution-phone.fr/#business", "46.3025", "4,7/5"]:
    if obligatoire not in accueil:
        erreur(f"index.html : information obligatoire absente -> {obligatoire}")
for page in pages:
    if page in redirections or page == "roulette.html":
        continue
    texte = lire(page)
    for lien in ["cgv.html", "politique-confidentialite"]:
        if lien not in texte:
            erreur(f"{page} : lien de pied de page manquant -> {lien}")

# Résumé
print(f"Pages publiées contrôlées : {len(pages)} (dont {len(redirections)} redirections)")
for message in avertissements:
    print("Attention :", message)
for message in erreurs:
    print("ERREUR :", message)
if erreurs:
    print(f"{len(erreurs)} erreur(s).")
    sys.exit(1)
print("Tout est bon.")
