const GOONBASECOST = 1;
const UPDATETIMEMILISECONDS = 50;
const UPDATETIMESECONDS = UPDATETIMEMILISECONDS / 1000;
const UPDATESPERSECOND = 1 / UPDATETIMESECONDS;
const GOONUNLOCK = 2;
const GOONMAXMANIPULATE = 1000000;

var ticksSinceLastBribeUpdate=0;
var pageLoaded = false;

function wakeUp() {
  //sheeple
  hideAllPages(document.getElementById("CrimePage")); //hiding all pages but the starting crime page
  updateGoonPrice();
  
  updateCurrentEnergy();
  updateEnergyMax();
  updateCostNewJob();

  hideLockedElements();

  $("#versionNum").text(player.version);
  
  
  pageLoaded = true;
}

//button functions
//topPage
function menuNavClicked(whatPage) {
  hideAllPages();
  whatPage.hidden = false;
}
function goonXBoxMenuClicked() {
  trySetGoonX(parseInt($("#goonXBox").val()));
}
function goonXMenuClicked(tmpGoonX){
  trySetGoonX(tmpGoonX);
}

//bribes page
//crimes page
function observeCrime(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  if(goonJob.observed){
    goonJob.observed = false;
    player.observing--;
    $("#messageText").text("You are no longer observing " + goonJob.display);
    $("#"+job+"ObserveButton").text("🕶️");
    $("#"+job+"payoutText").text(summarizeNumber(calculatePayout(job)));
    calculateJobOpportunity();
    return;
  }
  if (player.observing < player.observeMax) {
    goonJob.observed = true;
    player.observing++;
    $("#messageText").text("You are now observing " + job);
    $("#"+job+"ObserveButton").text("👁️");
    $("#"+job+"payoutText").text(summarizeNumber(calculatePayout(job)));
    calculateJobOpportunity();
  } else {
    $("#messageText").text("You are already observing " + player.observeMax + " jobs");
  }
}

function personalCrimeButtonClicked(crimeName, preGoon = false) {
  let crime = jobs.find((crime) => crime.name === crimeName);
  crimeworkneeded = crime.work - crime.worked;
  crimeworkneeded = Math.min(crimeworkneeded, player.workOnPersonalCrime);
  if (player.energy >= crimeworkneeded) {
    player.energy -= crimeworkneeded;
    crime.worked += crimeworkneeded;
    workHappened(preGoon);
    updateCurrentEnergy();
  } else {
    $("#messageText").text(
      "You do not have enough energy to " + crime.display + " right now"
    );
  }
}

function shopliftClicked() {
  personalCrimeButtonClicked("Shoplift", true);

  if (player.timesShoplifted > GOONUNLOCK) {
    if (!$(".postGoon").is(":visible")) {
      unlockGoonPage();
      $("#messageText").text(
        "You have unlocked the ability to hire goons to help you with your crimes."
      );
    }
  } else {
    player.timesShoplifted++;
  }
}

function addGoons(job) {
  if(player.goonsFree == 0){
    $("#messageText").text("You do not have any goons free right now.");
    return;
  }
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  if (player.goonsFree - player.goonX >= 0) {
    goonJob.goonsWorking += player.goonX;
    player.goonsFree -= player.goonX;
    updateGoonNums(goonJob.name);
  } else {
    $("#messageText").text(
      "You do not have " + summarizeNumber(player.goonX) + " goons free right now. Adding all "+ summarizeNumber(player.goonsFree)  +" free goons to " + summarizeNumber(goonJob.display) + " instead."
    );
    goonJob.goonsWorking = goonJob.goonsWorking + player.goonsFree;
    player.goonsFree = 0;
    updateGoonNums(goonJob.name, true);
  }
  if (goonJob.goonsWorking > determineGoonCap(job)) {
    var oldtext = $("#messageText").text();
    $("#messageText").text(oldtext + ' You have added too many goons to ' + summarizeNumber(goonJob.display) + ' it will not make it go faster. Consider capping the goons on ' + summarizeNumber(goonJob.display) + ' to make the most of your goons.');
  }
}

function removeGoons(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  if (goonJob.goonsWorking == 0) {
    $("#messageText").text("You do not have any goons working on " + summarizeNumber(goonJob.display) + " right now");
    return;
  }
  if (goonJob.goonsWorking - player.goonX >= 0) {
    goonJob.goonsWorking -= player.goonX;
    player.goonsFree += player.goonX;
    updateGoonNums(goonJob.name);
  } else {
    $("#messageText").text(
      "You do not have " +
        player.goonX +
        " goons to remove working on " +
        goonJob.display +
        " right now. Removing all goons working on " +
        goonJob.display
    );
    player.goonsFree += goonJob.goonsWorking;
    goonJob.goonsWorking = 0;
    updateGoonNums(goonJob.name, true);
  }
}

//goon page
function hireGoonClicked() {
  if(player.goonX > 1){
    hireMaxGoonClicked(player.goonX, true);
    return;
  }
  buyGoon();
}
function hireMaxGoonClicked(maxGoon = 2**20, capped = false) {
  var buying = true;
  var goonCount = 0;
  const incomingMaxGoon = maxGoon;
  if(maxGoon != 2**20){
    maxGoon = roundDownToPowerOfTwo(maxGoon);
  }
  if (player.USD / player.goonPrice < maxGoon) {
    //if you have enough money to buy 1024 goons (at current prices) do a binary search of how many goons you can actually buy starting at 1024
    var tryBuying = maxGoon;
    while (buying) {
      buying = buyGoon(tryBuying, true);
      if (buying) {
        goonCount += tryBuying;
        if(capped && goonCount+tryBuying >= incomingMaxGoon){
          tryBuying = Math.round(tryBuying / 2);
        }
      } else {
        if (tryBuying != 1) {
          tryBuying = Math.round(tryBuying / 2);
          buying = true;
        }
      }
    }
  } else {
    goonCount--;
    while (buying) {
      buying = buyGoon(1, true);
      goonCount++;
      if (capped && goonCount + 1 > incomingMaxGoon) {
        buying = false;
      }
    }
  }



  if (goonCount > 1) {
    $("#messageText").text("You have hired " + summarizeNumber(goonCount) + " Goons");
  } else if (goonCount == 1) {
    $("#messageText").text("You have hired a Goon");
  } else {
    cashNeeded = player.goonPrice - player.USD;
    $("#messageText").text(
      "You do not have enough money to hire a Goon right now. You need " +
      summarizeNumber(cashNeeded) +
        "$ more to hire a Goon"
    );
  }
  if (goonCount > 0) {
    updateGoonNums();
    updateUSD();
  }
}

