/**
 * Module-based constants
 */
export const MODULE = {
    ID: 'token-action-hud-dnd4e'
}

/**
 * Core module
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
}

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '2.0'

export const VALID_ACTOR_TYPES = ["Player Character", "NPC"]

/**
 * Groups
 */
export const STATIC_GROUPS = {
    abilities: { id: 'abilities', name: 'DND4E.Ability', type: 'system' },
    skills: { id: 'skills', name: 'DND4E.Skills', type: 'system' },

    conditions: { id: 'conditions', name: 'tokenActionHud.dnd4e.conditions', type: 'system' },
    passiveEffects: { id: 'passive-effects', name: 'tokenActionHud.dnd4e.effectPassive', type: 'system' },
    temporaryEffects: { id: 'temporary-effects', name: 'tokenActionHud.dnd4e.effectTemporary', type: 'system' },

    rests: { id: 'rests', name: 'DND4E.Rests', type: 'system' },
    saves: { id: 'saves', name: 'tokenActionHud.dnd4e.saves', type: 'system' },
    healing: { id: 'healing', name: 'DND4E.Healing', type: 'system' },
    combat: { id: 'combat', name: 'tokenActionHud.combat', type: 'system' },
    token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
    utility: { id: 'utility', name: 'tokenActionHud.utility', type: 'system' },
}