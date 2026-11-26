#!/usr/bin/env python3
"""Suite de tests automatisés exécutables avec Python 3 (unittest)."""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_text(rel_path):
    with open(os.path.join(ROOT, rel_path), encoding="utf-8") as f:
        return f.read()


def extract_jsonld(html_text):
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html_text, re.S)
    return [json.loads(b) for b in blocks]


class TestSiteSEOAndConversion(unittest.TestCase):
    def test_faq_jsonld_is_valid_and_has_questions(self):
        blocks = extract_jsonld(read_text("faq.html"))
        self.assertGreaterEqual(len(blocks), 1)
        faq = next((b for b in blocks if b.get("@type") == "FAQPage"), None)
        self.assertIsNotNone(faq)
        self.assertGreaterEqual(len(faq.get("mainEntity", [])), 5)

    def test_reconditionnes_has_product_offer_and_live_scripts(self):
        html = read_text("reconditionnes.html")
        blocks = extract_jsonld(html)
        self.assertEqual(len(blocks), 1)
        graph = blocks[0].get("@graph", [])
        types = {node.get("@type") for node in graph}
        self.assertIn("ItemList", types)
        self.assertIn("FAQPage", types)
        item_list = next(n for n in graph if n.get("@type") == "ItemList")
        self.assertGreaterEqual(len(item_list["itemListElement"]), 2)
        first_product = item_list["itemListElement"][0]["item"]
        self.assertEqual(first_product["@type"], "Product")
        self.assertEqual(first_product["offers"]["priceCurrency"], "EUR")
        self.assertIn("RefurbishedCondition", first_product["offers"]["itemCondition"])
        # Scripts live stock restaurés
        self.assertIn("iphone-image-library.js?v=2", html)
        self.assertIn("reconditionnes-v2.js?v=3", html)
        self.assertIn("conversion-boost.js?v=1", html)
        self.assertIn("data-sp-lead-form", html)

    def test_index_has_recond_conversion_band_and_upsell(self):
        html = read_text("index.html")
        self.assertIn("conversion-boost.css?v=1", html)
        self.assertIn("sp-boost-band", html)
        self.assertIn("sp-mail-recond-upsell", html)
        self.assertIn("reconditionnes.html", html)
        self.assertIn('loading="lazy"', html)

    def test_repair_pages_have_faq_jsonld_and_cta_strip(self):
        for page in ("reparation-telephone-macon.html", "reparation-iphone.html"):
            html = read_text(page)
            blocks = extract_jsonld(html)
            graph = blocks[0].get("@graph", [])
            types = {node.get("@type") for node in graph}
            self.assertIn("FAQPage", types, f"FAQPage absent de {page}")
            self.assertIn("sp-boost-strip", html, f"Bandeau CTA absent de {page}")
            self.assertIn("reconditionnes.html", html, f"Lien reconditionnés absent de {page}")
            self.assertIn("family=Montserrat", html, f"Police Montserrat non chargée sur {page}")

        samsung_html = read_text("reparation-samsung.html")
        self.assertIn("sp-boost-strip", samsung_html)
        self.assertIn("reconditionnes.html", samsung_html)
        self.assertIn("Montserrat", samsung_html)

    def test_forms_lead_page_respects_charter_and_rgpd(self):
        html = read_text("forms/lead.html")
        self.assertNotIn("comme neuf", html.lower())
        self.assertIn("conversion-boost.css?v=1", html)
        self.assertIn("conversion-boost.js?v=1", html)
        self.assertIn("family=Montserrat", html)
        self.assertIn('name="website"', html)
        self.assertIn('type="checkbox" name="consent" required', html)
        self.assertIn("cgv.html", html)
        self.assertIn("politique-confidentialite.html", html)

    def test_conversion_boost_uses_live_quote_endpoint(self):
        js = read_text("conversion-boost.js")
        self.assertIn("https://vps-8066c206.vps.ovh.net/api/public/quote-request", js)
        self.assertIn("Moins de 250 €", js)
        self.assertIn("form_type: 'main_quote'", js)
        self.assertNotIn("reconditionne_lead", js)
        self.assertIn("[Conseil reconditionné]", js)

    def test_obsolete_untracked_files_removed(self):
        self.assertFalse(os.path.exists(os.path.join(ROOT, "gtm_container.js")))
        self.assertFalse(os.path.exists(os.path.join(ROOT, "plan.md")))

    def test_charter_colors_and_montserrat_present(self):
        css = read_text("conversion-boost.css")
        self.assertIn("#0D0D0D", css)
        self.assertIn("#FFFFFF", css)
        self.assertIn("#E10600", css)
        self.assertIn("Montserrat", css)

    def test_keywords_doc_exists_and_maps_real_pages(self):
        md = read_text("seo/keywords.md")
        self.assertIn("/reconditionnes.html", md)
        self.assertIn("/reparation-iphone.html", md)
        self.assertIn("/reparation-samsung.html", md)
        self.assertIn("Mâcon", md)

    def test_package_json_valid(self):
        pkg = json.loads(read_text("package.json"))
        self.assertIn("sitemap", pkg["scripts"])
        self.assertIn("seo", pkg["scripts"])
        self.assertIn("test", pkg["scripts"])

    def test_core_web_vitals_images_and_picture_webp(self):
        # 1. Les versions WebP générées existent et sont plus légères que les JPEG conservés
        for jpg_rel in (
            "img/equipe-solution-phone-macon-2026.jpg",
            "img/atelier.jpg",
            "img/qualirepar-label-officiel.jpg",
        ):
            webp_rel = os.path.splitext(jpg_rel)[0] + ".webp"
            jpg_path = os.path.join(ROOT, jpg_rel)
            webp_path = os.path.join(ROOT, webp_rel)
            self.assertTrue(os.path.exists(jpg_path), f"Fallback JPEG supprimé : {jpg_rel}")
            self.assertTrue(os.path.exists(webp_path), f"WebP absent : {webp_rel}")
            self.assertLess(
                os.path.getsize(webp_path),
                os.path.getsize(jpg_path),
                f"{webp_rel} n'est pas plus léger que {jpg_rel}",
            )

        # 2. Balises <picture> + WebP sur les pages clés utilisant ces JPEG
        self.assertIn('srcset="img/equipe-solution-phone-macon-2026.webp"', read_text("index.html"))
        self.assertIn('srcset="img/qualirepar-label-officiel.webp"', read_text("index.html"))
        self.assertIn('srcset="img/atelier.webp"', read_text("reparation-telephone-macon.html"))
        self.assertIn('srcset="img/equipe-solution-phone-macon-2026.webp"', read_text("atelier.html"))
        self.assertIn('srcset="img/qualirepar-label-officiel.webp"', read_text("atelier.html"))

        # 3. Toutes les balises <img> statiques des 8 pages clés ont width, height et decoding="async"
        key_pages = (
            "index.html",
            "reconditionnes.html",
            "reparation-iphone.html",
            "reparation-samsung.html",
            "reparation-telephone-macon.html",
            "accessoires.html",
            "atelier.html",
            "faq.html",
        )
        for page in key_pages:
            html_no_js = re.sub(r"<script\b[^>]*>.*?</script>", "", read_text(page), flags=re.S | re.I)
            for img_tag in re.findall(r"<img\b[^>]*>", html_no_js, flags=re.S | re.I):
                self.assertRegex(img_tag, r'\bwidth=', f"width manquant sur {page}: {img_tag[:120]}")
                self.assertRegex(img_tag, r'\bheight=', f"height manquant sur {page}: {img_tag[:120]}")
                self.assertRegex(img_tag, r'\bdecoding="async"', f"decoding=async manquant sur {page}: {img_tag[:120]}")
                # Les images LCP hero avec fetchpriority="high" ne doivent pas être lazy
                if 'fetchpriority="high"' in img_tag:
                    self.assertNotIn('loading="lazy"', img_tag, f"LCP ne doit pas être lazy sur {page}")

    def test_fonts_preconnect_and_defer_scripts(self):
        pages_with_fonts = (
            "index.html",
            "reconditionnes.html",
            "reparation-iphone.html",
            "reparation-samsung.html",
            "reparation-telephone-macon.html",
            "accessoires.html",
            "faq.html",
            "forms/lead.html",
        )
        for page in pages_with_fonts:
            html = read_text(page)
            self.assertIn('href="https://fonts.googleapis.com"', html, f"preconnect googleapis absent sur {page}")
            self.assertIn('href="https://fonts.gstatic.com"', html, f"preconnect gstatic absent sur {page}")
            self.assertIn("display=swap", html, f"display=swap absent sur {page}")

        # Scripts non bloquants en defer + conversion-boost.js?v=1 chargé sur toutes les pages clés
        for page in (
            "index.html",
            "reconditionnes.html",
            "reparation-iphone.html",
            "reparation-samsung.html",
            "reparation-telephone-macon.html",
            "accessoires.html",
            "atelier.html",
            "faq.html",
            "forms/lead.html",
        ):
            html = read_text(page)
            self.assertRegex(
                html,
                r'<script\s+src="/?conversion-boost\.js\?v=1"\s+defer></script>',
                f"conversion-boost.js?v=1 defer manquant sur {page}",
            )

        index_html = read_text("index.html")
        self.assertIn('<script src="apple-screens-20261112-v3.js" defer></script>', index_html)
        self.assertIn('<script src="/accueil-core.js?v=1" defer></script>', index_html)
        recond_html = read_text("reconditionnes.html")
        self.assertIn('<script src="iphone-image-library.js?v=2" defer></script>', recond_html)
        self.assertIn('<script src="reconditionnes-v2.js?v=3" defer></script>', recond_html)

    def test_cta_tracking_attributes_and_pii_guards(self):
        js = read_text("conversion-boost.js")
        self.assertIn("ALLOWED_ANALYTICS_KEYS", js)
        self.assertIn("looksLikePii", js)
        self.assertIn("hasAnalyticsConsent", js)
        self.assertIn("transport_type: 'beacon'", js)
        self.assertIn("sp_cta_click", js)

        index_html = read_text("index.html")
        for cta_type in ("devis", "reconditionnes", "reprise", "whatsapp", "appel"):
            self.assertIn(f'data-sp-track="{cta_type}"', index_html, f"data-sp-track={cta_type} absent de index.html")

        for page in (
            "reconditionnes.html",
            "reparation-iphone.html",
            "reparation-samsung.html",
            "reparation-telephone-macon.html",
        ):
            html = read_text(page)
            self.assertIn('data-sp-track="devis"', html, f"data-sp-track=devis absent de {page}")
            self.assertIn('data-sp-track="reconditionnes"', html, f"data-sp-track=reconditionnes absent de {page}")

        for page in ("accessoires.html", "atelier.html", "faq.html", "forms/lead.html"):
            html = read_text(page)
            self.assertIn("data-sp-track=", html, f"data-sp-track absent de {page}")

        # forms/lead.html doit charger consent-tracking.js et GA4 pour que le tracking soit actif
        lead_html = read_text("forms/lead.html")
        self.assertIn('/scripts/consent-tracking.js?v=3', lead_html)
        self.assertIn("G-3QP90K1TLM", lead_html)
        self.assertIn("data-sp-consent-manage", lead_html)

        # Images dynamiques et CTA stock de reconditionnes-v2.js & accessoires.html
        recond_js = read_text("reconditionnes-v2.js")
        self.assertIn('width="96" height="72" loading="lazy" decoding="async"', recond_js)
        self.assertIn('data-sp-track="reconditionnes" data-sp-cta-location="reconditionnes_stock_row"', recond_js)
        acc_html = read_text("accessoires.html")
        self.assertIn('width="400" height="400" loading="lazy" decoding="async"', acc_html)

    def test_reconditionnes_trade_in_simulator_reservation_and_arrival_alert(self):
        html = read_text("reconditionnes.html")
        css = read_text("conversion-boost.css")
        recond_js = read_text("reconditionnes-v2.js")
        boost_js = read_text("conversion-boost.js")

        # 1. Simulateur de reprise instantanée sur reconditionnes.html
        for token in (
            'id="rcTradeBox"',
            "sp-trade-sim",
            'id="rcTradeModel"',
            'value="ip11"',
            'value="ip16p"',
            'value="s21"',
            'value="s24u"',
            'value="autre"',
            'id="rcTradeOther"',
            'data-cond="tres_bon"',
            'data-cond="correct"',
            'data-cond="fissure"',
            'id="rcTradeRange"',
            'id="rcTradeSummary"',
            'id="rcTradeApplyBtn"',
            'id="rcTradeWaBtn"',
            'data-sp-track="reprise"',
            "21\u202frue\u202fGambetta",
        ):
            self.assertIn(token, html, f"Élément simulateur reprise absent : {token}")

        # 2. Alerte arrivage & Réservation 24h dans #demande-conseil
        for token in (
            'id="rcArrivalBar"',
            'id="rcArrivalAlertBtn"',
            'data-sp-track="alerte_arrivage"',
            'id="rcLeadContext"',
            'data-sp-dynamic-cta="1"',
            'value="reservation_24h"',
            'value="alerte_arrivage"',
            'name="telephone"',
        ):
            self.assertIn(token, html, f"Élément réservation/alerte absent : {token}")

        # 3. Charte stricte et styles dédiés dans conversion-boost.css
        for selector in (".sp-trade-sim", ".sp-arrival-bar", ".sp-lead-context", ".rc-table td.rc-price .rc-net"):
            self.assertIn(selector, css, f"Style manquant dans conversion-boost.css : {selector}")

        # 4. Logique JS & tracking CNIL
        for token in ("estimateTradeIn", "formatNetRange", "sp_trade_simulate", "reservation_24h", "alerte_arrivage", "preserveNeed", "replaceTradeDetails"):
            self.assertIn(token, recond_js, f"Symbole manquant dans reconditionnes-v2.js : {token}")

        for token in ("[Réservation 24h]", "[Alerte arrivage]", "trade_brand", "trade_condition", "prefillLeadForm", "stripTradeClauses"):
            self.assertIn(token, boost_js, f"Symbole manquant dans conversion-boost.js : {token}")


class TestFaqFallbackScript(unittest.TestCase):
    def test_missing_argument_exits_with_error_json(self):
        proc = subprocess.run(
            [sys.executable, os.path.join(ROOT, "scripts", "faq_fallback.py")],
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 1)
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["status"], "error")

    def test_unknown_question_without_telegram_env_returns_error_json(self):
        env = os.environ.copy()
        env.pop("TELEGRAM_BOT_TOKEN", None)
        env.pop("TELEGRAM_CHAT_ID", None)
        proc = subprocess.run(
            [sys.executable, os.path.join(ROOT, "scripts", "faq_fallback.py"), "Question totalement inconnue ?"],
            capture_output=True,
            text=True,
            env=env,
        )
        self.assertEqual(proc.returncode, 0)
        payload = json.loads(proc.stdout)
        self.assertEqual(payload["status"], "error")


if __name__ == "__main__":
    unittest.main()