function buyOneBuilding(jobName, silent = false) {
  let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
  if (player.USD >= goonJob.BuildingCost) {
    player.USD -= goonJob.BuildingCost;
    goonJob.BuildingsOwned++;
    goonJob.money += goonJob.BuildingIncome;
    if(silent){
      goonJob.BuildingCost = calculateBuildingPrice(jobName);
      return true;}
    updateBuildingNumbers(jobName);
    updateUSD();
    $("#messageText").text( "You have bought a " + goonJob.Building + " the new payout for completing "+ goonJob.display + " is " + summarizeNumber(calculatePayout(jobName))+"$");
    return true;
  } else {
    if(silent){return false;}
    const difference = goonJob.BuildingCost - player.USD;
    $("#messageText").text(
      "You do not have enough money to buy a " +
        goonJob.Building +
        " right now. You need " +
        summarizeNumber(difference) +
        "$ more to buy a " +
        goonJob.Building
    );
    return false;
  }
}

function buyMaxBuilding(jobName) {
  let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
  var buying = true;
  var buildingCount = -1;
  while (buying) {
    buying = buyOneBuilding(jobName , true);
    buildingCount++;
  }
  if (buildingCount > 1) {
    $("#messageText").text("You have bought " + summarizeNumber(buildingCount) + " buildings");
  } else if (buildingCount == 1) {
    $("#messageText").text("You have bought a building");
  } else {
    const difference = goonJob.BuildingCost - player.USD;
    $("#messageText").text("You do not have enough to buy a building right now. You need " + summarizeNumber(difference) + "$ more to buy " + goonJob.Building);
  }
  if (buildingCount > 0) {
    updateUSD();
    updateBuildingNumbers(jobName);
  }

}


function buyNewJobClicked() {
  buyNewJob();
}

function buyMaxNewJobClicked() {
  var buying = true;
  var jobCount = -1;
  while (buying) {
    buying = buyNewJob();
    jobCount++;
  }
  if (jobCount > 1) {
    $("#messageText").text("You have unlocked " + jobCount + " jobs");
  } else if (jobCount == 1) {
    $("#messageText").text("You have unlocked a job");
  } else {
    $("#messageText").text("You have unlocked all the jobs");
  }
  if (jobCount > 0) {
    updateUSD();
  }
}

//bribe page
function buyNewBribe() {
  if (player.nextBribeCost > player.USD) {
    $("#messageText").text(
      "You do not have enough money to unlock " +
        player.nextBribeName +
        " right now. You need " +
        summarizeNumber(player.nextBribeCost) +
        "$ more to unlock " +
        player.nextBribeName
    );
    return false;
  }
  player.USD -= player.nextBribeCost;
  let bribe = bribes.find((bribe) => bribe.name === player.nextBribeName);
  if(bribe === null || bribe === undefined || bribe.unlocked === true){
    return false;
  }
  bribe.unlocked = true;
  updateNextBribe();
  updateUSD();
  $("#messageText").text(
    "You have unlocked the ability to " +
      bribe.display +
      " for " +
      summarizeNumber(bribe.unlockCost) +
      "$"
  );

  createBribeElements(bribe.name);
  return true;
}

function buyMaxNewBribe() {
  var buying = true;
  var bribeCount = -1;
  while (buying) {
    buying = buyNewBribe();
    bribeCount++;
  }
  if (bribeCount > 1) {
    $("#messageText").text("You have unlocked " + bribeCount + " bribes");
  } else if (bribeCount == 1) {
    $("#messageText").text("You have unlocked a bribe");
  } else {
    if (player.nextBribeName == " ") {
      $("#messageText").text("You have unlocked all the bribes");
      return;
    }
    $("#messageText").text("You do not have enough money to unlock " + player.nextBribeName + " right now. You need " + summarizeNumber(player.nextBribeCost) + "$to unlock " + player.nextBribeName);
  }
  if (bribeCount > 0) {
    updateUSD();
  }
}

//helper funcitons
function unlockGoonPage() {
  $(".postGoon").show();
  createCrimeElements("Shoplift");
  $("#starterButton").hide();
  createCrimeHeaders();
}
function updateHeatNumbers(){
  $("#heatNums").text(summarizeNumber(player.heat) +"("+summarizeNumber(player.goonsImprisoned) +")");

}

function updateNextBribe(){
  cheapestBribeName = findCheapestLockedBribe();
  let cheapestBribe = bribes.find((bribe) => bribe.name === cheapestBribeName);
  if(cheapestBribe === null || cheapestBribeName === null){
    $("#NextBribeCost").text("No more bribes to unlock");
    $("#NextBribeName").text("");
    $("#CostOfBribingText").hide();
    player.nextBribeName = " ";
    player.nextBribeCost = 0;
    return;
  }else{
    player.nextBribeName = cheapestBribe.name;
    player.nextBribeCost = cheapestBribe.unlockCost;
    $("#NextBribeCost").text(summarizeNumber(player.nextBribeCost));
    $("#CostOfBribingText").text("Cost of unlocking "+cheapestBribe.display+": ");
  
  }
}

function findCheapestLockedBribe() {
  let cheapestBribe = null;

  bribes.forEach((bribe) => {
    if (!bribe.unlocked) {
      if (cheapestBribe === null || bribe.cost < cheapestBribe.cost) {
        cheapestBribe = bribe;
      }
    }
  });
  if(cheapestBribe === null){
    return null;
  }
  console.log(cheapestBribe.name + " is the cheapest locked bribe with a unlocked value of " + cheapestBribe.unlocked);
  return cheapestBribe.name;
}

