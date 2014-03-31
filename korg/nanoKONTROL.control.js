loadAPI(1);

host.defineController("Korg", "nanoKONTROL", "1.0", "E74ABCE1-7BA8-4526-A769-25A7E1F8212F");
host.defineMidiPorts(1, 1);
var ECHO_ID = "12";
host.defineSysexDiscovery("F0 42 50 00" + ECHO_ID + "F7", "F0 42 50 01 ?? " + ECHO_ID + " 04 01 00 00 ?? ?? ?? ?? F7");
host.addDeviceNameBasedDiscoveryPair(["nanoKONTROL"], ["nanoKONTROL"]);

var SYSEX_HEADER = "F0 42 40 00 01 04 00";

var CC =
{
	LOOP : 49,
	STOP : 46,
	PLAY : 45,
	REC : 44,
	REW : 47,
	FF : 48,
	SLIDER1 : 2,
	SLIDER5 : 6,
	SLIDER6 : 8,
	SLIDER7 : 9,
	SLIDER8 : 12,
	SLIDER9 : 13,
	KNOB1 : 14,
	KNOB9 : 22,
	UPPER_BUTTON1 : 23,
	UPPER_BUTTON8 : 30,
	LOWER_BUTTON1 : 33,
	LOWER_BUTTON8 : 40,
	TOGGLE_VIEW : 31,
	TOGGLE_MODE_PAGE : 41,
	PREV_PARAMETER_PAGE: 50,
	NEXT_PARAMETER_PAGE: 51
};

var paramPage = 0;
var pagenames = [];

var isPlay = false;

function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
	// //////////////////////////////////////// host sections
	transport = host.createTransportSection();
	application = host.createApplicationSection();
	trackBank = host.createTrackBankSection(8, 1, 0);
	cursorTrack = host.createCursorTrackSection(2, 0);
	cursorDevice = host.createCursorDeviceSection(8);
	masterTrack = host.createMasterTrackSection(0);
	// ////////////////////////////////////////////////

	masterTrack.getVolume().setIndication(true);

	transport.addIsPlayingObserver(function(on)
	{
		isPlay = on;
	});

	cursorDevice.addPageNamesObserver(function(names, rest) {
		println('Page Names : ' + arguments.length);
	  totalPages = arguments.length;
      pagenames = arguments;
	});

	cursorDevice.addSelectedPageObserver(0, function(page) {
		// Page index, 0 based
		paramPage = page;
	});
   
	cursorDevice.addNextParameterPageEnabledObserver(function(res) {
		//println('Next param page enabled : ' + res);
	});
	cursorDevice.addPreviousParameterPageEnabledObserver(function(res) {
		//println('Prev param page enabled : ' + res);
	});

	primaryInstrument = cursorTrack.getPrimaryInstrument();
	activePage.updateIndications();
	sendSysex(SYSEX_HEADER + "00 00 01 F7"); // Enter native mode
	// sendSysex(SYSEX_HEADER + "1F 10 00 F7"); //sysex dump request
}

function exit()
{
	sendSysex(SYSEX_HEADER + "00 00 00 F7"); // Leave native mode
}

