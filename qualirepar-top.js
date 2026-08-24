(function () {
  'use strict';

  function mountQualireparBanner() {
    if (document.querySelector('.spq-bonus-bar')) return;

    var bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'spq-bonus-bar';
    bar.setAttribute('aria-haspopup', 'dialog');
    bar.setAttribute('aria-controls', 'spq-bonus-modal');
    bar.innerHTML =
      '<img class="spq-bonus-logo" src="img/qualirepar-label-officiel.jpg" alt="Label QualiRépar">' +
      '<span class="spq-bonus-amount">25 €<small>bonus</small></span>' +
      '<span class="spq-bonus-copy"><strong>déduits immédiatement de votre réparation</strong><span>À Mâcon, profitez du Bonus Réparation chez Solution Phone</span></span>' +
      '<span class="spq-bonus-action">Comment ça marche ?</span>';

    var modal = document.createElement('div');
    modal.className = 'spq-bonus-modal';
    modal.id = 'spq-bonus-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<section class="spq-bonus-dialog" role="dialog" aria-modal="true" aria-labelledby="spq-bonus-title">' +
        '<button class="spq-bonus-close" type="button" aria-label="Fermer">×</button>' +
        '<div class="spq-bonus-dialog-head">' +
          '<img class="spq-bonus-dialog-logo" src="img/qualirepar-label-officiel.jpg" alt="Label QualiRépar">' +
          '<p>Bonus Réparation</p>' +
          '<h2 id="spq-bonus-title">25 € retirés directement de votre facture</h2>' +
        '</div>' +
        '<div class="spq-bonus-dialog-body">' +
          '<p class="spq-bonus-intro">Solution Phone est labellisé QualiRépar. Lorsque votre réparation entre dans le dispositif, le bonus est appliqué immédiatement en boutique : vous n’avez aucun dossier à remplir.</p>' +
          '<ol class="spq-bonus-steps">' +
            '<li><b>1</b><span>Vous nous apportez votre smartphone à Mâcon.</span></li>' +
            '<li><b>2</b><span>Notre équipe vérifie la panne et vous annonce le tarif.</span></li>' +
            '<li><b>3</b><span>Les 25 € sont déduits directement de la facture.</span></li>' +
          '</ol>' +
          '<p class="spq-bonus-conditions">Bonus applicable aux appareils hors garantie et aux réparations couvertes par le dispositif QualiRépar, selon les conditions officielles en vigueur.</p>' +
          '<a class="spq-bonus-cta" href="./#devis">Demander mon devis</a>' +
        '</div>' +
      '</section>';

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(modal);

    var closeButton = modal.querySelector('.spq-bonus-close');
    var quoteButton = modal.querySelector('.spq-bonus-cta');

    function openModal() {
      modal.hidden = false;
      document.body.classList.add('spq-modal-open');
      closeButton.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('spq-modal-open');
      bar.focus();
    }

    bar.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    quoteButton.addEventListener('click', function () {
      modal.hidden = true;
      document.body.classList.remove('spq-modal-open');
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountQualireparBanner, { once: true });
  } else {
    mountQualireparBanner();
  }
})();
