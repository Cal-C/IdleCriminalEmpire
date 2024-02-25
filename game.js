const GOONBASECOST = 1;
const UPDATETIMEMILISECONDS = 50;
const UPDATETIMESECONDS = UPDATETIMEMILISECONDS / 1000;
const UPDATESPERSECOND = 1 / UPDATETIMESECONDS;




function wakeUp() {//sheeple
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
}

//window.onload = wakeUp(); 
//button functions
//topPage
function menuNavClicked(whatPage) {
  hideAllPages();
  whatPage.hidden = false;
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

  if (player.timesShoplifted > 2) {
    if (!$(".postGoon").is(":visible")) {
      unlockGoonPage();
      $("#messageText").text(
        "You have unlocked the ability to hire goons to help you with your crimes"
      );
    }
  } else {
    player.timesShoplifted++;
  }
}

function addGoons(job) {
  if (player.goonsFree - player.goonX >= 0) {
    let goonJob = jobs.find((goonJob) => goonJob.name === job);
    goonJob.goonsWorking += player.goonX;
    player.goonsFree -= player.goonX;
    updateGoonNums(goonJob.name);
  } else {
    $("#messageText").text(
      "You do not have " + player.goonX + " goons free right now"
    );
  }
}

function removeGoons(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
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
        " right now"
    );
  }
}

//goon page
function hireGoonClicked() {
  buyGoon();
}
function hireMaxGoonClicked() {
  var buying = true;
  var goonCount = 0;

  if (player.USD/player.goonPrice < 2 ** 10) { //if you have enough money to buy 1024 goons (at current prices) do a binary search of how many goons you can actually buy starting at 1024
    var tryBuying = 2 ** 10;
    while (buying) {
      buying = buyGoon(tryBuying, true);
      if (buying) {
        goonCount += tryBuying;
      } else {
        if (tryBuying != 1) {
          tryBuying = Math.round(tryBuying / 2);
          buying = true;
        }
      }
    }
  } 
  else {
    goonCount--;
    while (buying) {
      buying = buyGoon(1, true);
      goonCount++;
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

//helper funcitons
function unlockGoonPage() {
  $(".postGoon").show();
  createCrimeElements("Shoplift");
  $("#starterButton").hide();
  createCrimeHeaders();
}
function buyNewJob() {
  if(player.nextJobName == " "){
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
      transactionPrice += calculateGoonPrice(player.goonsTotal + transactionGoon);
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

function updateGoonNums(jobName = " " , silent = false) {
  updateGoonPrice();
  document.getElementById("GoonNum").innerHTML = String(
    player.goonsFree + "/" + player.goonsTotal
  );
  if(jobName === "all"){
    jobs.forEach((job) => {
      $("#" + job.name + "goonsAssignedText").text(job.goonsWorking);
    });
  
  }else if (jobName != " ") {
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
  return Math.round(
    (GOONBASECOST + (Goons + 1) * 10 + 1.01 ** (Goons + 1)) * player.goonDiscount
  );
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
  player.goonsFree = player.goonsTotal - player.goonsImprisioned;
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
        player.USD += job.money + job.money * player.mangmentMultiplier;
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

function capGoons(job) {
  let goonJob = jobs.find((goonJob) => goonJob.name === job);
  //calculate how many goons can be added without redundency
  var goonsWanted = goonJob.work * UPDATESPERSECOND; //how many goons are needed to make the job complete every update
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
    if (jobtime == UPDATETIMESECONDS) {
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
            " more goons to make a difference. The current cap you can reach is " +
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
            " more goons to make a difference. The current cap you can reach is " +
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

function createCrimeElements(crimeName) {
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
  observeButton.className = "crimeUIButton postGoon observeButton";
  observeButton.onclick = function () {
    monitorActivity(crimeName);
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

  console.log(
    "Creating crime elements for " +
      crimeName +
      " goonLabel is " +
      goonsAssignedText
  );

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
  console.log("Game saved");
  player.hasSaved = true;
}
function loadGame() {
  player = JSON.parse(localStorage.getItem("player"));
  jobs = JSON.parse(localStorage.getItem("jobs"));
  console.log("Game loaded");
  wakeUp();
  if (player.timesShoplifted > 2) {
    unlockGoonPage();
    for (var i = 1; i < jobs.length; i++) {
      if (!jobs[i].unlocked) {
          break;
      }
      createCrimeElements(jobs[i].name);
  }
  updateGoonNums("all");
    
  }
  $("#messageText").text("Game loaded");
}
// Call the function to create the buttons

//Updating constantly
window.setInterval(function () {
  if ($(".postGoon").is(":visible")) {
    goonsWork();
  }
  if (player.energy <player.energyMax) {
   player.energy += parseFloat(
      (player.energyRegenPerSecond * UPDATETIMESECONDS).toFixed(10)
    );
    updateCurrentEnergy();
  }
}, UPDATETIMEMILISECONDS);