function onMidi(status, data1, data2)
{
	var cc = data1;
	var val = data2;
	// printMidi(status, cc, val);

	if (status == 176)
	{
		if (withinRange(data1, CC.SLIDER1, CC.SLIDER5))
		{
			var index = data1 - CC.SLIDER1;
			activePage.onSlider(index, val);
			// trackBank.getTrack(index).getVolume().set(data2, 128);
		}

		else if (withinRange(data1, CC.SLIDER6, CC.SLIDER7))
		{
			var index = data1 - (CC.SLIDER1) - 1;
			activePage.onSlider(index, val);
		}
		else if (cc == CC.SLIDER8)
		{
			var index = 7;
			activePage.onSlider(index, val);
		}
		else if (cc == CC.SLIDER9)
		{
			masterTrack.getVolume().set(data2, 128);
		}

		else if (withinRange(data1, CC.KNOB1, CC.KNOB1 + 7))
		{
			var index = data1 - CC.KNOB1;
			activePage.onKnob(index, val);
		}
		else if (cc == CC.KNOB9)
		{
			// var tempo = Math.round((val * 0.5)+10);
			// transport.getTempo().set(val+30, 500);
		}

		// These are setup to be controlled by toggle buttons which alternately send 0 and 127
		// so don't want the val > 0 test or you have to press each button twice
		if (withinRange(data1, CC.UPPER_BUTTON1, CC.UPPER_BUTTON8))
		{
			var index = data1 - CC.UPPER_BUTTON1;
			trackBank.getTrack(index).getMute().toggle();
		}
		else if (withinRange(data1, CC.LOWER_BUTTON1, CC.LOWER_BUTTON8))
		{
			var index = data1 - CC.LOWER_BUTTON1;
			trackBank.getTrack(index).getArm().toggle();
		}
			
		if (val > 0) // deal with button presses here
		{

			switch (data1)
			{
				case CC.TOGGLE_MODE_PAGE:
					switchPage();
					break;

				case CC.TOGGLE_VIEW:
					application.nextPerspective();
					break;

				case CC.NEXT_PARAMETER_PAGE:
					if(paramPage == totalPages - 1) {
						cursorDevice.setParameterPage(0);
					} else {
						cursorDevice.nextParameterPage();
					}
					break;
					
				case CC.PREV_PARAMETER_PAGE:
					if(paramPage == 0) {
						cursorDevice.setParameterPage(totalPages - 1);
					} else {
						cursorDevice.previousParameterPage();
					}
					break;
					
				case CC.PLAY:
					isPlay ? transport.restart() : transport.play();
					break;

				case CC.STOP:
					transport.stop();
					break;

				case CC.REC:
					transport.record();
					break;

				case CC.REW:
					transport.rewind();
					break;

				case CC.FF:
					transport.fastForward();
					break;

				case CC.LOOP:
					transport.toggleLoop();
					break;
			}
		}
	}
}

function onSysex(data)
{
	// printSysex(data);
}

function Page()
{
}

// Page.prototype.onKnob = function(index, val)
// {
// }
// Page.prototype.onSlider = function(index, val)
// {
// }
devicePage = new Page();
devicePage.onKnob = function(index, val)
{
	primaryInstrument.getMacro(index).getAmount().set(val, 128);
}
devicePage.onSlider = function(index, val)
{
	cursorDevice.getParameter(index).set(val, 128);
}
devicePage.updateIndications = function()
{
	for ( var p = 0; p < 8; p++)
	{
		macro = primaryInstrument.getMacro(p).getAmount();
		parameter = cursorDevice.getParameter(p);
		track = trackBank.getTrack(p);
		parameter.setIndication(true);
		macro.setIndication(true);
		track.getVolume().setIndication(false);
		track.getPan().setIndication(false);
	}
}

devicePage.sButton = function(index)
{
   primaryDevice.setParameterPage(index);
   if (index < pagenames.length)
   {
      host.showPopupNotification("Page: " + pagenames[index]);
   }
};

mixerPage = new Page();
mixerPage.onKnob = function(index, val)
{
	trackBank.getTrack(index).getPan().set(val, 128);
}
mixerPage.onSlider = function(index, val)
{
	trackBank.getTrack(index).getVolume().set(val, 128);
}
mixerPage.updateIndications = function()
{
	for ( var p = 0; p < 8; p++)
	{
		macro = primaryInstrument.getMacro(p).getAmount();
		parameter = cursorDevice.getParameter(p);
		track = trackBank.getTrack(p);
		track.getVolume().setIndication(true);
		track.getPan().setIndication(true);
		parameter.setIndication(false);
		macro.setIndication(false);
	}
}
// seqPage = new Page();
// seqPage.onKnob = function(index, val)
// {
//
// }
// seqPage.onSlider = function(index, val)
// {
// }
// seqPage.updateIndications = function()
// {
// for ( var p = 0; p < 8; p++)
// {
// macro = primaryInstrument.getMacro(p).getAmount();
// parameter = cursorDevice.getParameter(p);
// track = trackBank.getTrack(p);
// track.getVolume().setIndication(false);
// track.getPan().setIndication(false);
// parameter.setIndication(false);
// macro.setIndication(false);
// }
// }
var activePage = devicePage;

function switchPage()
{
	switch (activePage)
	{
		case devicePage:
			activePage = mixerPage;
			sendChannelController(0, CC.TOGGLE_MODE_PAGE, 0);
			break;
		case mixerPage:
			activePage = devicePage;
			sendChannelController(0, CC.TOGGLE_MODE_PAGE, 127);
			break;
	}
	activePage.updateIndications();
}