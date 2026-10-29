/**
 * Deja el texto de un plato del menú en el formato que mejor resuelve `POST /asistente/log-inteligente`:
 * sin paréntesis (sus comas parten los ítems y los ingredientes se contarían dos veces) ni punto final.
 */
export function textoParaRegistro(texto: string): string {
  return texto
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;])/g, '$1')
    .replace(/[.\s]+$/, '')
    .trim();
}
