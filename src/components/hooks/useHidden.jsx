import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook to manage hidden relationships.
 * @param {string} entityName - "HiddenCreator" or "HiddenBrand"
 * @param {string} hiderId - The ID of the current profile (brand or creator)
 */
export function useHidden(entityName, hiderId) {
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [hiddenRows, setHiddenRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!hiderId) return;
    loadHidden();
  }, [hiderId]);

  const loadHidden = async () => {
    const rows = await base44.entities[entityName].filter({ hider_id: hiderId });
    setHiddenRows(rows);
    setHiddenIds(new Set(rows.map(r => r.target_id)));
    setLoaded(true);
  };

  const toggleHide = useCallback(async (targetId) => {
    const existing = hiddenRows.find(r => r.target_id === targetId);
    if (existing) {
      // Unhide
      await base44.entities[entityName].delete(existing.id);
      setHiddenRows(prev => prev.filter(r => r.id !== existing.id));
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } else {
      // Hide — idempotent check
      const record = await base44.entities[entityName].create({
        hider_id: hiderId,
        target_id: targetId,
      });
      setHiddenRows(prev => [...prev, record]);
      setHiddenIds(prev => new Set(prev).add(targetId));
    }
  }, [hiddenRows, hiderId, entityName]);

  const isHidden = useCallback((targetId) => hiddenIds.has(targetId), [hiddenIds]);

  return { hiddenIds, loaded, toggleHide, isHidden };
}