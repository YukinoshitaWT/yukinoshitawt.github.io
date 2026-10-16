(() => {
  'use strict';

  const cycle = document.querySelector('.cycle-lab');
  const cycleControls = document.querySelector('.lab-controls');
  const cycleButtons = [...document.querySelectorAll('[data-cycle]')];
  const cycleStatus = document.querySelector('.cycle-status');
  const cycleMessages = {
    idle: '近战积累资源，技能消耗资源，再回到近战。',
    gain: '近战攻击 → 积累战斗资源，为使用御剑技能提供资源。',
    spend: '御剑技能 → 消耗战斗资源，再回到近战积累。'
  };
  if (cycle && cycleControls && cycleStatus) {
    cycleControls.hidden = false;
    document.querySelector('[data-cycle-hint]').hidden = false;
    cycleButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const phase = button.dataset.cycle;
        cycle.dataset.phase = phase;
        cycleStatus.textContent = cycleMessages[phase];
        cycleButtons.forEach((item) => {
          if (item.dataset.cycle !== 'idle') item.setAttribute('aria-pressed', String(item === button));
        });
      });
    });
  }

  const selector = document.querySelector('.room-selector');
  const roomButtons = [...document.querySelectorAll('[data-room]')];
  const roomPanels = [...document.querySelectorAll('.room-panel')];
  const roomStatus = document.querySelector('.room-status');
  const roomNames = { direct: '第一阶段：直接观察', angle: '第二阶段：寻找角度', mirror: '第三阶段：借助镜面' };
  if (selector && roomPanels.length) {
    selector.hidden = false;
    roomPanels.forEach((panel, index) => { panel.hidden = index !== 0; });
    roomButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const room = button.dataset.room;
        roomButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        roomPanels.forEach((panel) => { panel.hidden = panel.id !== `room-${room}`; });
        roomStatus.textContent = roomNames[room];
        window.dispatchEvent(new Event('resize'));
      });
    });
  }

  document.querySelectorAll('[data-room-action]').forEach((button) => {
    const panel = button.closest('.room-panel');
    if (!panel) return;
    const initialLabel = button.textContent;
    button.hidden = false;
    button.addEventListener('click', () => {
      const showing = panel.classList.toggle('show-solution');
      button.setAttribute('aria-pressed', String(showing));
      button.textContent = showing ? '收起路径示意 ↙' : initialLabel;
    });
  });
})();
