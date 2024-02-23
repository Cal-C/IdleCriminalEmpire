
const GOONBASECOST = 1;
const UPDATETIMEMILISECONDS = 50;
const UPDATETIMESECONDS = UPDATETIMEMILISECONDS/1000;
const UPDATESPERSECOND = 1/UPDATETIMESECONDS;

var workOnPersonalCrime = 10;
var mangmentMultiplier = .1;

var goonDiscount = 1;

var USD = 0;
var energy = 100;
var energyMax = 100;
var energyRegenPerSecond = 1;
var criminalCareerStage = "Street Level";

var goonsFree = 0;
var goonsImprisioned = 0; //for a mechanic where doing too much crime can artifically reduce your goon number
var goonsTotal = 0;
var goonPrice = 0;

var nextJobCost = 0;
var nextJobName = " ";



var goonX = 1; //how many goons to add or subtract from a task TODO this will be manipulatable with a future menu
var timesShoplifted = 0; //for goon unlock

function wakeUp(){
    hideAllPages(document.getElementById("CrimePage")); //hiding all pages but the starting crime page
    updateGoonPrice();
    hideLockedElements();
    updateCurrentEnergy();
    updateEnergyMax();
    updateCostNewJob();
    console.log("Updating every "+ UPDATETIMESECONDS + " seconds, so there are " + UPDATESPERSECOND + " updates per second."); //if you want to see how often the game updates
}


//window.onload = wakeUp(); //sheeple


//button functions
//topPage
function menuNavClicked(whatPage){
    hideAllPages();
    whatPage.hidden = false;
}

//crimes page
function personalCrimeButtonClicked(crimeName, preGoon = false){
    let crime = jobs.find(crime => crime.name === crimeName);
    crimeworkneeded = crime.work - crime.worked;
    crimeworkneeded = Math.min(crimeworkneeded, workOnPersonalCrime);
    if(energy >= crimeworkneeded){
        energy -= crimeworkneeded;
        crime.worked += crimeworkneeded
        workHappened(preGoon);
        updateCurrentEnergy();
    }else{
        $("#messageText").text("You do not have enough energy to " + crimeName +  "right now")
    }
}

function shopliftClicked(){
    personalCrimeButtonClicked("Shoplift", true);
    
    if(timesShoplifted > 2){  
        if(!$(".postGoon").is(':visible')){
            $(".postGoon").show();
            createCrimeElements('Shoplift');
            //createCrimeElements('Pickpocket'); //testing
            $("#starterButton").hide();
            createCrimeHeaders();
            $("#messageText").text("You have unlocked the ability to hire goons to help you with your crimes");
        }
        
    }else{
        timesShoplifted ++;
    }
}

function addGoons(job){
    if(goonsFree-goonX >= 0){
        let goonJob = jobs.find(goonJob => goonJob.name === job) 
        goonJob.goonsWorking += goonX;
        goonsFree -= goonX;
        updateGoonNums(goonJob.name);
    }else{
        $("#messageText").text("You do not have " + goonX + " goons free right now")
    }
}

function removeGoons(job){
    let goonJob = jobs.find(goonJob => goonJob.name === job) 
    if(goonJob.goonsWorking-goonX >= 0){
        goonJob.goonsWorking -= goonX;
        goonsFree += goonX;
        updateGoonNums(goonJob.name);
    }else{
        $("#messageText").text("You do not have " + goonX + " goons to remove working on " + job + " right now")
    }
}



//goon page
function hireGoonClicked(){
    buyGoon();
}
function hireMaxGoonClicked(){
    var buying = true;
    var goonCount = -1;
    while(buying){
        buying = buyGoon(1, true);
        goonCount++;
    }
    if(goonCount > 1){
        $("#messageText").text("You have hired " + goonCount + " Goons")
    }else if(goonCount == 1){
        $("#messageText").text("You have hired a Goon")
    }else{
        cashNeeded = goonPrice - USD;
        $("#messageText").text("You do not have enough money to hire a Goon right now. You need " + cashNeeded + "$ more to hire a Goon")
    
    }
}

function buyNewJobClicked(){
    buyNewJob();
}

