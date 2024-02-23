<!DOCTYPE html>
<html>

<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>

    <link rel="stylesheet" type="text/css" href="plugIns/loading-bar.css"/>
    <script type="text/javascript" src="plugIns/loading-bar.js"></script>

    <!--
    
    
    <script src="https://code.jquery.com/ui/1.13.2/jquery-ui.js"></script>
    -->

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

    <body onload="wakeUp();"></body>

    <br>
    <span class="err" id="messageText"></span>
    <br>
    <div id="CrimePage">
        <h1>Crimes</h1>
        <div><button type="button" id= "starterButton" class="crimeUIButton" onclick="shopliftClicked()">Shoplift </button></div>
        <div id = "crime-container-header" class = "crime-container postGoon"></div>
        <div id = "crime-container" class = "crime-container postGoon">
            <!-- Shoplift buttions depreciated but can be used as a template for future crimes
            <div><button type = "button" class="crimeUIButton postGoon" onclick="monitorActivity('Shoplift')" class="postGoon"> &#128065; </div>
            

            <div><span id = "shoplfitProgressText" class = "crimeProgressText">0/10</span></div>
            <div class="ldBar label-center" data-type="fill" data-path="M1 1L30 1L30 30L1 30Z" class="ldBar" data-fill="data:ldbar/res,bubble(#248,#fff,50,1)" class = "crimeProgressBar" id = "shopliftProgressBar"> </div>
            <div><button type = "button" class="crimeUIButton postGoon" onclick="addGoons('Shoplift')" > + </div>
            <div><button type = "button" class="crimeUIButton postGoon" onclick="removeGoons('Shoplift')" > - </div>
            <div><button type = "button" class="crimeUIButton postGoon" onclick="capGoons('Shoplift')" > CAP </div>
            -->
        </div>
    </div>

    <div id="GoonPage">
        <h1>Hire: </h1>
        <button type="button" onclick="hireGoonClicked()">Hire Goon</button><button type="button" onclick="hireMaxGoonClicked()">Max Goons</button>  <span>Goon Price: </span><span id="goonPrice">1</span><br>
        <button type="button" onclick="buyNewJobClicked()">Buy New Crime</button><button type="button" onclick="buyMaxJobs()">Buy Max New Crimes </button><span> Cost of Unlocking </span> <span id = "NextJobName">Pickpocket</span> <span> : </span> <span id="NextJobCost">err</span>
    </div>

    <div id="BribePage">
        <h1>Bribe: </h1>
    </div>

    <br>
    <br>
    <span> Version alpha <!-- or sigma who is the ultimate male?!?! --> 0.0.1 </span>
    <?php
    echo "This server is running PHP: ";
    echo phpversion();
    ?>

</body>

</html>