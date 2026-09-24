/*
 * Bibliothèque locale d’identification des iPhone.
 * Visuels issus de la page officielle Apple « Identifier votre modèle d’iPhone » :
 * https://support.apple.com/fr-fr/108044
 */
(function () {
  'use strict';

  var base = 'img/iphone-models/';
  var models = [
    ['17 pro max', 'iphone-17-pro-max-colors.webp'],
    ['17 pro', 'iphone-17-pro-colors.webp'],
    ['17e', 'iphone-17e-colors.webp'],
    ['17', 'iphone-17-colors.webp'],
    ['air', 'iphone-air-colors.webp'],
    ['16 pro max', 'iphone-16-pro-max-colors.webp'],
    ['16 pro', 'iphone-16-pro-colors.webp'],
    ['16 plus', 'iphone-16-plus-colors.webp'],
    ['16e', 'iphone-16e-colors.webp'],
    ['16', 'iphone-16-colors.webp'],
    ['15 pro max', 'fall-2023-iphone-colors-iphone-15-pro-max.webp'],
    ['15 pro', 'fall-2023-iphone-colors-iphone-15-pro.webp'],
    ['15 plus', 'fall-2023-iphone-colors-iphone-15-plus.webp'],
    ['15', 'fall-2023-iphone-colors-iphone-15.webp'],
    ['14 pro max', 'iphone-14-pro-max-colors.webp'],
    ['14 pro', 'iphone-14-pro-colors.webp'],
    ['14 plus', 'iphone-14-plus-colors-spring-2023.webp'],
    ['14', 'iphone-14-colors-spring-2023.webp'],
    ['13 pro max', '2022-spring-iphone13-pro-max-colors.webp'],
    ['13 pro', '2022-spring-iphone13-pro-colors.webp'],
    ['13 mini', '2022-iphone13-mini-colors.webp'],
    ['13', '2022-spring-iphone13-colors.webp'],
    ['12 pro max', 'iphone12-pro-max-colors.jpg'],
    ['12 pro', 'iphone12-pro-colors.jpg'],
    ['12 mini', '2021-iphone12-mini-colors.webp'],
    ['12', '2021-iphone12-colors.webp'],
    ['11 pro max', 'identify-iphone-11pro-max.jpg'],
    ['11 pro', 'identify-iphone-11pro.jpg'],
    ['11', 'identify-iphone-11-colors.jpg'],
    ['xs max', 'iphone-xs-max-colors.jpg'],
    ['xs', 'iphone-xs-colors.jpg'],
    ['xr', 'identify-iphone-xr-colors.jpg'],
    ['x', 'iphone-x-colors.jpg'],
    ['8 plus', 'iphone-8plus-colors.jpg'],
    ['8', 'iphone-8-colors.jpg'],
    ['7 plus', 'iphone7plus-colors.jpg'],
    ['7', 'iphone7-colors.jpg'],
    ['6s plus', 'iphone-6splus-colors.jpg'],
    ['6s', 'iphone-6s-colors.jpg'],
    ['6 plus', 'iphone-iphone6plus-colors.jpg'],
    ['6', 'iphone-iphone6-colors.jpg'],
    ['5s', 'iphone-iphone5s-colors.jpg'],
    ['5c', 'iphone-iphone5c-colors.jpg'],
    ['5', 'iphone-iphone5-colors.jpg'],
    ['4s', 'iphone-iphone4s-colors.jpg'],
    ['4', 'iphone-iphone4-colors.jpg'],
    ['3gs', 'iphone-iphone3gs-colors.jpg'],
    ['3g', 'iphone-iphone3g-colors.jpg'],
    ['original', 'iphone-iphone-original-colors.jpg']
  ];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\bapple\b/g, '')
      .replace(/\biphone\b/g, '')
      .replace(/pro\s*max|po\s*max/g, 'pro max')
      .replace(/\+/g, ' plus ')
      .replace(/\b(64|128|256|512)\s*(go|gb)\b/g, '')
      .replace(/\b1\s*(to|tb)\b/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function seImage(name) {
    if (!/(^| )se([ 0-9]|$)/.test(name)) return null;
    if (/\b(2022|3|3e|3eme|3 generation|se3)\b/.test(name)) return base + 'iphone-se-3rd-gen-colors.webp';
    if (/\b(2020|2|2e|2eme|2 generation|se2)\b/.test(name)) return base + 'iphone-se-2nd-gen-colors.jpg';
    return base + 'iphone-se-colors.jpg';
  }

  function resolve(modelName) {
    var name = normalize(modelName);
    if (/\b(2g|2007|original)\b/.test(name)) return base + 'iphone-iphone-original-colors.jpg';
    var specialEdition = seImage(name);
    if (specialEdition) return specialEdition;
    for (var i = 0; i < models.length; i += 1) {
      var key = models[i][0];
      if (name === key || name.indexOf(key + ' ') === 0 || name.indexOf(' ' + key + ' ') >= 0) {
        return base + models[i][1];
      }
    }
    return null;
  }

  window.SolutionPhoneIphoneImages = {
    resolve: resolve,
    normalize: normalize,
    count: models.length + 3,
    source: 'https://support.apple.com/fr-fr/108044'
  };
})();
