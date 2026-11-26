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
