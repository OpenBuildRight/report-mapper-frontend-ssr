# Contributing
This is an exciting and important project. Contributors are welcome!

## Development Environment Setup
The development environment requires setting up the basic node tooling as
well as starting several other mock services for the application to connect to.

### Dependencies
The following dependencies are needed for local development environment setup. Follow the documentation 
for each tool.

#### Node

You will first need the right node version installed. The easiest
way to manage [Node](https://nodejs.org/en) is with [nvm](https://www.nvmnode.com/). You will
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

The setup script [scripts/setup-local-env.ts](scripts/setup-local-env.ts) also writes environment variables to
[.env.local](.env.local) which correspond to the settings in the docker containers.

## Technology Stack
This application uses the following primary components.

### Typescript
[Typescript](https://www.typescriptlang.org/) is used for the language. Typescript is a superset of javascript that
adds static typing to the language. Typescript is used for the backend and client side code.

### Node
[Node](https://nodejs.org/en) is used for the runtime. Node is a javascript runtime that is used for the backend.

### React
[React](https://reactjs.org/) is used for the frontend. React is a javascript library for building user interfaces.
React is used for the frontend.

### Next.js
[Next.js](https://nextjs.org/) is used for the framework. Next.js is a full stack framework used for the front end 
browser application and client side HTML rendering, server side HTML rendering and backend logic. Next.js abstracts
away much of the backend API using features such as 
[server side rendering](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering) and
[Server Actions](https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations),
as well as supporting serving normal REST API endpoints. We use server actions for all JSON serializable server to 
client communication. However, in cases such as image uploads we configure HTTP form uploads ourself for transferring 
the binary data.

### Tailwind CSS
[Tailwind CSS](https://tailwindcss.com/) is used for styling. Tailwind CSS is a utility first CSS framework.