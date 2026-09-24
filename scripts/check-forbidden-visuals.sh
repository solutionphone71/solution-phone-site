#!/bin/sh
# Vérifie qu'aucune page publique n'utilise un visuel interdit (microscope, outils, plan de travail).
set -eu
cd "$(dirname "$0")/.."

pattern='microscope[^)]*\.(jpg|jpeg|png|webp)|microscope-reparation|atelier-solution-phone-outils|plan[-_ ]?de[-_ ]?travail|workbench'

if grep -rniE "$pattern" --include='*.html' --include='*.css' --include='*.js' \
     --exclude-dir=.git --exclude-dir=scripts --exclude-dir=supabase . ; then
  echo "Visuel interdit détecté : microscope, outils ou plan de travail."
  exit 1
fi

echo "Aucun visuel interdit détecté."
