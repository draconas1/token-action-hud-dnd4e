# Token Action HUD for DnD 4E

Integration for the [DnD 4E](https://foundryvtt.com/packages/dnd4e) System to use the ever popular [Token Action HUD](https://foundryvtt.com/packages/token-action-hud-core)


# Installation

Versions depend on what version of **Token Action Hud** and what version of **D&D 4E system** you are running.  They are not cross compatible!

There are different versions of Token Action Hud 1.5 and 2.0.  
All future development is for TAH 2.0 and 1.5 is considered legacy and no longer actively supported or developed.

There is a different version for D&D 4E System 0.5.x and for 0.6.x
All future development is for D&D 4E 0.6+ and the 0.5 system branch is considered legacy and no longer actively supported or developed.

At time of writing D&D 4E does not support V13, so the highest version of Token Action Hud it works with is 2.0.11

## If you are using D&D 4E 0.6+ or Later (You must be using TAH 2.0 or later)

1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. In the Manifest URL field, paste: `https://github.com/draconas1/token-action-hud-dnd4e/releases/latest/download/module.json`
4. Click **Install** next to the pasted Manifest URL

## If you are using Token Action Hud Core 2.0+ & D&D 4E system 0.5.9 or lower

1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. In the Manifest URL field, paste: `https://github.com/draconas1/token-action-hud-dnd4e/releases/latest/2.0.4/module.json`
4. Click **Install** next to the pasted Manifest URL

## If you are using Token Action Hud Core 1.5

1. On Foundry VTT's **Configuration and Setup** screen, go to **Add-on Modules**
2. Click **Install Module**
3. In the Manifest URL field, paste: `https://github.com/draconas1/token-action-hud-dnd4e/releases/download/1.0/module.json`
4. Click **Install** next to the pasted Manifest URL

# Required Modules

## Token Action HUD Core
Token Action HUD for D&D 4E requires the [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core) module.

## socketlib
Token Action HUD Core requires the [socketlib](https://foundryvtt.com/packages/socketlib) library module.

# Recommended Modules
Token Action HUD uses the [Color Picker](https://foundryvtt.com/packages/color-picker) library module for its color picker settings.

# Support
For a guide on using Token Action HUD, go to: [How to Use Token Action HUD](https://github.com/Larkinabout/fvtt-token-action-hud-core/wiki/How-to-Use-Token-Action-HUD)

Pull requests are welcome. Please include a reason for the request or create an issue before starting one.

# Acknowledgements
Thank you to the Community Helpers on Foundry's Discord who provide tireless support for people seeking help with the HUD, to the D&D 4E system maintainers and to Larkinabout for all their help maintaining TAH and answering questions on it.

# License

This Foundry VTT module is licensed under GNU AFFERO GENERAL PUBLIC LICENSE (as it makes use of D&D 4E System under that license) and this work is licensed under [Foundry Virtual Tabletop EULA - Limited License Agreement for module development](https://foundryvtt.com/article/license/).
