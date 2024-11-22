// in the typescript context for the browser you must import the js file
import {createWizard} from './model_inputs.js';

// create a type for  each fire model
type FireModel = {
    name: string,
    filename: string,
    description: string
}

declare global {
    interface Window {
      w3_open: () => void;
      w3_close: () => void;
      fireModelsList: any;
    }
  }



const controls = function (fireModelsList: any) {
    console.log('controls.js');
    console.log('fireModelsList', fireModelsList);
    // grab a handle on the sidebar
    const sidebar = document.getElementById('mapSidebar');
    for (const fireModel of fireModelsList) {
        let basename = fireModel.filename;
        console.log(fireModel);
        // create a div element
        const div = document.createElement('div');
        div.id = basename + '-control';
        // add a class to the div
        div.className = 'w3-bar-item w3-button model-control';
        // add text to the div
        div.textContent = fireModel.name;
        // add the div to the sidebar
        if (sidebar) sidebar.appendChild(div);
        // create the description accordian
        //      <div id="Demo1" class="w3-container w3-hide">
        const description = document.createElement('div');
        description.id = basename + '-description';
        description.className = 'w3-container w3-hide model-description w3-light-blue';
        let descriptionText = document.createElement('p');
        descriptionText.textContent = fireModel.description;
        description.appendChild(descriptionText);
        // create a button element
        let modelButton = document.createElement('div');
        modelButton.className = 'w3-button w3-block w3-red w3-text-white w3-round';
        modelButton.textContent = 'Create Model';
        description.appendChild(modelButton);
        // add an event listener to the button
        modelButton.addEventListener('click', function () {
            console.log('create model', basename);
            // close the sidebar
            window.w3_close();
            let {dialog,stepDivs} = createWizard(fireModel);
            dialog.showModal();
            let currentStep = 0;
            stepDivs[currentStep].style.display = 'block';

        });





        if (sidebar) sidebar.appendChild(description);
        // add an event listener to the div
        div.addEventListener('click', function () {
            console.log('click', basename);
            // get the description element
            const description = document.getElementById(fireModel.filename + '-description');
            // if the description element exists
            if (description) {
                // if the description element is hidden
                if (description.classList.contains('w3-hide')) {
                    // remove the hidden class
                    description.classList.remove('w3-hide');
                } else {
                    // otherwise add the hidden class
                    description.classList.add('w3-hide');
                }
            }
        });
    }

}

    export { controls };