function updateBribeSliderText(){
  $("#bribeCashPercentText").text(player.bribePercent);
  $("#bribeCashAmountText").text(summarizeNumber(calculateBribeUSD()));
}

function unlockBribePage(silent = false) {
  $(".postBribe").show();
  let bribePercentSlider = document.getElementById('bribePercentSlider');
  bribePercentSlider.oninput = function() {
    player.bribePercent = this.value;
    updateBribeSliderText();
    updateAllBribeHeatText();
  }
  job = jobs.find((job) => job.name === player.nextJobName);
  if(!silent){
    $("#messageText").text(job.display +" generates a base of " +job.heatGenerated +" heat, which generates attention from police, who will imprison your goons. You have unlocked the ability to bribe the police to overcome this challenge.");
  }
  
  for (i = 0; i < bribes.length; i++) {
    if(bribes[i].unlocked){
      createBribeElements(bribes[i].name);
    }
  }
  updateNextBribe();
  $("#heatHeader").text("Heat:");
  updateAllHeatJobText();
  $("#bribeCashPercentText").text(summarizeNumber(calculateBribeUSD()));
}

function calculateBribeUSD(){
  return player.bribePercent * player.USD/100;
}

function updateAllBribeHeatText(){
  bribes.forEach((bribe) => {
    if(!bribe.unlocked){return;}
    $("#"+bribe.name+"heatRemoved").text(summarizeNumber(calculateBribeHeatRemoved(bribe.name)) + "(" + summarizeNumber(bribe.USDtoHeat) + ")");
  });
}

function updateAllBribeCounters(){
  bribes.forEach((bribe) => {
    if(!bribe.unlocked){return;}
    if(bribe.secondsLeft > 0){
      bribe.secondsLeft--;
      cooldownLeft = bribe.cooldownSeconds - bribe.secondsLeft;
      $("#"+bribe.name+"CooldownText").text(summarizeNumber(cooldownLeft) + "/" + summarizeNumber(bribe.cooldownSeconds));
      updateBribeProgressBar(bribe.name);
    }
  });
}

function updateAllHeatJobText(){
  jobs.forEach((job) => {
    if(job.unlocked){
      $("#"+job.name+"heatGenerated").text(summarizeNumber(job.heatGenerated));
    }
    
  });
}

function calculateGoonsImprisoned() {
  var goonsToImprison = Math.round(player.heat / player.heatToImprison) - player.goonsImprisoned;
  if (goonsToImprison <= player.goonsFree) {
    player.goonsFree -= goonsToImprison;
    player.goonsImprisoned += goonsToImprison;
    updateHeatNumbers();
    updateGoonNums();
    return;
  } else {
    toSubtractFromJob = goonsToImprison - player.goonsFree;
    player.goonsImprisoned += player.goonsFree;
    player.goonsFree = 0;
    jobNumber = 0;
    lowestPreformingJob = jobs.find((job) => job.name === player.jobOpportunity[jobNumber]);
    while (toSubtractFromJob > 0) {
      
      if (lowestPreformingJob.goonsWorking > toSubtractFromJob) {
        lowestPreformingJob.goonsWorking -= toSubtractFromJob;
        toSubtractFromJob = 0;
        updateGoonNums(lowestPreformingJob.name);
      } else {
        toSubtractFromJob -= lowestPreformingJob.goonsWorking;
        lowestPreformingJob.goonsWorking = 0;
        jobNumber++;
        updateGoonNums(lowestPreformingJob.name);
      }

      lowestPreformingJob = jobs.find((job) => job.name === player.jobOpportunity[jobNumber]);
      if(lowestPreformingJob === undefined){
        $("#messageText").text("You have no goons left to imprison");
        toSubtractFromJob = 0;
      }
    }
    
    updateHeatNumbers();
    
  }
}

function calculateJobOpportunity(){
  player.jobOpportunity = [];
  var tmpJobs = jobs.slice();
  tmpJobs.sort((a, b) => {
    const payoutA = calculatePayout(a.name) / a.work;
    const payoutB = calculatePayout(b.name) / b.work;
  
    return payoutB - payoutA; // For descending order
  });
  
  tmpJobs.forEach((job) => {
    if(job.unlocked){
      player.jobOpportunity.push(job.name);
    }
  });
  return player.jobOpportunity;
}

function hack(){
  player.USD += 1e10;
  updateUSD();
  lockedJobs = jobs.filter((job) => !job.unlocked);
  console.log(JSON.stringify(lockedJobs, null, 2));
}

function hack2(){
  player.USD += 1e12;
  updateUSD();
}



function calculateJobProfitPerSecond(jobName) { //I dont think this is actually needed but keeping it in case
  let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
  capOrAssigned = Math.min(goonJob.goonsWorking, determineGoonCap(jobName));
  percentOfCap = capOrAssigned/determineGoonCap(jobName);
  maxPayout = calculatePayout(jobName)*UPDATESPERSECOND
  return  maxPayout / percentOfCap;
}

function buyNewJob() {
  if (player.nextJobName == " ") {
    $("#messageText").text("You have unlocked all the crimes");
    return;
  }
  job = jobs.find((job) => job.name === player.nextJobName);

  if (player.USD >= player.nextJobCost) {
    if($(".postBribe").is(":hidden")){
      if(job.heatGenerated > 0){
        unlockBribePage();
      }
    }
    player.USD -= player.nextJobCost;
    job.unlocked = true;
    createCrimeElements(player.nextJobName);
    $("#messageText").text(
      "You have unlocked the ability to " +
        job.display +
        " for " +
        summarizeNumber(player.nextJobCost) +
        "$"
    );
    updateCostNewJob();
    updateUSD();
    return true;
  } else {
    var cashNeeded = player.nextJobCost - player.USD;
    $("#messageText").text(
      "You do not have enough money to unlock " +
        job.display +
        " right now. You need " +
        summarizeNumber(cashNeeded) +
        "$ more to unlock " +
        job.display
    );
    return false;
  }
}

