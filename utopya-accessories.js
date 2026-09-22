/* Catalogue visuel consulté le 22/09/2026 sur https://www.utopya.fr/accessoires.html
 * Sélection grand public, sans lots professionnels, sans prix fournisseur ni stock annoncé.
 */
window.utopyaAccessories=(function(){
 const base='https://www.utopya.fr/media/catalog/product/cache/361213619c8483dcf525ed41a38dd6e5/';
 const rows=[
 ['audio','Apple AirPods Pro 3 (Blanc)','m/f/mfhp4zma.png'],
 ['audio','APPLE AirPods 4 avec réduction active du bruit (Blanc)','3/3/333--airpods4.jpg'],
 ['audio','APPLE AirPods 4 (Blanc)','5/7/574--airpods4.jpg'],
 ['audio','SAMSUNG Galaxy Buds 4 Pro (Noir)','1/-/1-sm-r640nzkaxef.jpg'],
 ['audio','SAMSUNG Galaxy Buds 4 Pro (Blanc)','1/-/1-sm-r640nzwaxef.jpg'],
 ['audio','SAMSUNG Galaxy Buds 3 Pro (Blanc)','2/5/251--buds3problanc.jpg'],
 ['audio','SAMSUNG Galaxy Buds 3 Pro (Argent)','2/6/260--buds3argent.jpg'],
 ['audio','SAMSUNG Galaxy Buds 3 (Blanc)','2/6/266--buds3.jpg'],
 ['audio','SAMSUNG Galaxy Buds 3 (Argent)','2/6/261--buds3argent.jpg'],
 ['audio','SAMSUNG Galaxy Buds 4 (Blanc)','1/-/1-sm-r540nzwaxef.jpg'],
 ['audio','SAMSUNG Galaxy Buds 4 (Noir)','0/1/01-sm-r540nzkaxef.jpg'],
 ['audio','SAMSUNG Galaxy Buds 3 FE (Blanc)','l/b/lbsm-r420nzaaxef.png'],
 ['audio','SAMSUNG Galaxy Buds 3 FE (Noir)','1/-/1-bsm-r420nzkaxef.png'],
 ['batteries','BELKIN PowerBank 27 000 mAh 240W (Noir)','1/-/1-bpb040hqch.jpg'],
 ['batteries','BELKIN PowerBank 25 000 mAh 140W (Noir)','1/-/1-bpb039hqbk.jpg'],
 ['chargeurs','BELKIN Station de recharge portable 3-en-1 Qi2 15W','5/5/554--wiz024vfbk.jpg'],
 ['chargeurs','BELKIN Station de recharge 3-en-1 Qi2 15W (Blanc)','1/1/11_1_1-000.jpg'],
 ['chargeurs','BELKIN Station de recharge 3-en-1 Qi2 15W (Noir)','7/4/745883868735-0000.jpg'],
 ['chargeurs','BELKIN Chargeur magnétique de voyage 2-en-1 Qi2 15W','2/w/2wiz026vfbk.png'],
 ['chargeurs','BELKIN Chargeur secteur GaN 200W 4 USB-C','b/e/belkin221587-01.jpg'],
 ['chargeurs','BELKIN Station de recharge sans fil 3-en-1 Qi2 15W (Noir)','3/6/363--wiz029vfbk-000.jpg'],
 ['chargeurs','BELKIN Station de recharge magnétique 3-en-1 Qi2 25W (Blanc)','1/1/11-wiz037kqwh.png'],
 ['chargeurs','BELKIN Station de recharge magnétique 3-en-1 Qi2 25W (Noir)','w/i/wiz037kqbk.png'],
 ['chargeurs','APPLE Chargeur double USB-C 35W','7/8/789--mnwp3zm-a_1.jpg'],
 ['chargeurs','BELKIN Station de recharge sans fil 2-en-1 Qi2 15W (Noir)','3/7/370--wiz028vfbk.jpg'],
 ['chargeurs','BELKIN Station de recharge modulaire 3-en-1 Qi2 25W (Blanc)','1/-/1-wiz052kqwh.jpg'],
 ['chargeurs','BELKIN Station de recharge modulaire 3-en-1 Qi2 25W (Noir)','1/-/1-wiz052kqbk.jpg'],
 ['chargeurs','BELKIN Station de recharge sans fil 2-en-1 Qi2 15W (Blanc)','3/6/365--745883889921.jpg'],
 ['cables','APPLE Câble USB-C vers MagSafe 3 — 2 m (Argent)','a/p/appcbl-3.jpeg'],
 ['accessoires','APPLE AirTag 2 — Pack de 4','a/r/aritag2_4_.jpg']
 ];
 const result={};rows.forEach(([category,name,path])=>{(result[category]||(result[category]=[])).push({name,img:base+path,brand:name.split(' ')[0].toUpperCase(),price:null,source:'https://www.utopya.fr/accessoires.html'})});return result;
})();
