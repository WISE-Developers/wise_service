# WISE Service (Alpha)

![Wise Logo](public/images/favicon-64.png)
This builds a stack of containers that provide basic fire modelling services. This is under heavy development, use this code at your own risk. This was built and tested on docker, it maybe works for me, Your milage may vary. When it is 100% working for me, I will do a release.

```mermaid
flowchart TD
  A{WISE Service Stack}
  A -->|Create| B[MAP UI]
  A -->|Build Dataset| G[DataSet Generator]
  A -->|Build Job| E[Builder]
  A -->|Execute Job| D[WISE]
  A -->|Watch Job| F[Job Monitor]
```

## Who needs this

This reporistory, will be very helpful for folks that want a system that just deploys quickly and just "works" with no tinkering. This implementation wont work for every use case but will demonstrate how to implement custom designed models, build them into modelling jobs, and how to run them and even debug them to some extent.

## Setup

### Clone the project to your docker host

```sh
git clone https://github.com/WISE-Developers/wise_service.git
```

### CD to the repo folder

```SH
cd wise_service
```

### Copy the sample.env to .env

```sh
cp sample.env .env
```

### Edit the .env file to suit

```SH
nano .env
```

### Deploy the stack

```SH
docker compose up -d
```

## Dependancies

This service stack depends on:

### WISE

![WISE Logo](public/images/favicon-64.png)

link: <https://github.com/WISE-Developers>

## Demo Data Set

The demo dataset included in this repo, is an invalid and outdated dataset, it should be used for demo purposes only. it is a 100m canada wide dataset for testing and development only.

This data set is not safe for use for real wildfire modelling, and you must use it at your own risk. Any use of this demo dataset constitutes acceptance of those conditions. This dataset cannot be used for any form of validation as this dataset contains invalid data.

### to setup and use the demo dataset

From the wise_service repo execute:

```BASH
bash buildSampleData.sh 
```
