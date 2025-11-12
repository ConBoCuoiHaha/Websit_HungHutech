let bonjour;
let published;

function start(port) {
  try {
    try {
      // Try 'bonjour' (returns a creator function)
      const creator = require('bonjour');
      bonjour = creator();
    } catch (e1) {
      // Fallback to 'bonjour-service' (class-style)
      try {
        const Bonjour = require('bonjour-service');
        bonjour = new Bonjour();
      } catch (e2) {
        console.warn('[discovery] bonjour modules not available:', e2.message);
        return;
      }
    }
    published = bonjour.publish({
      name: 'HungHutech API',
      type: 'hunghutech', // results in _hunghutech._tcp
      protocol: 'tcp',
      port,
      txt: { path: '/api' },
    });
    published.on('up', () => console.log('[discovery] service advertised on _hunghutech._tcp:', port));
  } catch (e) {
    console.warn('[discovery] bonjour-service not available or failed to start:', e.message);
  }
}

function stop() {
  try {
    if (published) published.stop();
    if (bonjour) bonjour.destroy();
  } catch (_) {}
}

module.exports = { start, stop };