function buyGoon(Goonnum = 1, silent = false) {
  var transactionPrice = 0;
  if (Goonnum > 1) {
    /* legacy goon price calculation, if the new one is wrong, this can be used to compare
    for (
      var transactionGoon = 0;
      transactionGoon < Goonnum;
      transactionGoon++
    ) {
      transactionPrice += calculateGoonPrice(
        player.goonsTotal + transactionGoon
      );
    }
    */
    transactionPrice2 = calculateGoonSummationPrice(player.goonsTotal, Goonnum+player.goonsTotal-1);
    console.log("The price of " + summarizeNumber(Goonnum) + " goons is " + summarizeNumber(transactionPrice2));
    transactionPrice = transactionPrice2;
    /* error checking for the new goon price calculation. comment out if not needed
    if (transactionPrice != transactionPrice2) {
      ratio = transactionPrice / transactionPrice2;
      console.log(
        "Error in calculating the price of " +
          Goonnum +
          " goons. " +
          transactionPrice +
          " != " +
          transactionPrice2
          + " ratio: " + ratio
      );
    }else{
      console.log("The price of " + Goonnum + " goons is " + transactionPrice2);
    }
    */
  } else {
    transactionPrice = player.goonPrice;
  }
  if (player.USD > transactionPrice) {
    player.goonsTotal += Goonnum;
    player.goonsFree += Goonnum;
    player.USD -= transactionPrice;

    if (!silent) {
      updateGoonNums();
      updateUSD();
    } else {
      updateGoonPrice();
    }
    return true;
  } else {
    if (!silent) {
      if (Goonnum != 1) {
        document.getElementById("messageText").innerHTML =
          "Sorry you need " +
          summarizeNumber(player.goonPrice) * Goonnum +
          "$ to hire " +
          Goonnum +
          " Goons right now";
      }
      if (Goonnum == 1) {
        document.getElementById("messageText").innerHTML =
          "Sorry you need " + summarizeNumber(player.goonPrice) + "$ to hire a Goon right now";
      }
    }
    return false;
  }
}

function updateBuildingNumbers(jobName){
  let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
  if (goonJob === undefined || goonJob.Building === undefined || document.getElementById(jobName + "BuildingName") === undefined){
    return;
  }
  goonJob.BuildingCost = calculateBuildingPrice(jobName);
  $("#"+jobName+"BuildingOwned").text(summarizeNumber(goonJob.BuildingsOwned));
  $("#"+jobName+"BuildingCost").text(summarizeNumber(goonJob.BuildingCost));
  $("#"+jobName+"BuildingJobImprovement").text(goonJob.display + " $" + summarizeNumber(goonJob.BuildingIncome));
  $("#"+jobName+"payoutText").text(summarizeNumber(calculatePayout(jobName)));
  calculateJobOpportunity();
}

function updateUSD() {
  document.getElementById("USDNum").innerHTML = summarizeNumber(player.USD);
  if($(".postBribe").is(":visible")){
    updateAllBribeHeatText();
    updateBribeSliderText();
  }
  
}

function updateGoonNums(jobName = " ", silent = false) {
  updateGoonPrice();
  document.getElementById("GoonNum").innerHTML = String(
    summarizeNumber(player.goonsFree) + "/" + summarizeNumber(player.goonsTotal)
  );
  if (jobName === "all") {
    jobs.forEach((job) => {
      $("#" + job.name + "goonsAssignedText").text(summarizeNumber(job.goonsWorking) + "/" + summarizeNumber(determineGoonCap(job.name)));
    });
  } else if (jobName != " ") {
    let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
    if (!silent) {
      $("#messageText").text(
        goonJob.goonsWorking + " goons working on " + jobName
      );
    }
    $("#" + goonJob.name + "goonsAssignedText").text(summarizeNumber(goonJob.goonsWorking) + "/" + summarizeNumber(determineGoonCap(jobName)));
  }
}
function calculateGoonSummationPrice(start, end) {
  if (start < 0 || end < 0 || start > end) {
    console.error('Invalid inputs to calculateGoonSummationPrice:', start, end);
    return;
  }

  const firstTerm = calculateGoonPrice(start);
  const lastTerm = calculateGoonPrice(end);

  if (firstTerm < 0 || lastTerm < 0) {
    console.error('Negative goon price:', firstTerm, lastTerm);
    return;
  }

  const numberOfTerms = end - start + 1;
  const totalCost = numberOfTerms / 2 * (firstTerm + lastTerm);

  return Math.round(totalCost);
}

function calculateGoonPrice(Goons) {
  return Math.round((GOONBASECOST + (Goons + 1) * 10) * player.goonDiscount);
}

function updateGoonPrice() {
  player.goonPrice = calculateGoonPrice(player.goonsTotal);
  $("#goonPrice").text(summarizeNumber(player.goonPrice));
  return goonPrice;
}
function calculateBuildingPrice(jobName){
  let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
  return Math.round(goonJob.BuildingCost * ((goonJob.BuildingsOwned) + 1));
}


function hideAllPages(exception = "") {
  const Pages = ["CrimePage", "GoonPage", "BribePage"];
  Pages.forEach((DIV) => {
    tag = document.getElementById(DIV);
    if (tag != exception) {
      tag.hidden = true;
    }
  });
}

function hideLockedElements() {
  const lockedEle = ["postGoon", "postBribe"];
  lockedEle.forEach((lockme) => {
    $("." + lockme).hide();
  });
}

function goonsStopWorking() {
  player.goonsFree = player.goonsTotal - player.goonsImprisoned;
  jobs.forEach((job) => {
    job.goonsWorking = 0;
  });
}

function goonsWork() {
  jobs.forEach((job) => {
    job.worked += job.goonsWorking * UPDATETIMESECONDS;
  });
  workHappened();
}

