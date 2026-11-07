import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enviarFormulario } from './enviarFormulario.js';

test('espera al servidor antes de enviar una sola vez', async () => {
  const events = [];
  let ready;
  const client = {
    options: (_, config) => { assert.equal(config.timeout, 120000); return new Promise(resolve => { ready = resolve; }); },
    post: async () => { events.push('post'); return { data: 'ok' }; },
  };
  const pending = enviarFormulario(client, '/usuario/registro', {}, message => events.push(message));
  assert.equal(events.includes('post'), false);
  ready();
  assert.deepEqual(await pending, { data: 'ok' });
  assert.equal(events.filter(event => event === 'post').length, 1);
});

test('no envía datos si el servidor no despierta', async () => {
  let sent = false;
  const client = { options: async () => { throw new Error('timeout'); }, post: async () => { sent = true; } };
  await assert.rejects(enviarFormulario(client, '/usuario/login', {}, () => {}), /servidor/);
  assert.equal(sent, false);
});
