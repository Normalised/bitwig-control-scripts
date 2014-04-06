loadAPI(1);

host.defineController("M-Audio", "Oxygen 25", "1.0", "2B6AB540-B75A-11E3-A5E2-0800200C9A66");

host.defineMidiPorts(1, 1);

host.addDeviceNameBasedDiscoveryPair(["Oxygen 25"], ["Oxygen 25"]);

// Search after different naming-schemes for autodetection
for ( var i = 1; i < 9; i++)
{
	var name = i.toString() + "- Oxygen 25";
	host.addDeviceNameBasedDiscoveryPair([name], [name]);
	host.addDeviceNameBasedDiscoveryPair(["Oxygen 25 MIDI " + i.toString()], ["Oxygen 25 MIDI " + i.toString()]);
}

var CC =
{
	PREV_TRACK : 110,
	NEXT_TRACK : 111,
	LOOP       : 113,
	REWIND     : 114,
	FORWARD    : 115,
	STOP       : 116,
	PLAY       : 117,
	RECORD     : 118,
	SLIDER     : 7,
};

var LOWEST_CC = 2;
var HIGHEST_CC = CC.PREV_TRACK - 1;

function init()
{
	transport = host.createTransport();

	// Register callbacks for midi- and sysex-events
	host.getMidiInPort(0).setMidiCallback(onMidi);

	noteIn = host.getMidiInPort(0).createNoteInput("Oxygen 25 Keyboard");

	// Make CCs 0-109 freely mappable
	userControls = host.createUserControls(HIGHEST_CC);

	for(var i=LOWEST_CC; i<=HIGHEST_CC; i++)
	{
		userControls.getControl(i - LOWEST_CC).setLabel("CC" + i);
	}

	// The cursor track view follows the track selection in the application GUI
	cursorTrack = host.createCursorTrack(4, 4);
}

function onMidi(status, data1, data2)
{
	//printMidi(status, data1, data2);

	if (isChannelController(status))
	{
		// Handle transport-buttons and trackselection
		if ((data1 >= CC.PREV_TRACK && data1 <= CC.RECORD && data1 != 112) && data2 > 0)
		{
			switch(data1) {
				case CC.PREV_TRACK:
				cursorTrack.selectPrevious();
				break;
			case CC.NEXT_TRACK:
				cursorTrack.selectNext();
				break;
			case CC.LOOP:
				transport.toggleLoop();
				break;
			case CC.REWIND:
				transport.rewind();
				break;
			case CC.FORWARD:
				transport.fastForward();
				break;
			case CC.STOP:
				transport.stop();
				break;
			case CC.PLAY:
				transport.play();
				break;
			case CC.RECORD:
				cursorTrack.getArm().toggle();
				transport.record();
				break;
			}
		}
		else
		{
			// Handle slider for trackvolume
			if (data1 == CC.SLIDER)
			{
				cursorTrack.getVolume().set(data2, 128);
			}
			else
			{
				// Handle CC 02 - 109
				if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC)
				{
					var index = data1 - LOWEST_CC;
					userControls.getControl(index).set(data2, 128);
				}
			}
		}
	}
}

function exit()
{
}