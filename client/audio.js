// Small, tactile toy sounds. Audio starts only after a player gesture.
var GameAudio = (function() {
  var audio, master, muted = false, last = {};
  try { muted = localStorage.getItem('tank-time-muted') === 'true'; } catch (error) {}
  function unlock() {
    var Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!audio) { audio = new Audio(); master = audio.createGain(); master.gain.value = muted ? 0 : .22; master.connect(audio.destination); }
      if (audio.state === 'suspended') audio.resume().catch(function() {});
    } catch (error) {}
  }
  function tone(frequency, end, duration, delay, type, volume) {
    var start = audio.currentTime + (delay || 0), osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, end), start + duration);
    gain.gain.setValueAtTime(.001, start); gain.gain.exponentialRampToValueAtTime(volume || .5, start + .006);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + duration + .02);
  }
  function noise(duration) {
    var buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate), samples = buffer.getChannelData(0);
    for (var i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 2);
    var source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1000; gain.gain.value = .65;
    source.connect(filter); filter.connect(gain); gain.connect(master); source.start();
  }
  function play(kind) {
    if (!audio || audio.state !== 'running' || muted) return;
    var now = audio.currentTime;
    if (last[kind] !== undefined && now - last[kind] < .04) return;
    last[kind] = now;
    if (kind === 'shoot') { tone(250, 65, .11, 0, 'triangle', .75); noise(.045); }
    else if (kind === 'bounce') { tone(1400, 850, .1, 0, 'sine', .35); tone(2100, 1300, .08, 0, 'sine', .12); }
    else if (kind === 'mine') { tone(430, 190, .09, 0, 'triangle'); tone(700, 700, .06, .07, 'sine', .2); }
    else if (kind === 'explode') { noise(.3); tone(140, 35, .28, 0, 'triangle', .9); }
    else if (kind === 'hit') { noise(.22); tone(240, 70, .25, 0, 'triangle', .7); }
    else if (kind === 'start') { [440, 554, 659, 880].forEach(function(f, i) { tone(f, f, .17, i * .065, 'sine', .3); }); }
    else tone(600, 800, .07, 0, 'sine', .25);
  }
  return {unlock:unlock, play:play, get muted() { return muted; }, toggle:function() {
    muted = !muted; if (master) master.gain.setValueAtTime(muted ? 0 : .22, audio.currentTime);
    try { localStorage.setItem('tank-time-muted', String(muted)); } catch (error) {}
  }};
})();