function workHappened(preGoon = false) {
  jobs.forEach((job) => {
    if (job.worked >= job.work) {
      var payOut = calculatePayout(job.name);
      player.USD += payOut;
      job.worked = 0;
      updateUSD();
      if($(".postBribe").is(":visible") && job.heatGenerated > 0){
        player.heat += job.heatGenerated*player.heatMultiplier;
        calculateGoonsImprisoned();
      }
    }
    $("#" + job.name + "ProgressText").text(
      summarizeNumber(Math.round(job.worked * 10) / 10) + "/" + summarizeNumber(job.work)
    );
  });
  if (!preGoon) {
    updateProgressBars();
  }
}

function calculatePayout(jobName) {
  let payoutJob = jobs.find((payoutJob) => payoutJob.name === jobName);
  if (payoutJob.observed) {
    return payoutJob.money + payoutJob.money * player.managementMultiplier;
  } else {
    return payoutJob.money;
  }
}

function updateCostNewJob() {
  let nextJob = jobs.find((job) => !job.unlocked);

  if (nextJob && player.nextJobName != nextJob.name) {
    player.nextJobName = nextJob.name;
    player.nextJobCost = nextJob.unlockCost;
    $("#NextJobCost").text(summarizeNumber(player.nextJobCost));
    $("#NextJobName").text(nextJob.display);
    return;
  } else if (!nextJob) {
    player.nextJobName = " ";
    $("#NextJobCost").text("No more crimes to unlock");
    $("#NextJobName").text("");
    $("#messageText").text("You have unlocked all the crimes");
    $("#CostOfUnlocking").hide();
  }
}

function updateCurrentEnergy() {
  $("#EnergyNum").text(summarizeNumber(Math.round(player.energy)));
}

function updateEnergyMax() {
  $("#EnergyMaxNum").text(summarizeNumber(Math.round(player.energyMax)));
}

function updateProgressBars() {
  jobs.forEach((job) => {
    if (job.unlocked) {
      bar = document.getElementById(job.name + "ProgressBar").ldBar;
      precentFull = (job.worked / job.work) * 100;
      bar.set(precentFull, true);
    }
  });
}
function createCrimeProgressBar(crimeName) {
  const barName = "#" + crimeName + "ProgressBar";
  var progressBar = new ldBar(barName, {
    stroke: "#248",
    type: "fill",
    path: "M1 1L100 1L100 100L1 100Z",
    fill: "data:ldbar/res,bubble(#248,#fff,50,1)",
    value: "0",
  });
}

function updateObservedJobs() {
  numberObserved = 0;
  jobs.forEach((job) => {
    if (job.observed) {
      numberObserved++;
      $("#"+job.name+"ObserveButton").text("👁️");
    }else{
      $("#"+job.name+"ObserveButton").text("🕶️");
    }
  });
  if(numberObserved > player.observeMax){
    $("#messageText").text("You are observing " + numberObserved + " jobs, but you can only observe " + player.observeMax + " jobs. Some observations have been removed");
    jobs.forEach((job) => {
      if (job.observed) {
        job.observed = false;
        numberObserved--;
        if(numberObserved == player.observeMax){
          return;
        }
      }
      $("#"+jobName+"payoutText").text(summarizeNumber(calculatePayout(jobName)));
    });
  }
  player.observing = numberObserved;
  calculateJobOpportunity();
}

function createCrimeHeaders() {
  const container = document.getElementById("crime-container-header");
  const observeHeader = document.createElement("div");
  const progressHeader = document.createElement("div");
  const goonHeader = document.createElement("div");
  const  payoutHeader = document.createElement("div");
  const heatHeader = document.createElement("div");

  observeHeader.textContent = "Personal Actions";
  progressHeader.textContent = "Progress";
  goonHeader.textContent = "Goons";
  payoutHeader.textContent = "Payout";
  heatHeader.textContent = "???";
  heatHeader.id = "heatHeader";

  container.appendChild(observeHeader);
  container.appendChild(progressHeader);
  container.appendChild(goonHeader);
  container.appendChild(payoutHeader);
  container.appendChild(heatHeader);
}
function determineGoonCap(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  //calculate how many goons can be added without redundency
  var goonsWanted = goonJob.work * UPDATESPERSECOND; //how many goons are needed to make the job complete every update
  return goonsWanted;
}

function capGoons(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  //calculate how many goons can be added without redundency
  goonsWanted = determineGoonCap(job);
  determineGoonCap(job);
  while (goonsWanted > player.goonsFree + goonJob.goonsWorking) {
    goonsWanted = Math.ceil(goonsWanted / 2);
    if (goonsWanted == 1) {
      break;
    }
  }
  goonsAssignment = goonsWanted - goonJob.goonsWorking;
  if (goonsAssignment >= 1) {
    goonJob.goonsWorking += goonsAssignment;
    player.goonsFree -= goonsAssignment;
    $("#messageText").text(
      "You have capped " + job + " with " + summarizeNumber(goonJob.goonsWorking) + " goons"
    );
    updateGoonNums(goonJob.name);
  } else {
    var goonAssignment = 0;
    if (goonsWanted > goonJob.goonsWorking) {
      goonAssignment = goonsWanted - goonJob.goonsWorking;
      player.goonsFree += goonAssignment;
      goonJob.goonsWorking -= goonAssignment;
    }
    goonsNeeded = goonsWanted * 2 - goonJob.goonsWorking - player.goonsFree;
    jobtime = Math.round((goonJob.work / goonJob.goonsWorking) * 100) / 100;
    if (jobtime <= UPDATETIMESECONDS) {
      goonSubtraction = goonJob.goonsWorking - goonsWanted;
      if (goonSubtraction > 0) {
        $("#messageText").text(
          "You have reached cap for " +
          goonJob.display +
            " with " +
            summarizeNumber(goonJob.goonsWorking) +
            " goons, but it could have been done with " +
            goonsWanted +
            " goons, it completes in " +
            summarizeNumber(jobtime) +
            " seconds. " +
            summarizeNumber(goonSubtraction) +
            " goons have been removed for optimal goon usage"
        );
        goonJob.goonsWorking -= goonSubtraction;
        player.goonsFree += goonSubtraction;
        updateGoonNums(goonJob.name, true);
      } else {
        $("#messageText").text(
          "You have reached cap for " +
          goonJob.display +
            " with " +
            summarizeNumber(goonJob.goonsWorking) +
            " goons, it completes in " +
            summarizeNumber(jobtime) +
            " seconds."
        );
      }
    } else {
      if (goonAssignment == 0) {
        $("#messageText").text(
          "You do not have enough goons to make " +
            goonJob.display +
            " complete faster right now, you would need " +
            summarizeNumber(goonsNeeded) +
            " more free goons to make a difference. The current cap you can reach is " +
            summarizeNumber(goonsWanted) +
            ". " +
            goonJob.display +
            " completes in " +
            summarizeNumber(jobtime) +
            " seconds."
        );
      } else {
        $("#messageText").text(
          "You do not have enough goons to make " +
          goonJob.display +
            " complete faster right now, you would need " +
            summarizeNumber(goonsNeeded) +
            " more free goons to make a difference. The current cap you can reach is " +
            summarizeNumber(goonsWanted) +
            " It completes in " +
            summarizeNumber(jobtime) +
            " seconds. You now have " +
            summarizeNumber(oonJob.goonsWorking) +
            " goons working on " +
            goonJob.display +
            " after reassigning " +
            summarizeNumber(goonAssignment) +
            " goons."
        );
      }
    }
  }
}

