
interface StepLib {
    [key: string]: {
        target?: string;
        description?: string;
        adminNote?: string;
        choice?: string[];
        pointLatLon?: {
            description: string;
            inputs: string[];
        };
        pointMap?: {};
        polygonGeojson?: {};
        polygonMap?: {};
        choiceFunction?: Function; // Add choiceFunction property
        choiceArgs?: string[]; // Add choiceArgs property
    };
}
//function to create a multi step inputs wizard - takes an abstract object as inout
// this will initiliZw an html5 dialog element in modal mode, and then step through the inputs
// using the abstract object to define the steps. for gui elements we will use html elments styled with 
// w3.css but we will not use w3-modal

// the abstract object will contain the following properties
// {
//     "name": "SGP Model",
//     "filename": "sgp_model",
//     "description": "This is a Standardized Growth Potential model which is a 24 hour model run, using a single ignition point and a single weather stream at the ignitin location. The single forcast is then altered using the +5temp -5RH as the worst case and -5temp and +5RH as best case. A scenario is output for each case",
//     "inputs": [
//         "ignition",
//         "weather",
//         "modelStart",
//         "fireName"
//     ]
// }
const createWizard = (abstract: any) => {
    let dialog = document.createElement('dialog');
    dialog.id = 'WizardInputs';
    document.body.appendChild(dialog);
    dialog.style.width = '80vw';
    dialog.style.height = '80vh';
    dialog.style.overflow = 'auto';
    dialog.style.backgroundColor = 'white';
    dialog.style.padding = '20px';
    dialog.style.border = '1px solid black';
    dialog.style.borderRadius = '5px';
    dialog.style.position = 'fixed';
    dialog.style.top = '10vh';
    dialog.style.left = '10vw';
    dialog.style.zIndex = '1000';

    let step = 0;
    let steps = abstract.inputs.length;
    let inputs = {};
    let nextButton = document.createElement('div');
    nextButton.className = 'w3-button w3-blue w3-round w3-right';
    nextButton.textContent = 'Next';
    nextButton.style.marginTop = '10px';
    nextButton.style.marginRight = '10px';
    //nextButton.style.display = 'none';
    dialog.appendChild(nextButton);
    let backButton = document.createElement('div');
    backButton.className = 'w3-button w3-blue w3-round w3-right';
    backButton.textContent = 'Back';
    backButton.style.marginTop = '10px';
    backButton.style.marginRight = '10px';
   // backButton.style.display = 'none';
    dialog.appendChild(backButton);
    let cancelButton = document.createElement('div');
    cancelButton.className = 'w3-button w3-red w3-round w3-right';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.marginTop = '10px';
    cancelButton.style.marginRight = '10px';
    // add handler to cancel button
    cancelButton.addEventListener('click', function () {
        dialog.close();
        // now destroy the dialog
        dialog.remove();
    });
    dialog.appendChild(cancelButton);
    let finishButton = document.createElement('div');
    finishButton.className = 'w3-button w3-green w3-round w3-right';
    finishButton.textContent = 'Finish';
    finishButton.style.marginTop = '10px';
    finishButton.style.marginRight = '10px';
 //   finishButton.style.display = 'none';
    dialog.appendChild(finishButton);
    let content = document.createElement('div');
    dialog.appendChild(content);
    let title = document.createElement('h3');
    title.textContent = abstract.name;
    content.appendChild(title);
    let description = document.createElement('p');
    description.textContent = abstract.description;
    content.appendChild(description);
  


    // now we will iterate over the inputs and create the form elements
    let wizardSteps = abstract.inputs
    let stepDivs:any[] = [];
    let currentStep = 0;
    for (let i = 0; i < wizardSteps.length; i++) {
        let stepDiv = document.createElement('div');
        console.log();
        stepDiv.id = 'step' + i;
      //  stepDiv.style.display = 'none';
        stepDivs.push(stepDiv);
        let stepTitle = document.createElement('h4');
        stepTitle.textContent = wizardSteps[i];
        stepDiv.appendChild(stepTitle);
        let stepContent = document.createElement('div');
        stepDiv.appendChild(stepContent);

        let stepData: any = stepLib[wizardSteps[i]];
        console.log('stepData', stepData);
        if (stepData.description) {
            let stepDescription = document.createElement('p');
            stepDescription.textContent = stepData.description;
            stepContent.appendChild(stepDescription);
        }
        if (stepData.adminNote) {
            let stepAdminNote = document.createElement('p');
            stepAdminNote.textContent = stepData.adminNote;
            stepContent.appendChild(stepAdminNote);
        }

        if (stepData.choice) {
            let choice = document.createElement('select');
            choice.id = wizardSteps[i] + 'Choice';
            choice.className = 'w3-select w3-border w3-round';
            stepContent.appendChild(choice);
            let choices = stepData.choice;
            for (let j = 0; j < choices.length; j++) {
                let option = document.createElement('option');
                option.value = choices[j];
                option.textContent = choices[j];
                choice.appendChild(option);
            }
        }
        else if (stepData.choiceFunction) {
            let choice = document.createElement('select');
            choice.id = wizardSteps[i] + 'Choice';
            choice.className = 'w3-select w3-border w3-round';
            stepContent.appendChild(choice);
            let choices = stepData.choiceFunction(...stepData.choiceArgs);
            for (let j = 0; j < choices.length; j++) {
                let option = document.createElement('option');
                option.value = choices[j];
                option.textContent = choices[j];
                choice.appendChild(option);
            }
        }
        else {

        let input = document.createElement('input');
        input.type = 'text';
        input.id = wizardSteps[i];
        input.className = 'w3-input w3-border w3-round';
        stepContent.appendChild(input);
        }
        content.appendChild(stepDiv);
    }




    return {dialog,stepDivs};
    


}

function generateWeatherChoices () {
    return ['model1', 'model2', 'model3', 'model4'];
}

const stepLib: StepLib = {
    modelStart: {},
    fireName: {},
    ignition: {
        target: "ignitionGeometry",
        description: "This is the ignition geometry for the fire",
        adminNote: "This is the ignition geometry for the fire, it will be saved as a geojson geometry called ignition geometry",
        choice: ["pointLatLon)", "pointMap", 'polygonGeojson', 'polygonMap'],
        pointLatLon: {
            description: "This is the ignition point for the fire",
            inputs: ["latitude", "longitude"]
        },
        pointMap: {},
        polygonGeojson: {},
        polygonMap: {}
    },
    weather: {
        description: "This is the weather model for the forecast",
        adminNote: "This is the weather for model for the forecast, it and the point/centroid will be used to generate a forecast, it will be saved as a text string in weather stream format called weather stream",
        choiceFunction: generateWeatherChoices,
        choiceArgs: ["ignitionGeometry", "point-map", 'polygon(geojson)', 'polygon-map'],
        "pointLatLon": {
            description: "This is the weather point for the fire",
            inputs: ["latitude", "longitude"]
        },
    }
};


export { createWizard }