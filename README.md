# WISE Service

![Wise Logo](public/images/favicon-64.png)
This builds a stack of containers that provide basic fire modelling services.
This was built and tested on docker, it works for me, Your milage may vary.

```mermaid
flowchart TD
  A{WISE Service Stack}
  A -->|Create| B[MAP UI]
  A -->|Cut Dataset| G[Cutter]
  A -->|Build Job| E[Builder]
  A -->|Execute Job| D[WISE]
  A -->|Watch Job| F[Job Monitor]
```

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
