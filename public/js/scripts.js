const closeButton = document.getElementById("close");
if (closeButton) {
    closeButton.addEventListener("click", () => {
        const dialog = document.getElementById("dialog");
        if (dialog) {
            dialog.close();
        }
    });
}
import { io } from "socket.io-client";
const socket = io();
function showDialog(detailsTextContent, dialogTitle, x, y) {
    return new Promise((resolve, reject) => {
        // Create the dialog element
        const dialog = document.createElement("dialog");
        dialog.style.position = "fixed";
        dialog.style.margin = "0"; // Ensure no default centering
        dialog.style.padding = "0"; // Remove default padding for better alignment
        //  dialog.style.transform=`translate(${x}px, ${y+20}px)`; // Position 20px below the click
        dialog.style.transform = "translateX(-50%)"; //
        dialog.style.left = "50%";
        dialog.style.top = "10vh";
        dialog.style.width = "80vw";
        dialog.style.maxWidth = "80vw";
        dialog.style.maxHeight = "80vh";
        dialog.style.borderRadius = "8px";
        // Create a container for the dialog content
        const container = document.createElement("div");
        container.classList.add("w3-container");
        container.style.padding = "20px"; // Padding within the container for content
        // Create and style the header
        const header = document.createElement("h3");
        header.textContent = dialogTitle;
        // Create the paragraph for the details
        const paragraph = document.createElement("p");
        paragraph.innerHTML = detailsTextContent;
        // Create the close button
        const closeButton = document.createElement("button");
        closeButton.classList.add("w3-button", "w3-red");
        closeButton.textContent = "Close";
        // Event listener to close and remove the dialog
        closeButton.addEventListener("click", () => {
            dialog.close();
            dialog.remove();
        });
        // Append elements to the container and dialog
        container.appendChild(header);
        container.appendChild(paragraph);
        container.appendChild(closeButton);
        dialog.appendChild(container);
        // Append the dialog to the body and display it
        document.body.appendChild(dialog);
        dialog.showModal();
        // Resolve the promise when the dialog is closed
        dialog.addEventListener("close", () => {
            resolve("Dialog closed");
        });
    });
}
// this function will format the jobAnalysis object into a nice HTML string
function formatAnalysis(jobAnalysis) {
    let analysisDisplay = "";
    for (const [key, obj] of Object.entries(jobAnalysis)) {
        analysisDisplay += `<h3>${key}</h3>`;
        analysisDisplay += "<ul>";
        for (const [k, vObj] of Object.entries(obj)) {
            // we switch case the key here to change formatting by key type
            switch (key) {
                case "scenarios":
                    const scenario = vObj;
                    analysisDisplay += `<li>${scenario.name} <br> ${scenario.comments}`;
                    analysisDisplay += `<ul><li>StartTime:${vObj.startTime}</li>`;
                    analysisDisplay += `<li>EndTime:${vObj.endTime}</li>`;
                    analysisDisplay += `<li>DurationInDays:${vObj.durationInDays}</li></ul>`;
                    break;
                case "ignitions":
                    analysisDisplay += `<li>${vObj.name} <br> ${vObj.type}`;
                    if (vObj.type === "POINT") {
                        analysisDisplay += `<ul><li>Latitude:${vObj.location.coordinates[1]}</li>`;
                        analysisDisplay += `<li>Longitude:${vObj.location.coordinates[0]}</li></ul>`;
                    }
                    break;
                case "burnConditions":
                    analysisDisplay += `<li>${vObj.scenarioName} <br>`;
                    analysisDisplay += `<ul>Conditions:<br>`;
                    // now we iterate the vObj.burnConditions array
                    // and extract date, and all paramaters and values
                    for (const [i, condition] of vObj.burnConditions.entries()) {
                        // analysisDisplay+=`<li>${i+1}. ${condition}`;
                        // console.log("Condition:", condition);
                        // now we iterate the condition object
                        for (const [param, value] of Object.entries(condition)) {
                            analysisDisplay += `<li>${param}: ${value}</li>`;
                        }
                    }
                    analysisDisplay += `</ul>`;
                    break;
                case "fuelTypes":
                    analysisDisplay += `<li>${vObj.type}: ${vObj.name}`;
                    break;
                case "temporalAnalysis":
                    // here we iterate the temporalAnalysis string array
                    // and display each string
                    for (const [i, str] of vObj.entries()) {
                        analysisDisplay += `<li>${str}`;
                    }
                    break;
                default:
                    analysisDisplay += `<li>${k}: ${vObj.value}`;
            }
            //    analysisDisplay+= `<li>${k}: ${vObj.value}`;
            console.log("Key", key, "vObj:", vObj);
        }
        analysisDisplay += "</ul>";
    }
    return analysisDisplay;
}
// this function will render divs for each model run in the display-panel div
function renderRunList(data) {
    console.log("renderRunList data:", data);
    let displayPanel = document.getElementById("display-panel");
    // now clear the display panel
    if (displayPanel)
        displayPanel.innerHTML = "";
    // now lets update the refresh-block element
    let refreshBlock = document.getElementById("refresh-block");
    let currentLocalDateTimeString = new Date().toLocaleString();
    if (refreshBlock)
        refreshBlock.innerHTML = "Last Refreshed: " + currentLocalDateTimeString;
    //iterate over the objects in the data array
    data.runs.forEach((run) => {
        let runDateStr = run.jobDir.split('_')[1];
        // Extract the relevant parts for year, month, day, hour, minute, second
        const year = runDateStr.substring(0, 4);
        const month = runDateStr.substring(4, 6) - 1; // Months are zero-based in JavaScript Date
        const day = runDateStr.substring(6, 8);
        const hour = runDateStr.substring(8, 10);
        const minute = runDateStr.substring(10, 12);
        const second = runDateStr.substring(12, 14);
        // Create a new Date object
        const dateObject = new Date(year, month, day, hour, minute, second);
        let runDate = dateObject.toLocaleString();
        let div = document.createElement("div");
        div.classList.add("w3-row");
        let div1 = document.createElement("div");
        div1.classList.add("w3-col", "s1");
        let img = document.createElement("img");
        img.src = "images/favicon-64.png";
        img.style.width = "40px";
        div1.appendChild(img);
        // let br = document.createElement("br");
        // div1.appendChild(br);
        //div1.appendChild(jobStatus);
        div.appendChild(div1);
        let div2 = document.createElement("div");
        div2.classList.add("w3-col", "s11", "w3-container");
        let job = document.createElement("div");
        job.classList.add("w3-padding-16");
        let jobIcon = document.createElement("i");
        jobIcon.title = "Job Number";
        jobIcon.classList.add("fa-solid", "fa-list-check", "fa-fw");
        let jobText = document.createTextNode(run.jobDir);
        let nbspJob = document.createTextNode("\u00A0");
        job.appendChild(jobIcon);
        job.appendChild(nbspJob);
        job.appendChild(jobText);
        let execDate = document.createElement("div");
        execDate.classList.add("w3-padding-16");
        let i = document.createElement("i");
        i.title = "Run Date";
        i.classList.add("fa-solid", "fa-calendar-days", "fa-fw");
        // make nbsp
        let nbspP = document.createTextNode("\u00A0");
        let pTxt = document.createTextNode(runDate);
        execDate.appendChild(i);
        execDate.appendChild(nbspP);
        execDate.appendChild(pTxt);
        div2.appendChild(job);
        div2.appendChild(execDate);
        // now we will list out the scenarios
        let scenarios = document.createElement("div");
        // w3.css add padding top and bottom
        scenarios.classList.add("w3-padding-16");
        for (const element of run.scenarios) {
            let scenario = document.createElement("div");
            let scenarioIcon = document.createElement("i");
            //<i class="fa-light fa-fire-burner"></i>
            scenarioIcon.title = "Scenarios";
            scenarioIcon.classList.add("fa-solid", "fa-fire-burner", "fa-fw");
            let nbspScenario = document.createTextNode("\u00A0");
            let scenarioText = document.createTextNode(element);
            scenario.appendChild(scenarioIcon);
            scenario.appendChild(nbspScenario);
            scenario.appendChild(scenarioText);
            scenarios.appendChild(scenario);
        }
        let brScenarios = document.createElement("br");
        if (run.scenarios.length > 0)
            div2.appendChild(scenarios);
        let status = document.createElement("div");
        status.classList.add("w3-padding-16");
        let jobStatus = renderJobStatus(run.status);
        status.appendChild(jobStatus);
        //div2.appendChild(jobStatus);
        let statusNbsp = document.createTextNode("\u00A0");
        status.appendChild(statusNbsp);
        //div2.appendChild(statusNbsp);
        let statusSpan = document.createElement("span");
        // statusSpan.classList.add("w3-text-black");
        // statusSpan.classList.add("w3-padding-16");
        // change the icon to a finger on hover
        statusSpan.style.cursor = "pointer";
        let statusTxt = document.createTextNode("Model: " + run.status.charAt(0).toUpperCase() + run.status.substring(1));
        statusSpan.appendChild(statusTxt);
        status.appendChild(statusSpan);
        div2.appendChild(status);
        //<i class="fa-solid fa-magnifying-glass-chart"></i>
        let analysis = document.createElement("div");
        let analysisIcon = document.createElement("i");
        analysisIcon.title = "Analysis";
        analysisIcon.classList.add("fa-solid", "fa-magnifying-glass-chart", "fa-fw");
        let nbspAnalysis = document.createTextNode("\u00A0");
        let analysisText = document.createTextNode("Job Analysis");
        let analysisSpan = document.createElement("span");
        analysisSpan.appendChild(analysisText);
        analysisSpan.style.cursor = "pointer";
        analysis.appendChild(analysisIcon);
        analysis.appendChild(nbspAnalysis);
        analysis.appendChild(analysisSpan);
        analysis.classList.add("w3-padding-16");
        div2.appendChild(analysis);
        analysisSpan.addEventListener("click", (event) => {
            // now lets select the div containing this statusSpan that has the class w3-row
            let div = event.target?.closest(".w3-row");
            // now add a red border to the div until we close the dialog
            if (div)
                div.style.border = "2px solid red";
            // Prevent the default action
            event.preventDefault();
            //show it and when we close it, remove the red border
            let analysisDisplay = formatAnalysis(run.jobAnalysis);
            showDialog(analysisDisplay, "Job Analysis", 20, 20)
                .then((result) => {
                //now lets remove the red border    
                if (div)
                    div.style.border = "none";
            }).catch((err) => {
            });
        });
        let detailsText = run.statusMessage.join("<br>");
        // Add event listeners for both click and touch
        statusSpan.addEventListener("click", (event) => {
            // now lets select the div containing this statusSpan that has the class w3-row
            let div = event.target?.closest(".w3-row");
            // now add a red border to the div until we close the dialog
            div.style.border = "2px solid red";
            // Prevent the default action
            event.preventDefault();
            //show it and when we close it, remove the red border
            showDialog(detailsText, "Model Status Details", 20, 20)
                .then((result) => {
                //now lets remove the red border    
                div.style.border = "none";
            }).catch((err) => {
            });
        });
        statusSpan.addEventListener("touchstart", (event) => {
            // now lets select the div containing this statusSpan that has the class w3-row            
            let div = event.target?.closest(".w3-row");
            // now add a red border to the div until we close the dialog
            div.style.border = "2px solid red";
            // Prevent the default action
            event.preventDefault();
            const touch = event.touches[0]; // Use the first touch point for coordinates
            showDialog(detailsText, "Model Status Details", 20, 20);
        });
        div.appendChild(div2);
        displayPanel?.appendChild(div);
        let hr = document.createElement("hr");
        displayPanel?.appendChild(hr);
    });
}
// this function will take a data object and return an html element based list with links to the files.
function createList(incomingData) {
    let data = incomingData.data;
    console.log("createList data:", data);
    let list = document.createElement("ul");
    data.forEach((file) => {
        let JSON = document.createElement("li");
        let aJson = document.createElement("a");
        aJson.href = "./" + file.JSON;
        aJson.innerText = file.JSON;
        JSON.appendChild(aJson);
        let KML = document.createElement("li");
        let aKml = document.createElement("a");
        aKml.href = "./" + file.KML;
        aKml.innerText = file.KML;
        KML.appendChild(aKml);
        let Summary = document.createElement("li");
        let aSummary = document.createElement("a");
        aSummary.href = "./" + file.Summary;
        aSummary.innerText = file.Summary;
        Summary.appendChild(aSummary);
        let h3 = document.createElement("h3");
        h3.innerText = file.jobDir;
        list.appendChild(h3);
        list.appendChild(JSON);
        list.appendChild(KML);
        list.appendChild(Summary);
    });
    return list;
}
function updateUI(data) {
    console.log("updateUI data:", data);
    const dialog = document.getElementById("dialog");
    let list = createList(data);
    if (dialog) {
        const ulElement = dialog.querySelector("ul");
        if (ulElement) {
            dialog.replaceChild(list, ulElement);
        }
    }
    if (dialog && !dialog.open) {
        dialog.showModal();
    }
    const dataDisplay = document.getElementById("dataDisplay");
    if (dataDisplay) {
        dataDisplay.innerText = data.message;
    }
}
socket.on("server_data", (data) => {
    console.log("server_data data:", data);
    const dataDisplayElement = document.getElementById("dataDisplay");
    if (dataDisplayElement) {
        dataDisplayElement.innerText = data.message;
    }
    renderRunList(data);
});
function requestUpdate() {
    socket.emit("request_update");
}
socket.on("update_data", (data) => {
    console.log("update_data data:", data);
    const dataDisplay = document.getElementById("dataDisplay");
    if (dataDisplay) {
        dataDisplay.innerText = data.ts + ": " + data.data;
    }
    updateUI(data);
});
function renderJobStatus(status) {
    console.log("renderJobStatus status:", status);
    let jobStatus = document.createElement("i");
    jobStatus.title = status;
    switch (status) {
        case "pending":
            jobStatus.classList.add("fa-solid", "fa-hourglass-start", "fa-fw", "w3-text-grey");
            break;
        case "running":
            jobStatus.classList.add("fa-solid", "fa-hourglass-half", "fa-fw", "w3-text-green");
            break;
        case "complete":
            jobStatus.classList.add("fa-solid", "fa-hourglass-end", "fa-fw", "w3-text-green");
            break;
        case "failed":
            // jobStatus.classList.add("fa-solid", "fa-hourglass-start", "fa-stack-1x", "w3-text-brown");
            jobStatus.classList.add("fa-solid", "fa-ban", "fa-fw", "w3-text-red");
            // let failedStatus=document.createElement("span");
            // failedStatus.classList.add("fa-stack");
            // let failedIcon=document.createElement("i");
            // failedIcon.classList.add("fa-solid", "fa-ban", "fa-stack-2x", "w3-text-red");
            // // clone the jobStatus
            // let originalStatusIcon=jobStatus.cloneNode(true);
            // failedStatus.appendChild(originalStatusIcon);
            // failedStatus.appendChild(failedIcon);
            // jobStatus=failedStatus;
            break;
        default:
            jobStatus.classList.add("fa-solid", "fa-question", "fa-fw");
    }
    return jobStatus;
}
let aboutIcon = document.getElementById("about-button");
// change the cursor to a pointer
if (aboutIcon)
    aboutIcon.style.cursor = "pointer";
if (aboutIcon)
    aboutIcon.addEventListener("click", (event) => {
        showDialog("This is a simple web application that displays the status of model runs on a server. It uses a Node.js server with Socket.io to push updates to the client. The client is a simple HTML page with some JavaScript to handle the updates. The server is a simple Node.js server that uses the fs module to read the files in a directory and send the data to the client. The client uses the Socket.io library to listen for updates from the server and update the UI.", "About", 20, 20);
    });
