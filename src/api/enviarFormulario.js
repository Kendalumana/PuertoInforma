// OPTIONS despierta el servidor sin crear cuentas ni repetir operaciones.
export async function enviarFormulario(client, path, data, onStatus) {
  onStatus('Estamos conectando con PuertoInforma. Si el servidor está en reposo, puede tardar hasta 4 minutos. Mantené esta página abierta; tus datos todavía no se han enviado.');
  try {
    await client.options(path, { timeout: 240000 });
  } catch {
    const error = new Error('El servidor no respondió a tiempo. Tus datos no se enviaron. Revisá tu conexión e intentá nuevamente.');
    error.esEsperaServidor = true;
    throw error;
  }
  onStatus('Servidor listo. Estamos procesando tu solicitud…');
  return client.post(path, data);
}
