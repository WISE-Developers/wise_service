# WISE Service

This builds a stack of containers that provide basic fire modelling services.

```mermaid
flowchart TD

 C{fa:fa-cogs WISE Service Stack }
    C -->|Create| A[fa:fa-map MAP UI]
    C -->|Cut Dataset| G[fa:fa-scissors Cutter]
    C -->|Build Job| E[fa:fa-wrench Builder]
    C -->|Execute Job| D[fa:fa-play WISE]
    C -->|Watch Job| F[fa:fa-eye Job Monitor]
    ```
        