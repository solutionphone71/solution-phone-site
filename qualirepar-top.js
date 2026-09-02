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
      '<span class="spq-bonus-amount">25 €<small>garantis</small></span>' +
      '<span class="spq-bonus-copy"><strong>déduits de votre réparation. Pour tout le monde.</strong><span>Votre avantage réparation smartphone chez Solution Phone à Mâcon</span></span>' +
      '<span class="spq-bonus-action">Obtenir mes 25 €</span>';

    var modal = document.createElement('div');
    modal.className = 'spq-bonus-modal';
    modal.id = 'spq-bonus-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<section class="spq-bonus-dialog" role="dialog" aria-modal="true" aria-labelledby="spq-bonus-title">' +
        '<button class="spq-bonus-close" type="button" aria-label="Fermer">×</button>' +
        '<div class="spq-bonus-dialog-head">' +
          '<img class="spq-bonus-dialog-logo" src="img/qualirepar-label-officiel.jpg" alt="Label QualiRépar">' +
          '<p>Engagement Solution Phone</p>' +
          '<h2 id="spq-bonus-title">25 € déduits. Pour tout le monde.</h2>' +
        '</div>' +
        '<div class="spq-bonus-dialog-body">' +
          '<p class="spq-bonus-intro">Solution Phone est labellisé QualiRépar. Avec nous, vous bénéficiez toujours de 25 € de réduction sur votre réparation de smartphone. Aucun dossier à remplir : notre équipe s’occupe de tout.</p>' +
          '<ol class="spq-bonus-steps">' +
            '<li><b>1</b><span>Vous nous apportez votre smartphone à Mâcon.</span></li>' +
            '<li><b>2</b><span>Notre équipe diagnostique la panne et vous annonce le tarif.</span></li>' +
            '<li><b>3</b><span>Les 25 € sont déduits directement de la facture.</span></li>' +
          '</ol>' +
          '<p class="spq-bonus-conditions">Lorsque la réparation est éligible, la réduction correspond au Bonus Réparation QualiRépar. Dans les autres cas, Solution Phone prend les 25 € à sa charge.</p>' +
          '<a class="spq-bonus-cta" href="./#devis">Obtenir mes 25 € et mon devis</a>' +
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