//helper funcitons
function buyNewJob(){
    if(USD >= nextJobCost){
        USD -= nextJobCost;
        job = jobs.find(job => job.name === nextJobName)
        job.unlocked = true;
        createCrimeElements(nextJobName);
        $("#messageText").text("You have unlocked the ability to " + nextJobName + " for " + nextJobCost + "$");
        updateCostNewJob();
        updateUSD();
        return true;
    }
    else{
        var cashNeeded = nextJobCost - USD;
        $("#messageText").text("You do not have enough money to unlock " + nextJobName + " right now. You need " + cashNeeded + "$ more to unlock " + nextJobName);
        return false;
    }
}
function buyGoon(Goonnum = 1, silent = false){
    if(USD > goonPrice*Goonnum){
        goonsTotal += Goonnum;
        goonsFree += Goonnum;
        USD -= goonPrice*Goonnum;
        updateGoonNums();
        updateUSD();
        return true;
    }else{
        if(!silent){
            if(Goonnum != 1){
                document.getElementById("messageText").innerHTML = "Sorry you need "+ goonPrice*Goonnum+ "$ to hire " + Goonnum + " Goons right now"
            }
            if(Goonnum == 1){
                document.getElementById("messageText").innerHTML = "Sorry you need "+ goonPrice+ "$ to hire a Goon right now"
            }
        }
        return false;
    }
}

function updateUSD(){
    document.getElementById("USDNum").innerHTML = USD;
}

function updateGoonNums(jobName = " "){
    updateGoonPrice();
    document.getElementById("GoonNum").innerHTML = String(goonsFree+ "/"+ goonsTotal);
    if(jobName != " "){
        let goonJob = jobs.find(goonJob => goonJob.name === jobName) 
        $("#messageText").text(goonJob.goonsWorking + " goons working on " + jobName);
        $("#" + goonJob.name + 'goonsAssignedText').text(goonJob.goonsWorking);
    }
}

function updateGoonPrice(){
    goonPrice = (GOONBASECOST + goonsTotal*10 + 1.01^goonsTotal)*goonDiscount;
    $("#goonPrice").text(goonPrice);
}

function hideAllPages(exception = "" ){
    const Pages = ["CrimePage", "GoonPage", "BribePage"];  
    Pages.forEach(DIV => {
        tag = document.getElementById(DIV);
        if(tag != exception){
            tag.hidden = true;
        }
    });  
}

function hideLockedElements(){
    const lockedEle = ["postGoon", "postBribe"];
    lockedEle.forEach(lockme =>{
        $("."+lockme).hide();
    });
}

function goonsStopWorking(){
    goonsFree = goonsTotal - goonsImprisioned;
    jobs.forEach(job => {
        job.goonsWorking = 0;
    });
}

function goonsWork(){
    jobs.forEach(job =>{
        job.worked += job.goonsWorking*UPDATETIMESECONDS;
    })
    workHappened();
}

function workHappened(preGoon = false){
    jobs.forEach(job =>{
        if(job.worked >= job.work){
            if(job.observed){
                USD += job.money+job.money*mangmentMultiplier;
            }else{
                USD += job.money;
            }
            
            job.worked = 0;
            updateUSD();
        }
        $("#"+job.name+'ProgressText').text((Math.round(job.worked*10)/10 + "/" + job.work));

    })
    if(!preGoon){updateProgressBars();}
}

function updateCostNewJob(){
    let nextJob = jobs.find(job => !job.unlocked);

    if(nextJob && nextJobName != nextJob.name){
        nextJobName = nextJob.name;
        nextJobCost = nextJob.unlockCost;
        $("#NextJobCost").text(nextJobCost);
        $("#NextJobName").text(nextJobName);
        return;
    }else if(!nextJob){
        $("#NextJobCost").text("");
        $("#NextJobName").text("No more crimes to unlock");
    }
}

function updateCurrentEnergy(){
    $("#EnergyNum").text(Math.round(energy));
}

function updateEnergyMax(){
    $("#EnergyMaxNum").text(Math.round(energyMax));
}

function updateProgressBars(){ 
    jobs.forEach(job => {
        if(job.unlocked){
            bar = document.getElementById(job.name + 'ProgressBar').ldBar;
            precentFull = job.worked/job.work *100;
            bar.set(precentFull,true);
        }
    });
}
function createCrimeProgressBar(crimeName){
    const barName = "#"+crimeName + 'ProgressBar';
    var progressBar = new ldBar(barName, {
        "stroke": '#248',
        "type": 'fill',
        "path": 'M1 1L30 1L30 30L1 30Z',
        "fill": 'data:ldbar/res,bubble(#248,#fff,50,1)',
        "value" : '0',
    });
}
function createCrimeHeaders(){
    const container = document.getElementById('crime-container-header');
    const observeHeader = document.createElement('div');
    const progressHeader = document.createElement('div');
    const goonHeader = document.createElement('div');

    observeHeader.textContent = "Personal Actions";
    progressHeader.textContent = "Progress";
    goonHeader.textContent = "Goons";

    container.appendChild(observeHeader);
    container.appendChild(progressHeader);
    container.appendChild(goonHeader);

}

