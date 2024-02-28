const GOONBASECOST = 1;
const UPDATETIMEMILISECONDS = 50;
const UPDATETIMESECONDS = UPDATETIMEMILISECONDS / 1000;
const UPDATESPERSECOND = 1 / UPDATETIMESECONDS;
const GOONUNLOCK = 2;
const GOONMAXMANIPULATE = 1000000;

var pageLoaded = false;

function wakeUp() {
  //sheeple
  hideAllPages(document.getElementById("CrimePage")); //hiding all pages but the starting crime page
  updateGoonPrice();
  hideLockedElements();
  updateCurrentEnergy();
  updateEnergyMax();
  updateCostNewJob();
  console.log(
    "Updating every " +
      UPDATETIMESECONDS +
      " seconds, so there are " +
      UPDATESPERSECOND +
      " updates per second."
  ); //if you want to see how often the game updates
  console.log("in player: " + player.USD);
  
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

//crimes page
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
      "You do not have " + player.goonX + " goons free right now. Adding all "+ player.goonsFree  +" free goons to " + goonJob.display + " instead."
    );
    goonJob.goonsWorking = goonJob.goonsWorking + player.goonsFree;
    player.goonsFree = 0;
    updateGoonNums(goonJob.name, true);
  }
  if (goonJob.goonsWorking > determineGoonCap(job)) {
    var oldtext = $("#messageText").text();
    $("#messageText").text(oldtext + ' You have added too many goons to ' + goonJob.display + ' it will not make it go faster. Consider capping the goons on ' + goonJob.display + ' to make the most of your goons.');
  }
}

function removeGoons(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  if (goonJob.goonsWorking == 0) {
    $("#messageText").text("You do not have any goons working on " + goonJob.display + " right now");
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
function hireMaxGoonClicked(maxGoon = 2**10, capped = false) {
  var buying = true;
  var goonCount = 0;
  const incomingMaxGoon = maxGoon;
  if(maxGoon != 2**10){
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

  console.log("You bought " + goonCount + " goons");

  if (goonCount > 1) {
    $("#messageText").text("You have hired " + goonCount + " Goons");
  } else if (goonCount == 1) {
    $("#messageText").text("You have hired a Goon");
  } else {
    cashNeeded = player.goonPrice - player.USD;
    $("#messageText").text(
      "You do not have enough money to hire a Goon right now. You need " +
        cashNeeded +
        "$ more to hire a Goon"
    );
  }
  if (goonCount > 0) {
    updateGoonNums();
    updateUSD();
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
  console.log("You bought " + jobCount + " jobs");
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

function observeCrime(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  if(goonJob.observed){
    goonJob.observed = false;
    player.observing--;
    $("#messageText").text("You are no longer observing " + job);
    $("#"+job+"ObserveButton").text("🕶️");
    return;
  }
  if (player.observing < player.observeMax) {
    goonJob.observed = true;
    player.observing++;
    $("#messageText").text("You are now observing " + job);
    $("#"+job+"ObserveButton").text("👁️");
  } else {
    $("#messageText").text("You are already observing " + player.observeMax + " jobs");
  }
}

//helper funcitons
function unlockGoonPage() {
  $(".postGoon").show();
  createCrimeElements("Shoplift");
  $("#starterButton").hide();
  createCrimeHeaders();
}
function buyNewJob() {
  if (player.nextJobName == " ") {
    $("#messageText").text("You have unlocked all the crimes");
    return;
  }
  job = jobs.find((job) => job.name === player.nextJobName);

  if (player.USD >= player.nextJobCost) {
    player.USD -= player.nextJobCost;
    job.unlocked = true;
    createCrimeElements(player.nextJobName);
    $("#messageText").text(
      "You have unlocked the ability to " +
        job.display +
        " for " +
        player.nextJobCost +
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
        cashNeeded +
        "$ more to unlock " +
        job.display
    );
    return false;
  }
}
function buyGoon(Goonnum = 1, silent = false) {
  var transactionPrice = 0;
  if (Goonnum > 1) {
    for (
      var transactionGoon = 0;
      transactionGoon < Goonnum;
      transactionGoon++
    ) {
      transactionPrice += calculateGoonPrice(
        player.goonsTotal + transactionGoon
      );
    }
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
          player.goonPrice * Goonnum +
          "$ to hire " +
          Goonnum +
          " Goons right now";
      }
      if (Goonnum == 1) {
        document.getElementById("messageText").innerHTML =
          "Sorry you need " + player.goonPrice + "$ to hire a Goon right now";
      }
    }
    return false;
  }
}

function updateUSD() {
  document.getElementById("USDNum").innerHTML = player.USD;
}

function updateGoonNums(jobName = " ", silent = false) {
  updateGoonPrice();
  document.getElementById("GoonNum").innerHTML = String(
    player.goonsFree + "/" + player.goonsTotal
  );
  if (jobName === "all") {
    jobs.forEach((job) => {
      $("#" + job.name + "goonsAssignedText").text(job.goonsWorking);
    });
  } else if (jobName != " ") {
    let goonJob = jobs.find((goonJob) => goonJob.name === jobName);
    if (!silent) {
      $("#messageText").text(
        goonJob.goonsWorking + " goons working on " + jobName
      );
    }
    $("#" + goonJob.name + "goonsAssignedText").text(goonJob.goonsWorking);
  }
}

function updateGoonPrice() {
  player.goonPrice = calculateGoonPrice(player.goonsTotal);
  $("#goonPrice").text(player.goonPrice);
  return goonPrice;
}

function calculateGoonPrice(Goons) {
  return Math.round((GOONBASECOST + (Goons + 1) * 10) * player.goonDiscount);
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
      if (job.observed) {
        player.USD += job.money + job.money * player.managementMultiplier;
      } else {
        player.USD += job.money;
      }

      job.worked = 0;
      updateUSD();
    }
    $("#" + job.name + "ProgressText").text(
      Math.round(job.worked * 10) / 10 + "/" + job.work
    );
  });
  if (!preGoon) {
    updateProgressBars();
  }
}

