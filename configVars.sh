#!/bin/bash

# This is the script that defines everything in the automated process.
# we set everything into ENV vars.
pwd
# Read in and apply the .env file
set -o allexport
source .env
set +o allexport

#Which version of the installer to install from, these two should match
export WISE_INSTALL_VER=${WISE_INSTALL_VER:-'1.0.6-beta.5'}

export WISE_ENGINE_VERSION=${WISE_ENGINE_VERSION:-'1.0.6-beta.5'}

#Private (hiding in plain sight) link to a stored WISE debian library
export WISE_DISTRIBUTION_LINK=${WISE_ENGINE_INSTALLER:-"https://github.com/WISE-Developers/WISE_Application/releases/download/1.0.6-beta.5/wise-ubuntu2004-1.0.6-beta.5.deb"}

#Private (hiding in plain sight) link to a stored WISE builder .jar and library
export WISE_BUILDER_LINK=${WISE_BUILDER_ZIP:-"https://github.com/WISE-Developers/WISE_Builder_Component/releases/download/1.0.6-beta.5/WISE_Builder-1.0.6-beta.5.zip"}

#Private (hiding in plain sight) link to a stored WISE builder .jar and library
export WISE_JS_API_LINK=${WISE_JS_API:-"https://github.com/WISE-Developers/WISE_Builder_Component/releases/download/1.0.6-beta.5/WISE_Builder-1.0.6-beta.5.zip"}


#private dataset, not to be shared
export WISE_DATASET_LINK=${WISE_DATASET_LINK:-"https://www.spyd.com/images/dip_ds_july_28_2021.zip"}

# folder name for WISE Jobs in this continaer
export WISE_JOBS_FOLDER=jobs

export WISE_DATASET_FOLDER=

export WISE_DATA_FOLDER=WISE_data

# folder name for WISE Rain in this continaer
export WISE_RAIN_FOLDER=

export WISE_INTERNAL_DATA_FOLDER="/usr/src/app/${WISE_DATA_FOLDER}"
export WISE_EXTERNAL_DATA_FOLDER=${WISE_EXTERNAL_DATA_FOLDER} #/${WISE_DATA_FOLDER}
# make main data & jobs folder if it does not exist. 
#mkdir -p `${WISE_EXTERNAL_DATA_FOLDER}/${WISE_JOBS_FOLDER}`



# the folder INSIDE the container, perhpas mapped from host.

export WISE_INTERNAL_JOBS_FOLDER=$WISE_INTERNAL_DATA_FOLDER/$WISE_JOBS_FOLDER

# the folder on the host shared to the container. OR FALSE
export WISE_EXTERNAL_JOBS_FOLDER=$WISE_EXTERNAL_DATA_FOLDER/$WISE_JOBS_FOLDER 
export WISE_EXTERNAL_RAIN_FOLDER=$WISE_EXTERNAL_DATA_FOLDER/$WISE_RAIN_FOLDER 
export WISE_EXTERNAL_DATASET_FOLDER=$WISE_EXTERNAL_DATA_FOLDER/$WISE_DATASET_FOLDER 
# the folder in the container where rain data from forecasts is stored. OR FALSE
export WISE_INTERNAL_RAIN_FOLDER=$WISE_INTERNAL_DATA_FOLDER/$WISE_RAIN_FOLDER/ # must end in trailing slash
export WISE_PROJECT_JOBS_FOLDER=$WISE_INTERNAL_DATA_FOLDER/$WISE_JOBS_FOLDER/ # must end in trailing slash

#location of the binary executable
export CONTAINER_WISE_BIN_PATH=/usr/bin/wise


# which builder to use - this is for internal builder.
export WISE_BUILDER_HOST=127.0.0.1
export WISE_BUILDER_PORT=32479


# MQTT Configuration - the defaults are for NWT Private mqtt server.
export WISE_BUILDER_MQTT_HOST=${WISE_BUILDER_MQTT_HOST:-'WISEmqtt'}
export WISE_BUILDER_MQTT_PORT=${WISE_BUILDER_MQTT_PORT:-'1883'}
export WISE_BUILDER_MQTT_TOPIC=${WISE_BUILDER_MQTT_TOPIC:-'WISEPUBLIC'}
export WISE_BUILDER_MQTT_QOS=${WISE_BUILDER_MQTT_QOS:-1}

# Dataset Configuration "Used in conjunction with dip cutter, these files are written by the cutter."
export CONTAINER_DATASET_PATH=/usr/src/app/$WISE_DATA_FOLDER/$WISE_DATASET_FOLDER
export CONTAINER_DATASET_BBOXFILE=bbox.geoJson
export CONTAINER_DATASET_LUTFILE=dataset.lut
export CONTAINER_DATASET_PROJFILE=dataset.prj
export CONTAINER_DATASET_ELEVATION_RASTER=elevation.tif
export CONTAINER_DATASET_FUEL_RASTER=fuels.tif

# modelling defaults
export PERIMETER_DISPLAY_INTERVAL_HOURS=12 