function roundDownToPowerOfTwo(n) {
  var power = Math.floor(Math.log2(n));
  return Math.pow(2, power);
}

function trySetGoonX(tmpGoonX){
  tempGoonX = tmpGoonX;
  if(tempGoonX <= 0){
    $("#messageText").text("You cannot use 0 or less goons");
    return;
  }else if(tempGoonX > GOONMAXMANIPULATE){
    $("#messageText").text("You cannot use that many goons at once, setting to " + GOONMAXMANIPULATE);
    tempGoonX = GOONMAXMANIPULATE;
    player.goonX = tempGoonX;
    $("#goonXBox").val(player.goonX);
    return;
  }
  player.goonX = tempGoonX
  $("#messageText").text("You will now use " + player.goonX + " when buying goons or assigning goons to jobs");
  $("#goonXBox").val(player.goonX);
}

function createCrimeElements(crimeName) {
  //check if the crime already exists
  if (document.getElementById(crimeName + "ObserveButton")) {
    return;
  }
  const container = document.getElementById("crime-container");

  // Create the elements
  const observeButton = document.createElement("button");
  const personalcrime = document.createElement("button");
  const progressText = document.createElement("div");
  const progressBar = document.createElement("div");
  const goonsAssignedText = document.createElement("div");
  const addButton = document.createElement("button");
  const subtractButton = document.createElement("button");
  const capButton = document.createElement("button");
  const payoutText = document.createElement("div");
  const heatGenerated = document.createElement("div");

  const crimeClass = jobs.find((crimeClass) => crimeClass.name === crimeName);

  // 🕶️Set properties👓
  observeButton.type = "button";
  observeButton.id = crimeName + "ObserveButton";
  observeButton.className = "crimeUIButton postGoon observeButton";
  observeButton.onclick = function () {
    observeCrime(crimeName);
  };
  if (crimeClass.observed) {
    observeButton.textContent = "👁️";
  } else{
    observeButton.textContent = "🕶️";
  }

  personalcrime.type = "button";
  personalcrime.textContent = crimeClass.display;
  personalcrime.className = "crimeUIButton";
  personalcrime.onclick = function () {
    personalCrimeButtonClicked(crimeName);
  };

  progressText.id = crimeName + "ProgressText";
  progressText.textContent =
   summarizeNumber(crimeClass.worked) + "/" + summarizeNumber(crimeClass.work);
  progressText.className = "progressText crimeProgressText";

  progressBar.id = crimeName + "ProgressBar";
  progressBar.className = "ldBar label-center";
  progressBar.style = "width: 38px; height: 38px;";

  goonsAssignedText.textContent = summarizeNumber(crimeClass.goonsWorking) + "/" + summarizeNumber(determineGoonCap(crimeName));
  goonsAssignedText.className = "goonsAssignedText";
  goonsAssignedText.id = crimeName + "goonsAssignedText";

  addButton.type = "button";
  addButton.className = "crimeUIButton postGoon";
  addButton.onclick = function () {
    addGoons(crimeName);
  };
  addButton.textContent = "+";

  subtractButton.type = "button";
  subtractButton.className = "crimeUIButton postGoon";
  subtractButton.onclick = function () {
    removeGoons(crimeName);
  };
  subtractButton.textContent = "-";

  capButton.type = "button";
  capButton.className = "crimeUIButton postGoon";
  capButton.onclick = function () {
    capGoons(crimeName);
  };
  capButton.textContent = "CAP";

  payoutText.textContent = summarizeNumber(calculatePayout(crimeName));
  payoutText.className = "payoutText";
  payoutText.id = crimeName + "payoutText";

  if($(".postBribe").is(":hidden")){
    heatGenerated.textContent = "???";
  }else{
    heatGenerated.textContent = summarizeNumber(crimeClass.heatGenerated * player.heatMultiplier);
  }
  heatGenerated.className = "heatGenerated";
  heatGenerated.id = crimeName + "heatGenerated";

  // Append the elements to the container
  container.appendChild(observeButton);
  container.appendChild(personalcrime);
  container.appendChild(progressText);
  container.appendChild(progressBar);
  container.appendChild(goonsAssignedText);
  container.appendChild(addButton);
  container.appendChild(subtractButton);
  container.appendChild(capButton);
  container.appendChild(payoutText);
  container.appendChild(heatGenerated);

  calculateJobOpportunity();
  createCrimeProgressBar(crimeName);
  createBuildingElements(crimeName);
}