function updateCostNewJob() {
  let nextJob = jobs.find((job) => !job.unlocked);

  if (nextJob && player.nextJobName != nextJob.name) {
    player.nextJobName = nextJob.name;
    player.nextJobCost = nextJob.unlockCost;
    $("#NextJobCost").text(player.nextJobCost);
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
  $("#EnergyNum").text(Math.round(player.energy));
}

function updateEnergyMax() {
  $("#EnergyMaxNum").text(Math.round(player.energyMax));
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
    });
  }
  player.observing = numberObserved;
}

function createCrimeHeaders() {
  const container = document.getElementById("crime-container-header");
  const observeHeader = document.createElement("div");
  const progressHeader = document.createElement("div");
  const goonHeader = document.createElement("div");

  observeHeader.textContent = "Personal Actions";
  progressHeader.textContent = "Progress";
  goonHeader.textContent = "Goons";

  container.appendChild(observeHeader);
  container.appendChild(progressHeader);
  container.appendChild(goonHeader);
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
      "You have capped " + job + " with " + goonJob.goonsWorking + " goons"
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
            job +
            " with " +
            goonJob.goonsWorking +
            " goons, but it could have been done with " +
            goonsWanted +
            " goons, it completes in " +
            jobtime +
            " seconds. " +
            goonSubtraction +
            " goons have been removed for optimal goon usage"
        );
        goonJob.goonsWorking -= goonSubtraction;
        player.goonsFree += goonSubtraction;
        updateGoonNums(goonJob.name, true);
      } else {
        $("#messageText").text(
          "You have reached cap for " +
            job +
            " with " +
            goonJob.goonsWorking +
            " goons, it completes in " +
            jobtime +
            " seconds."
        );
      }
    } else {
      if (goonAssignment == 0) {
        $("#messageText").text(
          "You do not have enough goons to make " +
            job +
            " complete faster right now, you would need " +
            goonsNeeded +
            " more free goons to make a difference. The current cap you can reach is " +
            goonsWanted +
            " " +
            job +
            " completes in " +
            jobtime +
            " seconds."
        );
      } else {
        $("#messageText").text(
          "You do not have enough goons to make " +
            job +
            " complete faster right now, you would need " +
            goonsNeeded +
            " more free goons to make a difference. The current cap you can reach is " +
            goonsWanted +
            " It completes in " +
            jobtime +
            " seconds. You now have " +
            goonJob.goonsWorking +
            " goons working on " +
            job +
            " after reassigning " +
            goonAssignment +
            " goons"
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

  // 🕶️Set properties👓
  observeButton.type = "button";
  observeButton.id = crimeName + "ObserveButton";
  observeButton.className = "crimeUIButton postGoon observeButton";
  observeButton.onclick = function () {
    observeCrime(crimeName);
  };
  observeButton.textContent = "🕶️";

  personalcrime.type = "button";
  personalcrime.textContent = jobs.find(
    (job) => job.name === crimeName
  ).display;
  personalcrime.className = "crimeUIButton";
  personalcrime.onclick = function () {
    personalCrimeButtonClicked(crimeName);
  };

  progressText.id = crimeName + "ProgressText";
  progressText.textContent =
    "0/" + jobs.find((job) => job.name === crimeName).work;
  progressText.className = "progressText crimeProgressText";

  progressBar.id = crimeName + "ProgressBar";
  progressBar.className = "ldBar label-center";
  progressBar.style = "width: 38px; height: 38px;";

  goonsAssignedText.textContent = "0";
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

function saveGame() {
  localStorage.setItem("player", JSON.stringify(player));
  localStorage.setItem("jobs", JSON.stringify(jobs));
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
  player = JSON.parse(localStorage.getItem("player"));
  jobs = JSON.parse(localStorage.getItem("jobs"));
  $("#messageText").text("Game loaded. Welcome back " + player.name);
  wakeUp();
  if (player.timesShoplifted > GOONUNLOCK) {
    unlockGoonPage();
    for (var i = 1; i < jobs.length; i++) {
      if (!jobs[i].unlocked) {
        break;
      }
      createCrimeElements(jobs[i].name);
    }
    $('#NextJobName').text(jobs.find((job) => !job.unlocked).display);
    updateGoonNums("all");
    updateObservedJobs();
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
  if (player.energy < player.energyMax) {
    player.energy += parseFloat(
      (player.energyRegenPerSecond * UPDATETIMESECONDS).toFixed(10)
    );
    updateCurrentEnergy();
  }
}, UPDATETIMEMILISECONDS);
