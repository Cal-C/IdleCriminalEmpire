<!DOCTYPE html>
<html>

<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

    <link rel="stylesheet" type="text/css" href="plugIns/loading-bar.css"/>
    <script type="text/javascript" src="plugIns/loading-bar.js"></script>

    <!--
    
    
    <script src="https://code.jquery.com/ui/1.13.2/jquery-ui.js"></script>
    -->
    <script src="player-stats.js"></script>
    <script src="jobs.js"></script>
    <script src="game.js"></script>
    
    <style>
    <?php include 'game-style.css'; ?>
    </style>
</head>

<body>

    <h1>Idle Criminal Empire</h1>

    <span> $: </span> <span id="USDNum"> 0 </span> <span> Goons:</span> <span id="GoonNum"> 0.0 </span> <span> Energy </span> <span id="EnergyNum"> 0 </span> <span> / </span> <span id="EnergyMaxNum"> 0 </span>
    <br>
    <button type="button" onclick="menuNavClicked(CrimePage)">Crimes </button>
    <button type="button" id="goonMenuButton" class = "postGoon" onclick="menuNavClicked(GoonPage)">Hire Goons and Buy Buildings </button>
    <button type="button" id="bribeMenuButton" class = "postBribe" onclick="menuNavClicked(BribePage)">Bribe</button>

    <br>
    <div id="GoonXMenu" class = "postGoon">
        <button type="button" onclick="goonXBoxMenuClicked()">Goons To Use</button>
        <input type = "number" min="1" max="100000" id="goonXBox" value="1"/>
        <button type="button" onclick="goonXMenuClicked(1)">1</button>
        <button type="button" onclick="goonXMenuClicked(10)">10</button>
        <button type="button" onclick="goonXMenuClicked(100)">100</button>
        <button type="button" onclick="goonXMenuClicked(1000)">1000</button>
        <button type="button" onclick="goonXMenuClicked(10000)">10k</button>
        <button type="button" onclick="goonXMenuClicked(100000)">100k</button> 
    </div>
    <body onload="wakeUp();"></body>

    <br>
    <span class="err" id="messageText"></span>
    <br>
    <div id="CrimePage">
        <h1>Crimes</h1>
        <div><button type="button" id= "starterButton" class="crimeUIButton" onclick="shopliftClicked()">Shoplift </button></div>
        <div id = "crime-container-header" class = "crime-container postGoon"></div>
        <div id = "crime-container" class = "crime-container postGoon">
        </div>
    </div>

    <div id="GoonPage">
        <h1>Hire and Build</h1>
        <button type="button" onclick="hireGoonClicked()">Hire Goon</button><button type="button" onclick="hireMaxGoonClicked()">Max Goons</button>  <span>Goon Price: </span><span id="goonPrice">1</span><br>
        <button type="button" onclick="buyNewJobClicked()">Buy New Crime</button><button type="button" onclick="buyMaxNewJobClicked()">Buy Max New Crimes </button> <span> Cost of Unlocking </span> <span id = "NextJobName">Pickpocket</span> <span> : </span> <span id="NextJobCost">err</span>
        <br> <div id="Building-container-header" class = "building-container postGoon">
                <div>Building:</div> 
                <div>Improves Job Payout By:</div>
                <div>Cost:</div>
                <div>Owned:</div>
                <div>Buy Buttons:</div>
        </div>
        <div id="Building-container" class = "building-container postGoon"> </div>
    </div>

    <div id="BribePage">
        <h1>Bribe: </h1>
    </div>

    <br>
    <div id= "SaveLoad">
        <button type="button" onclick="saveGame()">Save</button>
        <button type="button" onclick="loadGame()">Load</button>
        <span> Warning: Saving Uses 🍪Cookies🍪  </span>
    </div>

    <br>
    <span> Version </span> <span id="versionNum"> Alpha 0.0.1.99999999 </span>
    <?php
    echo "This server is running PHP: ";
    echo phpversion();
    ?>

</body>

</html>