function createBuildingElements(crimeName) {
  const container = document.getElementById("Building-container");


  var crimeClass = jobs.find((crimeClass) => crimeClass.name === crimeName);
  if (crimeClass === undefined) {
    console.log("Error: " + crimeName + " is not a valid crime");
    return;
  }else{
    if (document.getElementById(crimeName + "BuildingName")) {
      return;
    }
  }

  const buildingName = document.createElement("div");
  const buildingJobImprovement = document.createElement("div");
  const buildingCost = document.createElement("div");
  const BuildingOwned = document.createElement("div");
  const buyMax = document.createElement("button");
  const buyOne = document.createElement("button");

  buildingName.textContent = crimeClass.Building;
  buildingName.id = crimeName + "BuildingName";
  buildingName.className = "buildingName";

  buildingJobImprovement.textContent = crimeClass.display + " $" + summarizeNumber(crimeClass.BuildingIncome);
  buildingJobImprovement.id = crimeName + "BuildingJobImprovement";
  buildingJobImprovement.className = "buildingJobImprovement";

  buildingCost.textContent =  summarizeNumber(crimeClass.BuildingCost);
  buildingCost.id = crimeName + "BuildingCost";
  buildingCost.className = "buildingCost";

  BuildingOwned.textContent = summarizeNumber(crimeClass.BuildingsOwned);
  BuildingOwned.id = crimeName + "BuildingOwned";
  BuildingOwned.className = "buildingOwned";

  buyMax.type = "button";
  buyMax.className = crimeName + "buildingMaxButton";
  buyMax.onclick = function () {
    buyMaxBuilding(crimeName);
  };
  buyMax.textContent = "Max";

  buyOne.type = "button";
  buyOne.className = crimeName + "buildingOneButton";
  buyOne.onclick = function () {
    buyOneBuilding(crimeName);
  };
  buyOne.textContent = "1";

  container.appendChild(buildingName);
  container.appendChild(buildingJobImprovement);
  container.appendChild(buildingCost);
  container.appendChild(BuildingOwned);
  container.appendChild(buyMax);
  container.appendChild(buyOne);
}

function createBribeElements(bribeName) {
  const container = document.getElementById("Bribe-container");

  var bribeClass = bribes.find((bribeClass) => bribeClass.name === bribeName);
  if (bribeClass === undefined) {
    console.log("Error: " + bribeName + " is not a valid bribe");
    return false;
  }
  if (document.getElementById(bribeName + "BribeButton")) {
    console.log("Error: " + bribeName + " is already a bribe");
    return false;
  }
  const bribeButton = document.createElement("button");
  const bribeCooldownText = document.createElement("div");
  const bribeCooldownLdBar = document.createElement("div");
  const bribeHeatRemoved = document.createElement("div");

  bribeButton.type = "button";
  bribeButton.id = bribeName + "BribeButton";
  bribeButton.className = "bribeButton postBribe";
  bribeButton.onclick = function () {
    tryBribe(bribeName);
  };
  bribeButton.textContent = bribeClass.display;

  bribeCooldownText.id = bribeName + "CooldownText";
  bribeCooldownText.className = "BribeCooldownText";
  cooldownLeft = bribeClass.cooldownSeconds - bribeClass.secondsLeft;
  bribeCooldownText.textContent = summarizeNumber(cooldownLeft) + "/" + summarizeNumber(bribeClass.cooldownSeconds);

  bribeCooldownLdBar.id = bribeName + "ProgressBar";
  bribeCooldownLdBar.className = "ldBar label-center";
  bribeCooldownLdBar.style = "width: 38px; height: 38px;";

  bribeHeatRemoved.textContent = summarizeNumber(calculateBribeHeatRemoved(bribeName)) + "(" + summarizeNumber(bribeClass.USDtoHeat) + ")";
  bribeHeatRemoved.className = "heatRemoved";
  bribeHeatRemoved.id = bribeName + "heatRemoved";

  container.appendChild(bribeButton);
  container.appendChild(bribeCooldownText);
  container.appendChild(bribeCooldownLdBar);
  container.appendChild(bribeHeatRemoved);

  createBribeProgressBar(bribeName);
  return true;
}

function createBribeProgressBar(bribeName) {
  const barName = "#" + bribeName + "ProgressBar";
  var progressBar = new ldBar(barName, {
    stroke: "#248",
    type: "fill",
    path: "M1 1L100 1L100 100L1 100Z",
    fill: "data:ldbar/res,bubble(#248,#fff,50,1)",
    value: "0",
  });
  updateBribeProgressBar(bribeName);
}

function tryBribe(bribeName) {
  let bribeClass = bribes.find((bribeClass) => bribeClass.name === bribeName);
  if (bribeClass.secondsLeft > 0) {
    $("#messageText").text("You cannot bribe the police right now, you have to wait " + summarizeNumber(bribeClass.secondsLeft) + " seconds");
    return;
  }
  if (player.USD < calculateBribeUSD()) {
    $("#messageText").text("You do not have enough money to bribe the police right now, you need " + summarizeNumber(calculateBribeUSD()) + "$");
    return;
  }
  let heatRemoved = calculateBribeHeatRemoved(bribeName);
  let Cost = calculateBribeUSD();
  if(heatRemoved > player.heat){
    Cost = player.heat/heatRemoved * Cost;
    heatRemoved = player.heat;
  }
  player.heat -= heatRemoved;
  player.USD -= Cost;
  updateUSD();
  bribeClass.secondsLeft = bribeClass.cooldownSeconds;
  $("#messageText").text("You have " + bribeClass.display + " for " + summarizeNumber(Cost) + "$ and removed " + summarizeNumber(heatRemoved) + " heat");
  updateBribeProgressBar(bribeName);

}

