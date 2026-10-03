function getId(id) { return document.getElementById(id); }
function getClass(name) { return Array.prototype.slice.call(document.getElementsByClassName(name)); }
function drawScore(score) { getId('score-value').textContent = score; }
function drawLeaderboard(userID, leaderboard) {
  var list = getId('leaderboard');
  list.replaceChildren();
  (leaderboard || []).filter(function(ref) { return ref.id !== userID; }).slice(0, 3).forEach(function(ref) {
    if (typeof map !== 'undefined' && map && map.players[ref.id]) {
      map.players[ref.id].name = ref.name;
      map.players[ref.id].score = ref.score;
    }
    var row = document.createElement('li');
    var avatar = document.createElement('canvas');
    avatar.width = avatar.height = 96; avatar.className = 'tank-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.dataset.player = ref.id;
    var label = document.createElement('span'); label.className = 'player-name';
    label.textContent = ref.name || 'Player';
    var score = document.createElement('strong'); score.textContent = ref.score || 0;
    row.append(avatar, label, score); list.append(row);
    Art.avatar(avatar, ref.id);
  });
  var selfAvatar = getId('score').querySelector('canvas');
  selfAvatar.dataset.player = userID || '';
  Art.avatar(selfAvatar, userID);
}
function toggleMenu() {
  getId('menu').hidden = !getId('menu').hidden;
  getId('hud').hidden = !getId('menu').hidden;
}
var lastMineInventory = -1;
function updateMineInventory() {
  if (typeof user === 'undefined' || !user) return;
  var available = Math.max(0, 2 - user.mines.length);
  if (available === lastMineInventory) return;
  lastMineInventory = available;
  getId('hud').querySelector('.mine-inventory').setAttribute('aria-label', available + ' of 2 mines available');
  getClass('mine-token').forEach(function(token, index) { token.classList.toggle('used', index >= available); });
}
function syncSoundButtons() {
  document.querySelectorAll('[data-sound]').forEach(function(button) {
    button.classList.toggle('muted', GameAudio.muted);
    button.setAttribute('aria-pressed', String(GameAudio.muted));
    button.setAttribute('aria-label', GameAudio.muted ? 'Enable sound' : 'Mute sound');
  });
}
(function initMenu() {
  try { getId('menu-name').value = localStorage.getItem('tank-time-name') || ''; } catch (error) {}
  getId('join-form').addEventListener('submit', function(event) {
    event.preventDefault();
    name = getId('menu-name').value.trim() || 'Player One';
    try { localStorage.setItem('tank-time-name', name); } catch (error) {}
    GameAudio.unlock(); GameAudio.play('start');
    init(); drawScore(0); drawLeaderboard(); toggleMenu();
    getId('menu-name').blur();
  });
  document.querySelectorAll('[data-sound]').forEach(function(button) {
    button.addEventListener('click', function() {
      GameAudio.unlock(); GameAudio.toggle(); syncSoundButtons(); GameAudio.play('click');
    });
  });
  var dialog = getId('help-dialog');
  document.querySelectorAll('[data-help]').forEach(function(button) {
    button.addEventListener('click', function() {
      if (typeof user !== 'undefined' && user) user.blurListener();
      GameAudio.unlock(); GameAudio.play('click'); dialog.showModal();
    });
  });
  dialog.querySelectorAll('.dialog-close, .dialog-done').forEach(function(button) {
    button.addEventListener('click', function() { GameAudio.play('click'); dialog.close(); });
  });
  dialog.addEventListener('click', function(event) { if (event.target === dialog) {
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  } });
  syncSoundButtons();
})();
