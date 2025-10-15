# Contributing

## Development Environment Setup

### Dependencies

#### Node

You will first need the right node version installed. The easiest
way to manage node is with [nvm](https://www.nvmnode.com/). You will
then need to enable corepack.

```shell
corepack enable
```

#### Docker

We will use [docker](https://www.docker.com/) for build.

#### Docker Compose

You will use [docker compose](https://docs.docker.com/compose/install) compose
for running our local environment services.

#### Terraform

You will need [terraform](https://developer.hashicorp.com/terraform) for configuring
the local environment. The best way to manage terraform environments is with
[tfswitch](https://tfswitch.warrensbox.com/). You will need to make sure that the terraform version matches the
version in [local-env-setup/main.tf](local-env-setup/main.tf).

### Install Application

We will use [pnpm](https://pnpm.io/) for package management.

```shell
pnpm install
```

### Start Local Services
There is a local environment that is used to create services for the application to connect to during development.
This environment uses plain text secrets and is not secure for deployment.

The local environment setup will require that docker and docker compose are installed. This is tested on linux. It
should work on other operating systems, but it is not tested.

```shell
pnpm setup-dev
```

However, managing the local environment does require some awareness of how the local setup works. You may need to
occasionally use terraform and docker compose to manually intervene.

The [local-env-setup/compose.yaml] is used to start the docker services using docker comose.
The [local-env-setup/main.tf]
file is used to configure the keycloak service after it starts up.

The setup script [scripts/setup-local-env.ts](scripts/setup-local-env.ts) also writes envrionment variables to
[.env.local](.env.local) which coorespond to the settings in the docker containers.
