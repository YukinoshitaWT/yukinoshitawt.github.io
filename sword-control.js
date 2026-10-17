(() => {
  'use strict';
  const root = document.querySelector('.sword-controls');
  if (!root) return;
  const find = (name) => root.querySelector(`[data-sword-${name}]`);
  const stage = find('stage');
  const start = find('start');
  const reset = find('reset');
  const height = find('height');
  const figure = root.querySelector('.sword-control-figure');
  const player = find('player');
  const blade = find('blade');
  if (![stage, start, reset, height, figure, player, blade].every(Boolean)) return;

  const world = find('world');
  const shadow = find('shadow');
  const heightLine = find('height-line');
  const stateLabel = find('state');
  const heightLabel = find('height-value');
  const stick = find('stick');
  const stickDot = stick?.querySelector('span');
  const keys = new Set();
  const padInputs = new Map();
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const project = (x, z) => ({ x: .85 * x + .65 * z, y: .3 * x - .43 * z });
  const translate = (element, x, y) => element?.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  const initialHeight = clamp(Number(height.defaultValue) || 45, 0, 100);
  let model = { playerX: 0, playerZ: 0, swordX: 0, swordZ: 0, height: initialHeight };
  let running = false, frame = 0, previous = 0, hasStarted = false;
  let steering = { x: 0, z: 0 }, touch = null;

  // Distances and speeds below belong only to this web illustration.
  function render() {
    const camera = project(model.playerX * .4, model.playerZ * .4);
    const person = project(model.playerX, model.playerZ);
    const sword = project(model.swordX, model.swordZ);
    const sx = 285 + sword.x - camera.x;
    const sy = 205 + sword.y - camera.y;
    const lift = 9 + model.height * .58;
    translate(world, -camera.x, -camera.y);
    translate(player, person.x - camera.x, person.y - camera.y);
    translate(blade, sx - 285, sy - lift - 170);
    if (shadow) {
      shadow.setAttribute('cx', sx.toFixed(2));
      shadow.setAttribute('cy', sy.toFixed(2));
      shadow.setAttribute('rx', (14 - model.height * .045).toFixed(2));
      shadow.setAttribute('ry', (5 - model.height * .015).toFixed(2));
    }
    heightLine?.setAttribute('d', `M${sx.toFixed(2)} ${sy.toFixed(2)}V${(sy - lift + 12).toFixed(2)}`);
    height.value = String(Math.round(model.height));
    if (heightLabel) heightLabel.textContent = `${Math.round(model.height)}%`;
  }

  function clearSteering() {
    steering = { x: 0, z: 0 };
    if (touch && stage.hasPointerCapture(touch.id)) stage.releasePointerCapture(touch.id);
    touch = null;
    if (stick) stick.hidden = true;
    if (stickDot) stickDot.style.transform = 'translate(-50%, -50%)';
  }

  function clearInput() {
    keys.clear();
    clearSteering();
    padInputs.clear();
    root.querySelectorAll('[data-sword-move]').forEach((button) => { button.classList.remove('is-active'); });
  }

  function pause(message = '已暂停，可继续体验。') {
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    clearInput();
    figure.classList.remove('is-running');
    start.textContent = hasStarted ? '继续御剑体验' : '开始御剑体验';
    start.setAttribute('aria-pressed', 'false');
    if (stateLabel) stateLabel.textContent = message;
  }

  function step(timestamp) {
    if (!running) return;
    const dt = previous ? Math.min((timestamp - previous) / 1000, .04) : 0;
    previous = timestamp;
    const directions = new Set(padInputs.values());
    let dx = Number(keys.has('d') || directions.has('right')) - Number(keys.has('a') || directions.has('left'));
    let dz = Number(keys.has('w') || directions.has('forward')) - Number(keys.has('s') || directions.has('back'));
    const length = Math.max(1, Math.hypot(dx, dz));
    model.playerX = clamp(model.playerX + dx / length * 43 * dt, -65, 65);
    model.playerZ = clamp(model.playerZ + dz / length * 43 * dt, -58, 58);
    model.swordX = clamp(model.swordX + steering.x * 76 * dt, -88, 88);
    model.swordZ = clamp(model.swordZ + steering.z * 76 * dt, -65, 65);
    model.height = clamp(model.height + (Number(keys.has('e')) - Number(keys.has('q'))) * 34 * dt, 0, 100);
    render();
    frame = requestAnimationFrame(step);
  }

  start.addEventListener('pointerdown', (event) => event.preventDefault());
  start.addEventListener('click', () => {
    if (running) { pause(); return; }
    if (document.hidden) return;
    clearInput();
    running = true;
    hasStarted = true;
    figure.classList.add('is-running');
    start.textContent = '暂停体验';
    start.setAttribute('aria-pressed', 'true');
    if (stateLabel) stateLabel.textContent = '体验中：移动角色、操控飞剑，并单独调整高度。';
    stage.focus({ preventScroll: true });
    frame = requestAnimationFrame(step);
  });

  reset.addEventListener('click', () => {
    pause('已重置，点击开始体验。');
    hasStarted = false;
    start.textContent = '开始御剑体验';
    model = { playerX: 0, playerZ: 0, swordX: 0, swordZ: 0, height: initialHeight };
    render();
  });

  function steer(event) {
    if (!running || (event.pointerType !== 'mouse' && touch?.id !== event.pointerId)) return;
    const rect = stage.getBoundingClientRect();
    const origin = touch || { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const radius = touch ? Math.min(65, rect.width * .2) : Math.max(50, Math.min(rect.width, rect.height) * .42);
    let x = (event.clientX - origin.x) / radius;
    let y = (event.clientY - origin.y) / radius;
    const magnitude = Math.hypot(x, y);
    if (magnitude < .09) { x = 0; y = 0; }
    else if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    steering = { x, z: -y };
    if (stick) {
      stick.hidden = false;
      stick.style.left = `${origin.x - rect.left}px`;
      stick.style.top = `${origin.y - rect.top}px`;
      stick.style.setProperty('--stick-dx', `${x * 19}px`);
      stick.style.setProperty('--stick-dy', `${y * 19}px`);
      if (stickDot) stickDot.style.transform = `translate(-50%, -50%) translate(${x * 19}px, ${y * 19}px)`;
    }
  }

  stage.addEventListener('pointerdown', (event) => {
    if (!running || event.button !== 0) return;
    stage.focus({ preventScroll: true });
    if (event.pointerType !== 'mouse') {
      event.preventDefault();
      clearSteering();
      touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
      stage.setPointerCapture(event.pointerId);
    }
    steer(event);
  });
  stage.addEventListener('pointermove', (event) => {
    if (running && event.pointerType !== 'mouse' && touch) event.preventDefault();
    steer(event);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach((type) => {
    stage.addEventListener(type, clearSteering);
  });
  stage.addEventListener('blur', () => { keys.clear(); clearSteering(); });
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') { clearInput(); return; }
    const key = event.code.startsWith('Key') ? event.code.slice(3).toLowerCase() : event.key.toLowerCase();
    if (!running || event.ctrlKey || event.metaKey || event.altKey || !['w', 'a', 's', 'd', 'q', 'e'].includes(key)) return;
    event.preventDefault();
    keys.add(key);
  });
  stage.addEventListener('keyup', (event) => {
    keys.delete(event.code.startsWith('Key') ? event.code.slice(3).toLowerCase() : event.key.toLowerCase());
  });

  root.querySelectorAll('[data-sword-move]').forEach((button) => {
    const release = (event) => { padInputs.delete(event.pointerId); button.classList.remove('is-active'); };
    button.addEventListener('pointerdown', (event) => {
      if (!running || event.button !== 0) return;
      event.preventDefault();
      stage.focus({ preventScroll: true });
      padInputs.set(event.pointerId, button.dataset.swordMove);
      button.classList.add('is-active');
      button.setPointerCapture(event.pointerId);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => button.addEventListener(type, release));
    button.addEventListener('click', (event) => {
      if (!running || event.detail !== 0) return;
      const direction = button.dataset.swordMove;
      model.playerX = clamp(model.playerX + (direction === 'right' ? 10 : direction === 'left' ? -10 : 0), -65, 65);
      model.playerZ = clamp(model.playerZ + (direction === 'forward' ? 10 : direction === 'back' ? -10 : 0), -58, 58);
      render();
    });
  });

  function setHeight(value) {
    if (!hasStarted) return;
    model.height = clamp(Number(value), 0, 100);
    render();
  }
  height.addEventListener('input', () => { setHeight(height.value); render(); });
  root.querySelectorAll('[data-sword-height-step]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      if (running && event.pointerType === 'mouse') event.preventDefault();
    });
    button.addEventListener('click', () => setHeight(model.height + (button.dataset.swordHeightStep === 'up' ? 8 : -8)));
  });

  figure.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') pause('已结束体验，可重新开始。');
  });
  figure.addEventListener('focusout', (event) => {
    if (!figure.contains(event.relatedTarget)) pause('已暂停，返回后可继续体验。');
  });
  window.addEventListener('blur', () => pause('已暂停，返回后可继续体验。'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (running && entry.intersectionRatio < .1) pause();
    }, { threshold: [.1] }).observe(stage);
  }
  // No trails or decorative motion; reduced-motion users get the same direct controls.
  const tools = find('tools');
  if (tools) tools.hidden = false;
  root.classList.add('sword-play-ready');
  pause('操作示意，点击开始体验。');
  render();
})();
