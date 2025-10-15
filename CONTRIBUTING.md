# Contributing
This is an exciting and important project. Contributors are welcome! We need help. Don't be shy to contribute even if 
your skills don't perfectly align with the current stack. The reality is that modern frameworks and tooling evolves 
so fast that everyone is always learning new things. We can all learn new things together.  If you are flexible, 
eager to learn, have some technical coding background and align with the principles outlined in the 
[README.md](./README.md) your contributions will be greatly appreciated.

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

### NextAuth
[NextAuth](https://next-auth.js.org/) is used for authentication. NextAuth is a library for authenticating users in
Next.js applications.

### Tailwind CSS
[Tailwind CSS](https://tailwindcss.com/) is used for styling. Tailwind CSS is a utility first CSS framework.

## Security

Security consists of two components: authentication and authorization. In general, this application allows any public 
user to register their own credentials. However, entitlements must be granted by an administrator. 

### OAuth2
We use [OAuth2](https://oauth.net/2/) for authentication. OAuth2 is a protocol for authenticating users. We are using
the OAUth2 Authorization Code flow using a confidential client. This means that after authentication the token is 
stored on the server. By using OAuth2 we can configure the application with any identity provider. However, we may 
design out OAuth2 in the future in order to make a more compact application.

### Session Cookies
Client-to-server authentication is performed using short-lived session identifiers stored in HTTPOnly cookies rather
than storing OAuth tokens directly in the browser. This follows the Backend-for-Frontend (BFF) pattern recommended by
[RFC 9700 (OAuth 2.0 Security Best Current Practice)](https://datatracker.ietf.org/doc/html/rfc9700) and
[OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/).

By using a confidential OAuth client with server-side token storage, we avoid the security risks of storing tokens in
JavaScript-accessible browser storage (localStorage, sessionStorage). Browser-based storage is vulnerable to XSS
(Cross-Site Scripting) attacks where malicious JavaScript can steal tokens. HTTPOnly cookies cannot be accessed by
JavaScript, providing strong protection against token theft. While cookies are subject to CSRF (Cross-Site Request
Forgery) attacks, these are easier to mitigate through SameSite attributes and CSRF tokens, and are less severe than
XSS-based token theft because CSRF cannot read response data. The OAuth access and refresh tokens remain entirely
server-side, indexed by the session identifier, and are never exposed to the browser. 