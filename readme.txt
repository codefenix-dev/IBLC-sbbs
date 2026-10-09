InterBBS Last Callers (iblc.js)
Version 0.260611

by Craig Hendricks
codefenix@conchaos.synchro.net

ConstructiveChaos BBS:
  https://conchaos.synchro.net
 telnet://conchaos.synchro.net
    ssh://conchaos.synchro.net



Description:

  This mod interfaces with the Inter-BBS Last Caller data that gets passed 
  through fsxNet (or compatible network data echo). It lists the most recent 
  last callers on participating BBSes, giving the option to list the BBSes
  and call them directly via telnet (telgate).

  It was inspired by the IBBS Last Callers Python mod by xqtr (xq-ilc) for 
  Mystic BBS.



What you should know before installing:

> Important note:

  This version of IBLC uses a slightly different method of keeping 
  track of which messages haven been read. For this reason, if you 
  are upgrading from any version prior to 0.250508, you must delete 
  the following files from your /sbbs/xtrn/iblc path:

  - iblc.lr
  - iblc_bbs.json
  - iblc_users.json

  New files will be generated automatically the next time the
  script runs.

> This mod posts information about your BBS and your callers to other BBSes:
  BBS name, telnet address, operating system, user alias, and user location.
  If you do not want that information posted to other BBSes, then you should
  not use this script.



Instructions:

  Prerequisites:

  First things first: in order for this mod to work, BBS membership in fsxNet
  is required, with the FSX_DAT InterBBS Data echo set up on the system. Find
  the latest fsxNet infopack for setup information.

  This mod also makes use of Digital Distortion Lightbar Menu Library, so
  ensure that dd_lightbar_menu.js exists in the /sbbs/exec/load directory,
  and it is up to date.


  Installation Steps:

  1. Create a new directory named /sbbs/xtrn/iblc and place the iblc.js and
     iblc.ini files in it.

  2. Edit the iblc.ini file and set the messageBase value to the internal
     code you have configured in SCFG for the FSX_DAT echo. On my system,
     this is: FSXNET_FSX_DAT

     Optionally, if your BBS uses a port number for telnet other than the
     standard 23, then specify that number for telnetPort. This is so 
     your BBS address shows up correctly on other BBSes, letting remote
     users be able to reach it.

  3. Add two (2) External Program items:     
     
     a) This first external program item will post callers to the network 
        any time a user logs in. There will NOT be a selectable menu item 
        for it (because you do not want users to be able to select it; it 
        must be ran only once per session during logon).                

        +[|][?]-----------------------------------------------[<  ]+
        |               InterBBS Last Callers (login)              |
        |----------------------------------------------------------|
        | |Name                       InterBBS Last Callers (login)|
        | |Internal Code              IBLCPOST                     |
        | |Start-up Directory         ../xtrn/iblc                 |
        | |Command Line               ?iblc login                  |
        | |Clean-up Command Line                                   |
        | |Execution Cost             None                         |
        | |Access Requirements                                     |
        | |Execution Requirements                                  |
        | |Multiple Concurrent Users  Yes                          |
        | |I/O Method                 FOSSIL or UART               |
        | |Native Executable/Script   No                           |
        | |Use Shell or New Context   No                           |
        | |Modify User Data           No                           |
        | |Execute on Event           Logon, Only   <--Important!  |
        +----------------------------------------------------------+
        
        You must set Execute on Event to "Logon" in order for your last 
        callers to get posted to the network.
        
        +[|][?]-----------------+ 
        | Execute as Event Only |     
        |-----------------------|  <- You must answer "Yes" to this
        | |Yes  <- pick this    |     prompt after choosing "Logon". 
        | |No                   |     
        +-----------------------+  
        
        
             
     b) This second external program item DOES add a selectable menu option 
        for running the InterBBS Last Callers.
        
        +[|][?]-----------------------------------------------[< >]+
        |                InterBBS Last Callers (view)              |
        |----------------------------------------------------------|
        | |Name                       InterBBS Last Callers (view) |
        | |Internal Code              IBLCVIEW                     |
        | |Start-up Directory         ../xtrn/iblc                 |
        | |Command Line               ?iblc                        |
        | |Clean-up Command Line                                   |
        | |Execution Cost             None                         |
        | |Access Requirements                                     |
        | |Execution Requirements                                  |
        | |Multiple Concurrent Users  Yes                          |
        | |I/O Method                 FOSSIL or UART               |
        | |Native Executable/Script   No                           |
        | |Use Shell or New Context   No                           |
        | |Modify User Data           No                           |
        | |Execute on Event           No   <--Optional             |
        +----------------------------------------------------------+

        Optional:
        
        If you'd like to display the InterBBS Last Callers during your
        logon events, set Execute on Event to "Logon".
        
        +[|][?]-----------------+ 
        | Execute as Event Only |     If you do choose "Logon", answer 
        |-----------------------|  <- "No" to this prompt after choosing 
        | |Yes                  |     it, otherwise your users won't be
        | |No   <- pick this    |     able to run it
        +-----------------------+  
        

     This will make it so the caller gets posted during the usual SBBS 
     logonlist routine, and then show the listing to the caller.


  You're done. The script should be ready to go at this point.

  Every time someone logs in, the following information will get posted to 
  FSX_DAT:

  - User Alias ........... Self-explanatory
  - BBS Name ............. As defined in SCFG
  - Current Date ......... Short format as defined in SCFG: MM/DD/YY / DD/MM/YY
  - Current Time ......... 12-hour time format (HH:MMa/p)
  - User Location ........ As entered by the user during new user signup
  - System OS ............ "Windows", "Linux", etc. based on system.platform
  - BBS Telnet Address ... As reported by system.host_name

  The script is designed to obey the same criteria as the regular local 
  logonlist. That is, sysop logins will be hidden if Include Sysop in 
  Statistics is set to "No" under the System Configuration options in SCFG
  (if you call your own BBS often, this is typically good to do).

  The data is rot47 encoded when posted to FSX_DAT.

  Whenever iblc.js is ran (without the "login" parameter), it parses and 
  decodes all "ibbslastcall-data" messages in FSX_DAT and stores the data 
  locally in JSON files named iblc_users.json (up to the last 100 callers) 
  and iblc_bbs.json (cumulative), and then presents the data to the user. 
  It uses the file iblc.lr to keep track of FSX_DAT messages read. You should
  leave these files alone in order for the script to work as expected, and 
  you should never attempt to hand-edit them. If you ever feel the need to 
  "reset" the IBBS last caller data, you may delete all three files, and 
  they will be regenerated using the current data available in FSX_DAT the 
  next time the script runs.

  The mod is designed to span and fill the width and height of the terminal,
  meaning it works in both 80-column and 132-column modes and lists as many
  callers as it takes to fill the screen.

  The user can press B to list the participating BBSes, which shows the number
  of calls and date/time ** of the last call. The user moves the lightbar using
  the up and down arrows, and presses Enter to telnet to the listing of their
  choice. When the telnet session is over, it returns them to the BBS list.