function updateBribeProgressBar(bribeName) {

  var progressBarElement = document.getElementById(bribeName + "ProgressBar");
  if (!progressBarElement) {
    console.error('No progress bar element found with id:', bribeName + "ProgressBar");
    return;
  }

  var progressBar = progressBarElement.ldBar;
  if (!progressBar) {
    console.error('ldBar is not defined on the progress bar element');
    return;
  }

  const bribeClass = bribes.find((bribeClass) => bribeClass.name === bribeName);
  if (!bribeClass) {
    console.error('No bribe found with name:', bribeName);
    return;
  }

  if (bribeClass.cooldownSeconds === 0) {
    console.error('cooldownSeconds cannot be zero');
    return;
  }
  var precentFull = (bribeClass.cooldownSeconds - bribeClass.secondsLeft) / bribeClass.cooldownSeconds * 100;
  progressBar.set(precentFull, true);
}

function calculateBribeHeatRemoved(bribeName) {
  if (!bribes || !bribeName) {
    console.error('bribes or bribeName is undefined');
  } else {
    let bribeClass = bribes.find((bribeClass) => bribeClass.name === bribeName);
  
    if (!bribeClass) {
      console.error('No matching bribe found with name: ' + bribeName);
    } else {
      // Continue with your code
      let bribeClass = bribes.find((bribeClass) => bribeClass.name === bribeName);
      heatRemoved = bribeClass.USDtoHeat * player.USD * player.bribePercent/100;
      return heatRemoved;
    }
  }
  
}
function summarizeNumber(number) {
  const ranges = [
    { divider: 1e36, suffix: 'Ud', fullWord: 'Undecillion', fullWordPlural: 'Undecillions' },
    { divider: 1e33, suffix: 'Dc', fullWord: 'Decillion', fullWordPlural: 'Decillions' },
    { divider: 1e30, suffix: 'No', fullWord: 'Nonillion', fullWordPlural: 'Nonillions' },
    { divider: 1e27, suffix: 'Oc', fullWord: 'Octillion', fullWordPlural: 'Octillions' },
    { divider: 1e24, suffix: 'Sp', fullWord: 'Septillion', fullWordPlural: 'Septillions' },
    { divider: 1e21, suffix: 'Sx', fullWord: 'Sextillion', fullWordPlural: 'Sextillions' },
    { divider: 1e18, suffix: 'Qt', fullWord: 'Quintillion', fullWordPlural: 'Quintillions' },
    { divider: 1e15, suffix: 'Q', fullWord: 'Quadrillion', fullWordPlural: 'Quadrillions' },
    { divider: 1e12, suffix: 'T', fullWord: 'Trillion', fullWordPlural: 'Trillions' },
    { divider: 1e9, suffix: 'B', fullWord: 'Billion', fullWordPlural: 'Billions' },
    { divider: 1e6, suffix: 'M', fullWord: 'Million', fullWordPlural: 'Millions' },
    { divider: 1e3, suffix: 'K', fullWord: 'Thousand', fullWordPlural: 'Thousands' }
  ];

  for (let i = 0; i < ranges.length; i++) {
    if (number >= ranges[i].divider) {
      return (number / ranges[i].divider).toFixed(2) + ranges[i].suffix;
    }
  }

  return number.toString();
}


function saveGame() {
  localStorage.setItem("player", JSON.stringify(player));
  localStorage.setItem("jobs", JSON.stringify(jobs));
  localStorage.setItem("bribes", JSON.stringify(bribes));
  $("#messageText").text("Game saved");
  player.hasSaved = true;
}

function loadGame() {
  if (player.timesShoplifted > GOONUNLOCK) {
    $("#messageText").text(
      "Refresh the window before loading your game data please."
    );
    return;
  }
  playerSaved = JSON.parse(localStorage.getItem("player"));
  if (playerSaved === null) {
    $("#messageText").text("No game data saved");
    return;
  }
  if(playerSaved.version != player.version){
    if(!confirm("You are trying to load a game from version "+ playerSaved.version + "of the game. Doing this may break the game as it is currently in version "+ player.version +". Are you sure you want to continue?")){
      return;
    }
  }
  player = playerSaved;
  jobs = JSON.parse(localStorage.getItem("jobs"));
  $("#messageText").text("Game loaded. Welcome back " + player.name);
  wakeUp();
  if (player.timesShoplifted > GOONUNLOCK) {
    unlockGoonPage();
    var bribeUnlocked = false;
    for (var i = 1; i < jobs.length; i++) {
      if (!jobs[i].unlocked) {
        break;
      }
      createCrimeElements(jobs[i].name);
      if(jobs[i].heatGenerated > 0 && !bribeUnlocked){
        bribeUnlocked = true;
        unlockBribePage(true);
        bribes = JSON.parse(localStorage.getItem("bribes"));
        bribes.forEach((bribe) => {
          if(bribe.unlocked){
            createBribeElements(bribe.name);
          }
        });
        
        updateAllHeatJobText();
      }
    }
    nextJob = jobs.find((job) => !job.unlocked);
    if(nextJob != undefined){
      $('#NextJobName').text(nextJob.display);
    }
    updateGoonNums("all");
    updateObservedJobs();
    if(bribeUnlocked){
      updateAllHeatJobText();
      updateAllBribeCounters();
    }
    
  }
}
// Call the function to create the buttons

//Updating constantly
window.setInterval(function () {
  if (!pageLoaded) {
    return;
  }
  if ($(".postGoon").is(":visible")) {
    goonsWork();
  }
  if ($(".postBribe").is(":visible")) {
    if (player.heat > 0) {
      player.heat -= parseFloat(player.heatDecay*UPDATETIMESECONDS).toFixed(10);
      calculateGoonsImprisoned();
      updateHeatNumbers();
    }

    if(ticksSinceLastBribeUpdate >= UPDATESPERSECOND){
      updateAllBribeCounters();
      ticksSinceLastBribeUpdate = 0;
    }else{ticksSinceLastBribeUpdate++;}
    
  }
  if (player.energy < player.energyMax) {
    player.energy += parseFloat(
      (player.energyRegenPerSecond * UPDATETIMESECONDS).toFixed(10)
    );
    updateCurrentEnergy();
  }
}, UPDATETIMEMILISECONDS);
