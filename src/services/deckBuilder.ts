/**
 * Интеллектуальный генератор колод Clash Royale.
 * Основа — база топовых колод (data/decks.json) + роли карт (data/cards.json).
 */
export {
  buildDeckFromCore,
  buildMultipleDecks,
  deckSynergyScore,
  synergyNotes,
  detectArchetype,
  type BuildResult,
  type Archetype,
} from "./deckBuilder/index";
