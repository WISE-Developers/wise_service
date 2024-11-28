#!/bin/bash

# Load configuration
if [ -f ./configVars.sh ]; then
  echo "Loading configVars.sh"
  . ./configVars.sh || { echo "Could not load configVars.sh"; exit 1; }
else
  echo "Could not find ./configVars.sh"; exit 1;
fi

# make the destination path by combining WISE_EXTERNAL_DATA_FOLDER + WISE_DATASET_FOLDER

# before we move on we must make sure that both inportant variuables are not empty
if [ -z "$WISE_EXTERNAL_DATA_FOLDER" ]; then
  echo "WISE_EXTERNAL_DATA_FOLDER is not set. Exiting."
  exit 1
fi

if [ -z "$WISE_DATASET_FOLDER" ]; then
  echo "WISE_DATASET_FOLDER is not set. Exiting."
  exit 1
fi



# Ensure the script exits on any error
set -e

# Combine the environment variables into a destination path
DESTINATION_PATH="${WISE_EXTERNAL_DATA_FOLDER}/${WISE_DATASET_FOLDER}/"

# Create the destination directory if it doesn't exist
mkdir -p "$DESTINATION_PATH"

# Print the destination path for debugging
echo "Destination path: $DESTINATION_PATH"




cat ./sample_data/wise_demo_data_part-* > ./sample_data/wise_demo_data.zip
unzip ./sample_data/wise_demo_data.zip -d $DESTINATION_PATH