function capGoons(job){
    let goonJob = jobs.find(goonJob => goonJob.name === job) 
    //calculate how many goons can be added without redundency
    var goonsWanted = goonJob.work*UPDATESPERSECOND; //how many goons are needed to make the job complete every update
    while( (goonsWanted > goonsFree + goonJob.goonsWorking)){
        goonsWanted = Math.ceil(goonsWanted/2);
        if(goonsWanted == 1){
            break;
        }
    }
    goonsAssignment = goonsWanted - goonJob.goonsWorking;
    if(goonsAssignment >= 1){
        goonJob.goonsWorking += goonsAssignment;
        goonsFree -= goonsAssignment;
        $("#messageText").text("You have capped " + job + " with " + goonJob.goonsWorking + " goons")
        updateGoonNums(goonJob.name);
    }else{
        var goonAssignment = 0;
        if(goonsWanted > goonJob.goonsWorking){
            goonAssignment = goonsWanted - goonJob.goonsWorking;
            goonsFree += goonAssignment;
            goonJob.goonsWorking -= goonAssignment;
        }
        goonsNeeded = goonsWanted*2-goonJob.goonsWorking-goonsFree;
        jobtime = Math.round(goonJob.work/(goonJob.goonsWorking)*100)/100;
        if(jobtime == UPDATETIMESECONDS){
            $("#messageText").text("You have reached cap for " + job + " with " + goonJob.goonsWorking + " goons, it completes in " + jobtime + " seconds.");
        }
        else{
            if(goonAssignment == 0){
                $("#messageText").text("You do not have enough goons to make " + job + " complete faster right now, you would need " + goonsNeeded + " more goons to make a difference. The current cap you can reach is "+ goonsWanted +" "+ job + " completes in " + jobtime + " seconds.");
            }else{
                $("#messageText").text("You do not have enough goons to make " + job + " complete faster right now, you would need " + goonsNeeded + " more goons to make a difference. The current cap you can reach is "+ goonsWanted +" It completes in " + jobtime + " seconds. You now have " + goonJob.goonsWorking + " goons working on " + job + " after reassigning " + goonAssignment + " goons");
            
            }
        }
    }
}

function createCrimeElements(crimeName) {
    const container = document.getElementById('crime-container');

    // Create the elements
    const observeButton = document.createElement('button');
    const personalcrime = document.createElement('button');
    const progressText = document.createElement('div');
    const progressBar = document.createElement('div');
    const goonsAssignedText = document.createElement('div');
    const addButton = document.createElement('button');
    const subtractButton = document.createElement('button');
    const capButton = document.createElement('button');

    // 🕶️Set properties👓
    observeButton.type = 'button';
    observeButton.className = 'crimeUIButton postGoon observeButton';
    observeButton.onclick = function() { monitorActivity(crimeName); };
    observeButton.textContent = '🕶️';

    personalcrime.type = 'button';
    personalcrime.textContent = crimeName;
    personalcrime.className = 'crimeUIButton';
    personalcrime.onclick = function() { personalCrimeButtonClicked(crimeName) };

    progressText.id = crimeName +'ProgressText';
    progressText.textContent = '0/' + jobs.find(job => job.name === crimeName).work;
    progressText.className = 'progressText crimeProgressText';

    progressBar.id = crimeName + 'ProgressBar';
    progressBar.className = 'ldBar label-center';
    progressBar.style = 'width: 38px; height: 38px;';

    goonsAssignedText.textContent = '0';
    goonsAssignedText.className = 'goonsAssignedText';
    goonsAssignedText.id = crimeName + 'goonsAssignedText';

    addButton.type = 'button';
    addButton.className = 'crimeUIButton postGoon';
    addButton.onclick = function() { addGoons(crimeName); };
    addButton.textContent = '+';

    subtractButton.type = 'button';
    subtractButton.className = 'crimeUIButton postGoon';
    subtractButton.onclick = function() { removeGoons(crimeName); };
    subtractButton.textContent = '-';

    capButton.type = 'button';
    capButton.className = 'crimeUIButton postGoon';
    capButton.onclick = function() { capGoons(crimeName); };
    capButton.textContent = 'CAP';

    console.log("Creating crime elements for " + crimeName + " goonLabel is "+ goonsAssignedText)

    // Append the elements to the container
    container.appendChild(observeButton);
    container.appendChild(personalcrime);
    container.appendChild(progressText);
    container.appendChild(progressBar);
    container.appendChild(goonsAssignedText);
    container.appendChild(addButton);
    container.appendChild(subtractButton);
    container.appendChild(capButton);

    createCrimeProgressBar(crimeName);

}

// Call the function to create the buttons



//Updating constantly
window.setInterval(function(){
    if($(".postGoon").is(':visible')){
        goonsWork();
    }
    if(energy < energyMax){
        energy += parseFloat((energyRegenPerSecond * UPDATETIMESECONDS).toFixed(10));
        updateCurrentEnergy();
    }
}, UPDATETIMEMILISECONDS);