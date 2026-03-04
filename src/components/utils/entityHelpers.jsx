/**
 * Helpers para manipulação de entidades
 */

/**
 * Converte array de entidades em mapa por ID
 */
export const arrayToMap = (array, key = 'id') => {
  if (!Array.isArray(array)) return {};
  return array.reduce((map, item) => {
    if (item && item[key]) {
      map[item[key]] = item;
    }
    return map;
  }, {});
};

/**
 * Converte múltiplos arrays de entidades em mapas
 */
export const arraysToMaps = (arrays) => {
  return Object.keys(arrays).reduce((maps, key) => {
    maps[key] = arrayToMap(arrays[key]);
    return maps;
  }, {});
};

/**
 * Carrega entidades relacionadas em batch usando $in (1 query por entity).
 * Faz chunking de 100 IDs por request para segurança.
 */
export const loadRelatedEntities = async (base44, entityName, ids) => {
  if (!ids || ids.length === 0) return {};
  
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const CHUNK_SIZE = 100;
  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map(chunk => base44.entities[entityName].filter({ id: { $in: chunk } }))
  );
  
  return arrayToMap(results.flat());
};