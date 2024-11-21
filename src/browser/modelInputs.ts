

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
    nextButton.style.display = 'none';
    dialog.appendChild(nextButton);
    let backButton = document.createElement('div');
    backButton.className = 'w3-button w3-blue w3-round w3-right';
    backButton.textContent = 'Back';
    backButton.style.marginTop = '10px';
    backButton.style.marginRight = '10px';
    backButton.style.display = 'none';
    dialog.appendChild(backButton);
    let cancelButton = document.createElement('div');
    cancelButton.className = 'w3-button w3-red w3-round w3-right';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.marginTop = '10px';
    cancelButton.style.marginRight = '10px';
    dialog.appendChild(cancelButton);
    let finishButton = document.createElement('div');
    finishButton.className = 'w3-button w3-green w3-round w3-right';
    finishButton.textContent = 'Finish';
    finishButton.style.marginTop = '10px';
    finishButton.style.marginRight = '10px';
    finishButton.style.display = 'none';
    dialog.appendChild(finishButton);
    let content = document.createElement('div');
    dialog.appendChild(content);
    let title = document.createElement('h3');
    title.textContent = abstract.name;
    content.appendChild(title);
    let description = document.createElement('p');
    description.textContent = abstract.description;
    content.appendChild(description);
    let form = document.createElement('form');
    content.appendChild(form);
    


}



export { createWizard }