#!/bin/sh
set -eu

pattern='microscope[^)]*\.(jpg|jpeg|png|webp)|microscope-reparation|atelier-solution-phone-outils|plan[-_ ]?de[-_ ]?travail|workbench'

if rg -n -i "$pattern" --glob '*.html' --glob '*.css' --glob '*.js' .; then
  echo "Visuel interdit détecté : microscope, outils ou plan de travail."
  exit 1
fi

echo "Aucun visuel interdit détecté."
