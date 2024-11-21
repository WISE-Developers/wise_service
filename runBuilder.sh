#!/bin/bash

# Load configuration
if [ -f ./configVars.sh ]; then
  echo "Loading configVars.sh"
  . ./configVars.sh || { echo "Could not load configVars.sh"; exit 1; }
else
  echo "Could not find ./configVars.sh"; exit 1;
fi

# Set default value
: "${WISE_INTERNAL_JOBS_FOLDER:=./WISE_data/jobs/}"

echo "Success"
echo "Using folder: $WISE_INTERNAL_JOBS_FOLDER"
pwd
ls -lha
cp ./config.sample.json ${WISE_INTERNAL_JOBS_FOLDER}/config.json
cp ./defaults.sample.json ${WISE_INTERNAL_JOBS_FOLDER}/defaults.json
npm config set wise_js_api:job_directory=${WISE_INTERNAL_JOBS_FOLDER}
# Run commands, exit if they fail
npm run startBuilder && (tail -f /dev/null) || { echo "Failed to run command"; exit 1; }
#&& (node adminGUI.js) && (node results_server.js) || { echo "Failed to run command"; exit 1; }
