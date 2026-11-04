/* Boot */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-icon]').forEach(e => { e.outerHTML = Icon(e.dataset.icon); });
  $('#new-btn').addEventListener('click', () => UI.startCreation());
  $('#continue-btn').addEventListener('click', () => { if (!Engine.load()) UI.startCreation(); });
  $('#help-btn').addEventListener('click', () => UI.openHelp());
  $('#archive-btn').addEventListener('click', () => UI.openArchive());
  $('#map-btn').addEventListener('click', () => UI.openMap());
  $('#settings-btn').addEventListener('click', () => UI.openSettings());
  $('#title-settings-btn').addEventListener('click', () => UI.openSettings());
  document.addEventListener('click', () => { if (typeof Sound !== 'undefined' && Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume(); }, { once: true });
  $('#journal-btn').addEventListener('click', () => UI.openJournal());
  $('#game-help-btn').addEventListener('click', () => UI.openHelp());
  $('#menu-btn').addEventListener('click', () => {
    if (Combat.st) { UI.modal('<p>You can\'t leave in the middle of a battle.</p>'); return; }
    if (confirm('Return to the title screen? Your progress is saved.')) UI.title();
  });
  $('#modal-close').addEventListener('click', () => UI.closeModal());
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') UI.closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) UI.closeModal(); });
  UI.title();
});
