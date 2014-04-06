bitwig-control-scripts
======================

Modified versions of Bitwig controller scripts. Starting with nanoKontrol v1

nanoKONTROL v1
--------------

Currently 2 scenes are setup. The first scene is the same as the default BitWig configuration (see the nanoKONTROL.html file in the resources/controllers/korg directory in your BitWig installation)

The second scene is almost identical except the right hand buttons (B9 / B18) change the current parameter page for the selected device.

M-Audio - Oxygen 25
-------------------

Following controls are implemented: 

- transport-buttons
- track selection
- slider sets channel-volume
- knobs are freely mappable

Installation
------------

Download the appropriate javascript file (e.g. korg/nanoKONTROL.control.js) and copy it into the bitwig controller scripts directory : resources/controllers/korg.

Remember to make a backup of the original script just in case :)

To setup your nanoKONTROL so that it sends the expected CCs you should load the nanoKONTROL.nktrl\_set into the Korg Kontrol Editor and transmit the scene set to your nanoKONTROL.
