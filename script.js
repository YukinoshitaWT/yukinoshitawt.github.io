// Smooth in-page navigation is native; this file keeps a small visual cue for keyboard users.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') document.body.classList.add('keyboard-navigation');
});
