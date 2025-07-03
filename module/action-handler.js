// System Module Imports
import {VALID_ACTOR_TYPES} from './constants.js'
import { Utils } from './utils.js'

export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        dnd4e = game.dnd4e
        i18n = (str) => coreModule.api.Utils.i18n(str)
        version = this.dnd4e.tokenBarHooks.version

        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */
        async buildSystemActions (groupIds) {
            // Set actor and token variables
            this.actors = (!this.actor) ? this.#getActors() : [this.actor]
            this.actorType = this.actor?.type

            // Set items variable
            if (this.actor) {
                let items = this.actor.items
                items = coreModule.api.Utils.sortItemsByName(items)
                this.items = items
            }

            // Settings
            this.displayUnequipped = Utils.getSetting('displayUnequipped')
            this.hideUsed = Utils.getSetting("hideUsedPowers")
            this.powerColours =  Utils.getSetting("forcePowerColours")
            this.abbreviateSkills = Utils.getSetting("abbreviateSkills")

            if (VALID_ACTOR_TYPES.includes(this.actorType)) {
                await this.#buildCharacterActions()
            } else if (!this.actor) {
                await this.#buildMultipleTokenActions()
            }
        }

        /**
         * Get actors
         * @private
         * @returns {object}
         */
        #getActors () {
            const tokens = coreModule.api.Utils.getControlledTokens()
            const actors = tokens?.filter(token => token.actor).map((token) => token.actor)
            if (actors.every((actor) => VALID_ACTOR_TYPES.includes(actor.type))) {
                return actors
            } else {
                return []
            }
        }

        /**
         * Build character actions
         * @private
         */
        async #buildCharacterActions () {
            this.#buildAbilities()
            this.#buildSkills()
            this.#buildUtility ()
            await Promise.all([
                this.#buildPowers(),
                this.#buildInventory(),
                this.#buildFeatures(),
                this.#buildConditions(),
                this.#buildEffects(),
            ])
        }

        /**
         * Build multiple token actions
         * @private
         * @returns {object}
         */
        async #buildMultipleTokenActions () {
            this.#buildAbilities()
            this.#buildSkills()
            this.#buildUtility()
            await Promise.all([
                this.#buildConditions()
            ])
        }

        /**
         * Build abilities
         * @private
         */
        #buildAbilities() {
            // Get abilities
            const abilities = (!this.actor) ?this.dnd4e.config.abilities : this.actor.system.abilities

            // Exit if no abilities exist
            if (abilities.length === 0) return

            // Get actions
            const actions = Object.entries(abilities)
                .filter((ability) => abilities[ability[0]].value !== 0)
                .map(([abilityId, ability]) => {
                    const id = abilityId
                    const name = this.abbreviateSkills ? abilityId : this.dnd4e.config.abilities[abilityId]
                    const encodedValue = ["ability", abilityId].join(this.delimiter)
                    const mod = ability?.mod ?? ''
                    const info1 = (this.actor) ? { text: coreModule.api.Utils.getModifier(mod) } : null
                    return {
                        id,
                        name,
                        encodedValue,
                        info1,
                        tooltip: ''
                    }
                })

            // Create group data
            const groupData = { id: 'abilities', type: 'system' }

            // Add actions to action list
            this.addActions(actions, groupData)
        }

        /**
         * Build skills.  Annoyingly this is just different enough from abilities to be a PITA and want a duplicate code block
         * @private
         */
        #buildSkills() {
            // Get abilities
            const skills = (!this.actor) ? this.dnd4e.config.skills : this.actor.system.skills

            // Exit if no abilities exist
            if (skills.length === 0) return

            // Get actions
            const actions = Object.entries(skills)
                .map(([skillId, skill]) => {
                    const id = skillId
                    const name = this.abbreviateSkills ? skillId : this.dnd4e.config.skills[skillId]
                    const encodedValue = ["skill", skillId].join(this.delimiter)
                    const mod = skill.total ?? ''
                    const tooltip = this.i18n(this.dnd4e.config.trainingLevels[skill.training])
                    const icon1 = this.#getTrainingIcon(skill.training, skill.tooltip) ?? ''
                    const info1 = (this.actor) ? { text: coreModule.api.Utils.getModifier(mod) } : null
                    return {
                        id,
                        name,
                        encodedValue,
                        info1,
                        icon1,
                        tooltip
                    }
                })

            // Create group data
            const groupData = { id: 'skills', type: 'system' }

            // Add actions to action list
            this.addActions(actions, groupData)
        }

        #getTrainingIcon(level, hover) {
            const icons = {
                0: ``,
                5: `<i class="fas fa-check" title="${hover}"></i>`,
                8: `<i class="fas fa-check-double" title="${hover}"></i>`
            };
            return icons[level];
        }


        async #buildPowers() {
            try {
                return this.#buildPowersV3()
            }
            catch (e) {
                this.#logError(e, null)
            }

        }

        async #buildPowersV3() {
            const actionType = "power"
            const groupings = this.dnd4e.tokenBarHooks.powersBySheetGroup(this.actor)

            const groupDataFutures = Object.entries(groupings).map(async (e) => {
                const groupId = e[0]+"Power"
                const groupData = {id: groupId, type: 'system'}
                let powerList = e[1].items
                if (this.hideUsed) {
                    powerList = powerList.filter((power) => {
                        return power.system.useType === "recharge" || this.dnd4e.tokenBarHooks.isPowerAvailable(this.actor, power)
                    })
                }
                else {
                    // need to poke this to force the available boolean correctly for recharge powers
                    powerList.forEach((power) => {
                        this.dnd4e.tokenBarHooks.isPowerAvailable(this.actor, power)
                    })
                }

                const actionFutures = powerList.map(async (power) => {
                    const action = await this.#buildActionFromItem(actionType, power)
                    if (this.powerColours) {
                        action.cssClass = `force-ability-usage--${power.system.useType}`
                    }
                    return action
                })

                const actions = await Promise.all(actionFutures)
                return {
                    groupData,
                    actions
                }
            });
            const groupInfo = await Promise.all(groupDataFutures)
            groupInfo.forEach(gi => this.addActions(gi.actions, gi.groupData))
        }

        /**
         * Build inventory
         * @private
         */
        async #buildInventory () {
            const inventoryTypes = this.dnd4e.config.inventoryTypes;
            const filter = ((itemData) => itemData.system.equipped || this.displayUnequipped)
            return this.#buildBasicGroupsOfActionsByType(inventoryTypes, 'item', filter)
        }

        /**
         * Build actor features
         * @private
         */
        async #buildFeatures() {
            //const featureTypes = this.dnd4e.config.featureTypes;
            //return this.#buildBasicGroupsOfActionsByType(featureTypes, 'item', undefined)
            try {
                return this.#buildFeaturesV2()
            }
            catch (e) {
                this.#logError(e, null)
            }
        }

        async #buildFeaturesV2() {
            const actionType = "feature"
            const groupings = this.dnd4e.config.featureTypes;
			
			for (const [k,v] of Object.entries(groupings)){
				v.items = [];
			}
			
			for (const itemData of this.actor.items) {
				if(itemData.type == "feature"){
					groupings[itemData.system.featureType].items.push(itemData)
				}
			}
			
            const groupDataFutures = Object.entries(groupings).map(async (e) => {
                const groupId = e[0]+"Feature"
                const groupData = {id: groupId, type: 'system'}
                let featureList = e[1].items
				
                const actionFutures = featureList.map(async (feature) => {
                    const action = await this.#buildActionFromItem(actionType, feature)
                    return action
                })

                const actions = await Promise.all(actionFutures)
                return {
                    groupData,
                    actions
                }
            });
            const groupInfo = await Promise.all(groupDataFutures)
            groupInfo.forEach(gi => this.addActions(gi.actions, gi.groupData))
        }

        /**
         * Filter the singular actors item collection down to just ones in a type object and then turn them into groups of actions by item type.
         * @param {object} itemTypeLookup The object whose keys specify valid item types to process
         * @param {string} actionTypeId The type of action that will be set in the encoded value
         * @param optFilter A function that takes an item data object and specifies if it should be included in the collection.
         * @private
         */
        async #buildBasicGroupsOfActionsByType(itemTypeLookup, actionTypeId, optFilter) {
            try {
                const mapByItemType = new Map()
                const filter = optFilter ?? ((itemData) => true)

                for (const itemData of this.actor.items) {
                    const type = itemData.type
                    if (itemTypeLookup[type] && filter(itemData)) {
                        const typeMap = mapByItemType.get(type) ?? new Map()
                        typeMap.set(itemData.id, itemData)
                        mapByItemType.set(type, typeMap)
                    }
                }

                for (const [type, typeMap] of mapByItemType) {
                    const groupId = type
                    const groupData = {id: groupId, type: 'system'}

                    // Get actions
                    const actions =  await Promise.all([...typeMap].map(
                        async ([itemId, itemData]) => this.#buildActionFromItem(actionTypeId, itemData))
                    )

                    this.addActions(actions, groupData)
                }
            }
            catch (e) {
                this.#logError(e, null)
            }
        }

        async #buildConditions () {
            if (this.tokens?.length === 0) return

            const actionType = 'condition'

            // Get conditions
            const conditions = CONFIG.statusEffects.filter((condition) => condition.id !== '')

            // Exit if no conditions exist
            if (conditions.length === 0) return

            // Get actions
            const actions = await Promise.all(conditions.map(async (condition) => {
                const id = condition.id
                const name =this.i18n(condition.label) ?? condition.name
                const encodedValue = [actionType, id].join(this.delimiter)
                const active = this.actors.every((actor) => {
                    if (game.version.startsWith('11')) {
                        return actor.effects.some(effect => effect.statuses.some(status => status === id) && !effect?.disabled)
                    } else {
                        // V10
                        return actor.effects.some(effect => effect.flags?.core?.statusId === id && !effect?.disabled)
                    }
                })
                    ? ' active'
                    : ''
                const cssClass = `toggle${active}`
                const img = coreModule.api.Utils.getImage(condition)
                const tooltip = await this.#getTooltip(this.i18n(condition.description))
                return {
                    id,
                    name,
                    encodedValue,
                    img,
                    cssClass,
                    tooltip
                }
            }))

            // Create group data
            const groupData = { id: 'conditions', type: 'system' }

            // Add actions to HUD
            this.addActions(actions, groupData)
        }

        /**
         * Build effects
         * @private
         */
        async #buildEffects () {
            const actionType = 'effect'

            // Get effects
            const effects = new Map()
            for (const effect of this.actor.allApplicableEffects()) {
                effects.set(effect.id, effect)
            }

            // Exit if no effects exist
            if (effects.size === 0) return

            // Map passive and temporary effects to new maps
            const passiveEffects = new Map()
            const temporaryEffects = new Map()

            // Iterate effects and add to a map based on the isTemporary value
            for (const [effectId, effect] of effects.entries()) {
                const isTemporary = effect.isTemporary
                if (isTemporary) {
                    temporaryEffects.set(effectId, effect)
                } else {
                    passiveEffects.set(effectId, effect)
                }
            }

            await Promise.all([
                // Build passive effects
                this.#buildActions(passiveEffects, { id: 'passive-effects', type: 'system' }, actionType),
                // Build temporary effects
                this.#buildActions(temporaryEffects, { id: 'temporary-effects', type: 'system' }, actionType)
            ])
        }

        /**
         * Build actions
         * @private
         * @param {object} items
         * @param {object} groupData
         * @param {string} actionType
         */
        async #buildActions (items, groupData, actionType = 'item') {
            // Exit if there are no items
            if (items.size === 0) return

            // Exit if there is no groupId
            const groupId = (typeof groupData === 'string' ? groupData : groupData?.id)
            if (!groupId) return

            // Get actions
            const actions = await Promise.all([...items].map(async item => await this.#buildActionFromItem(actionType, item[1])))

            // Add actions to action list
            this.addActions(actions, groupData)
        }


        /**
         * Get action
         * @private
         * @param {string} actionType
         * @param {object} entity
         * @returns {object}
         */
        async #buildActionFromItem (actionType, entity) {
            const id = entity.id ?? entity._id
            let name = entity?.name ?? entity?.label

            let cssClass = ''
            if (Object.hasOwn(entity, 'disabled')) {
                const active = (!entity.disabled) ? ' active' : ''
                cssClass = `toggle${active}`
            }
            const encodedValue = [actionType, id].join(this.delimiter)
            const img = coreModule.api.Utils.getImage(entity)
            const tooltip = await this.#getTooltip(entity)
            return {
                id,
                name,
                encodedValue,
                cssClass,
                img,
                tooltip
            }
        }

        async #getTooltip (tooltipData) {
            if (!tooltipData) return ''
            if (this.tooltipsSetting === 'none') return ''
            if (typeof tooltipData === 'string') return tooltipData

            const name = coreModule.api.Utils.i18n(tooltipData.name)

            if (this.tooltipsSetting === 'nameOnly') return name

            if (!this.actor) return ''
            if (!tooltipData.type) return ''

            if (typeof tooltipData.getChatData == 'function') {
                try {
                    const html = await this.dnd4e.tokenBarHooks.generateItemTooltip(this.actor, tooltipData)
                    const finalhtml = this.#buildHorribleNestedDiv(html, ["tah-4etooltip"])
                    return finalhtml
                }
                catch (e) {
                    this.#logError(e, tooltipData)
                    return ''
                }
            }
            else if (tooltipData.description) {
                return this.#buildHorribleNestedDiv(tooltipData.description, ["tah-4etooltip"])
            }
            else {
                return ''
            }
        }

        #buildHorribleNestedDiv(html, divClasses) {
            const divHeads = divClasses.map(d => `<div class="${d}">`).join()
            const divTails = divClasses.map(_ => `</div>`).join()
            return `${divHeads}${html}${divTails}`
        }

        #logError(error, context) {
            coreModule.api.Logger.error(error)
            if (context) {
                coreModule.api.Logger.error(JSON.stringify(context))
            }
        }

        /**
         * Build the utility buttons
         * @private
         */
        #buildUtility () {
            // Exit if every actor is not the character type
            if (this.actors.length === 0) return
            const actionType = 'utility'

            const encode = (str) => [actionType, str].join(this.delimiter)

            const saves = [
                { id : "save", name: this.i18n("DND4E.SavingThrow"), encodedValue: encode("save") },
                { id : "saveDialog", name: this.i18n("Show Save Dialog"), encodedValue: encode("saveDialog") },
                { id : "deathSave", name: this.i18n("DND4E.DeathSavingThrow"), encodedValue: encode("deathSave") }
            ]
            this.addActions(saves, { id: 'saves', type: 'system' })

            this.#buildInitative()
            // so long as there is an action point available - as I houserule that you can use more than 1 an encounter
            const shouldShowActionPoint = !this.hideUsed || this.actor?.system.actionpoints?.value > 0
            if (shouldShowActionPoint) {
                const ap = [
                    { id : "actionPoint", name: this.i18n("DND4E.ActionPointUse"), encodedValue: encode("actionPoint") },
                ]
                this.addActions(ap, { id: 'combat', type: 'system' })
            }

            // either should not be hiding used powers, or should not have used 2nd wind
            const healing = [
                { id : "heal", name: this.i18n("DND4E.Healing"), encodedValue: encode("healDialog") }
            ]

            const shouldShowSecondWind = !this.hideUsed || !this.actor?.system.details?.secondwind
            if (shouldShowSecondWind) {
                healing.push( { id : "secondWind", name: this.i18n("DND4E.SecondWind"), encodedValue: encode("secondWind") })
            }
            this.addActions(healing, { id: 'healing', type: 'system' })
        }

        #buildInitative() {
            let initiativeAction = {
                id: "rollInitiative",
                name: this.i18n("tokenActionHud.dnd4e.rollInitiative"),
                encodedValue: ["utility", "initiative"].join(this.delimiter),
            };
            const currentInitiative = this.#getTokenInitative()
            if (currentInitiative) initiativeAction.info1 = { text: currentInitiative };
            initiativeAction.cssClass = currentInitiative ? "active" : "";
            this.addActions([initiativeAction], { id: 'combat', type: 'system' })
        }

        #getTokenInitative() {
            if (this.token && game.combat) {
                return game.combat.combatants?.find((c) => c.tokenId === this.token.id)?.initiative;
            }
            return undefined
        }
    }
})