Other Notes:

  It's worth noting this mod does a few things a differently than the Mystic 
  version:

   * This script accounts for all permutations of line breaks, i.e.: CR, LF, 
     and CR-LF, so it should have no problems reading data from other systems, 
     regardless of which convention they are using.

  ** The dates and times in the ibbslastcall messages do not account for 
     timezones or regional formatting, and are instead merely date and
     time strings in the sending BBS's local time and format. As a result, 
     calls from BBSes around the world may look inconsistent and out of order.

     This script has been designed to work around that issue by capturing the 
     date/time value from the message header instead and treating that as the 
     user's login time. This then gets converted to your BBS's local time and 
     format specification as defined in SCFG.



Thanks & Greetz:

  Big thanks to the following for testing and providing feedback!
  
  StingRay @ A-Net Online:
    - a-net-online.lol  
    - mystic.a-net-online.lol 

  xbit @ The X-Bit BBS:
    - x-bit.org 
    
  Huge thanks to Nightfox of Digital Distortion BBS for creating and 
  maintaining the awesome DDLightbarMenu library for Synchronet.
    - www.digitaldistortionbbs.com
    


Version History:

v TBA:
 
 + Added a filter for future dates.


v 0.250508 - May 8 2025:

 + Fixed an issue with keeping track of the last read message, which cause
   the entire echo to be re-read, and data to be added multiple times to the
   json files. The readBin and writeBin functions were proving problematic 
   for reading and writing to the lblc.lr file, so going forward this data
   will be read and written as a plain string instead.
 

v 0.250428 - April 28 2025:

 + Enforcing duplicate message checking, to keep callers from being listed
   more than once per call.
   

v 0.250320 - March 20 2025:

 + The script now prevents the accidental pressing of CTRL-Z (toggles raw mode
   on/off), which can corrupt the display and disable up/down navigation.

 + The ESC key should have worked all along to exit menus, but it didn't.
   Now it does as intended. 
   
 + Changed version number scheme (just easier for me to follow).
 

v 0.15 - February 26 2025:

  + Revised installation steps. No more logon.js modifications required.
  
  + Posting the current caller follows the same rules for listing last callers
    (i.e.: sysops won't be included if configured as such in SCFG).


v 0.14 - February 19 2025:

  + Skipping a version number due to a mild case of triskaidekaphobia.

  + Fixed an issue while detecting line-endings in posts in the message base
    for callers on one's own BBS.
  
  + The script now skips messages with null message headers instead of
    stopping altogether.


v 0.12 - February 17 2025:

  + Outgoing caller data now gets posted with only CRs without LFs. This 
    ensures compatibility with InterBBS Last Caller mods on other BBSes 
    without requiring any echocfg setting changes.   
  
  + Allow use of pipe code colors in callers' locations.
  

v 0.11 - February 8 2025:
 
  + Added carriage returns in front of the line feeds in the postCurrentCaller
    function. This fixes an issue with messages being posted without line 
    separation when posting from Linux based Synchronet BBSes.
  

v 0.1  - February 8 2025:

  + Initial version.
