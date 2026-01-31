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
 * Carrega entidades relacionadas em batch
 */
export const loadRelatedEntities = async (base44, entityName, ids) => {
  if (!ids || ids.length === 0) return {};
  
  const uniqueIds = [...new Set(ids)];
  const results = await Promise.all(
    uniqueIds.map(id => base44.entities[entityName].filter({ id }))
  );
  
  return arrayToMap(results.flat());
};