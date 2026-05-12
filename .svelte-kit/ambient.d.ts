
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const __MISE_ORIG_PATH: string;
	export const npm_package_dependencies_zod: string;
	export const FUSION_ENVIRONMENT: string;
	export const KUBERNETES_SERVICE_PORT: string;
	export const KUBERNETES_PORT: string;
	export const AI_AGENT: string;
	export const npm_config_user_agent: string;
	export const NODE_VERSION: string;
	export const __MISE_SESSION: string;
	export const HOSTNAME: string;
	export const YARN_VERSION: string;
	export const GH_TOKEN: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_devDependencies_vite: string;
	export const npm_node_execpath: string;
	export const XDG_CACHE_HOME: string;
	export const SHLVL: string;
	export const npm_package_packageManager: string;
	export const MISE_DATA_DIR: string;
	export const MISE_CONFIG_DIR: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const COREPACK_ROOT: string;
	export const npm_package_dependencies_three: string;
	export const NODE_OPTIONS: string;
	export const __MISE_DIFF: string;
	export const npm_package_devDependencies_svelte_check: string;
	export const FUSION_ENV_ORIGIN: string;
	export const NPM_CONFIG_PROGRESS: string;
	export const npm_package_scripts_check: string;
	export const COREPACK_ENABLE_STRICT: string;
	export const npm_package_devDependencies_tailwindcss: string;
	export const npm_package_devDependencies_typescript: string;
	export const COMPOSER_HOME: string;
	export const npm_config_progress: string;
	export const COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
	export const npm_package_scripts_dev: string;
	export const npm_config_audit: string;
	export const COMPOSER_ALLOW_SUPERUSER: string;
	export const FORCE_COLOR: string;
	export const LOGNAME: string;
	export const npm_package_type: string;
	export const _: string;
	export const MISE_SHELL: string;
	export const npm_package_private: string;
	export const npm_package_devDependencies_autoprefixer: string;
	export const GOMODCACHE: string;
	export const npm_config_registry: string;
	export const TERM: string;
	export const KUBERNETES_PORT_443_TCP_ADDR: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const YARN_CACHE_FOLDER: string;
	export const UV_THREADPOOL_SIZE: string;
	export const __MISE_ZSH_CHPWD_RAN: string;
	export const npm_package_name: string;
	export const NODE: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const KUBERNETES_PORT_443_TCP_PORT: string;
	export const NPM_CONFIG_LOGLEVEL: string;
	export const npm_config_color: string;
	export const npm_config_frozen_lockfile: string;
	export const COMPOSER_CACHE_DIR: string;
	export const KUBERNETES_PORT_443_TCP_PROTO: string;
	export const MISE_INSTALL_PATH: string;
	export const MISE_CACHE_DIR: string;
	export const npm_config_fund: string;
	export const npm_config_loglevel: string;
	export const npm_lifecycle_script: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const SHELL: string;
	export const GOPATH: string;
	export const HOST: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const NODE_PATH: string;
	export const NPM_CONFIG_UPDATE_NOTIFIER: string;
	export const npm_package_scripts_build: string;
	export const npm_package_devDependencies_svelte: string;
	export const npm_package_dependencies__threlte_core: string;
	export const npm_config_update_notifier: string;
	export const NX_REJECT_UNKNOWN_LOCAL_CACHE: string;
	export const KUBERNETES_PORT_443_TCP: string;
	export const KUBERNETES_SERVICE_PORT_HTTPS: string;
	export const __MISE_ZSH_PRECMD_RUN: string;
	export const npm_package_dependencies__threlte_extras: string;
	export const npm_package_dependencies_jszip: string;
	export const KUBERNETES_SERVICE_HOST: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const npm_command: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const npm_package_scripts_preview: string;
	export const npm_package_devDependencies__types_three: string;
	export const NODE_ENV: string;
	export const NPM_CONFIG_COLOR: string;
	export const MISE_TRUSTED_CONFIG_PATHS: string;
	export const INIT_CWD: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		__MISE_ORIG_PATH: string;
		npm_package_dependencies_zod: string;
		FUSION_ENVIRONMENT: string;
		KUBERNETES_SERVICE_PORT: string;
		KUBERNETES_PORT: string;
		AI_AGENT: string;
		npm_config_user_agent: string;
		NODE_VERSION: string;
		__MISE_SESSION: string;
		HOSTNAME: string;
		YARN_VERSION: string;
		GH_TOKEN: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_devDependencies_vite: string;
		npm_node_execpath: string;
		XDG_CACHE_HOME: string;
		SHLVL: string;
		npm_package_packageManager: string;
		MISE_DATA_DIR: string;
		MISE_CONFIG_DIR: string;
		HOME: string;
		OLDPWD: string;
		COREPACK_ROOT: string;
		npm_package_dependencies_three: string;
		NODE_OPTIONS: string;
		__MISE_DIFF: string;
		npm_package_devDependencies_svelte_check: string;
		FUSION_ENV_ORIGIN: string;
		NPM_CONFIG_PROGRESS: string;
		npm_package_scripts_check: string;
		COREPACK_ENABLE_STRICT: string;
		npm_package_devDependencies_tailwindcss: string;
		npm_package_devDependencies_typescript: string;
		COMPOSER_HOME: string;
		npm_config_progress: string;
		COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
		npm_package_scripts_dev: string;
		npm_config_audit: string;
		COMPOSER_ALLOW_SUPERUSER: string;
		FORCE_COLOR: string;
		LOGNAME: string;
		npm_package_type: string;
		_: string;
		MISE_SHELL: string;
		npm_package_private: string;
		npm_package_devDependencies_autoprefixer: string;
		GOMODCACHE: string;
		npm_config_registry: string;
		TERM: string;
		KUBERNETES_PORT_443_TCP_ADDR: string;
		npm_config_node_gyp: string;
		PATH: string;
		YARN_CACHE_FOLDER: string;
		UV_THREADPOOL_SIZE: string;
		__MISE_ZSH_CHPWD_RAN: string;
		npm_package_name: string;
		NODE: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		KUBERNETES_PORT_443_TCP_PORT: string;
		NPM_CONFIG_LOGLEVEL: string;
		npm_config_color: string;
		npm_config_frozen_lockfile: string;
		COMPOSER_CACHE_DIR: string;
		KUBERNETES_PORT_443_TCP_PROTO: string;
		MISE_INSTALL_PATH: string;
		MISE_CACHE_DIR: string;
		npm_config_fund: string;
		npm_config_loglevel: string;
		npm_lifecycle_script: string;
		npm_package_devDependencies__sveltejs_kit: string;
		SHELL: string;
		GOPATH: string;
		HOST: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		NODE_PATH: string;
		NPM_CONFIG_UPDATE_NOTIFIER: string;
		npm_package_scripts_build: string;
		npm_package_devDependencies_svelte: string;
		npm_package_dependencies__threlte_core: string;
		npm_config_update_notifier: string;
		NX_REJECT_UNKNOWN_LOCAL_CACHE: string;
		KUBERNETES_PORT_443_TCP: string;
		KUBERNETES_SERVICE_PORT_HTTPS: string;
		__MISE_ZSH_PRECMD_RUN: string;
		npm_package_dependencies__threlte_extras: string;
		npm_package_dependencies_jszip: string;
		KUBERNETES_SERVICE_HOST: string;
		PWD: string;
		npm_execpath: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		npm_command: string;
		PNPM_SCRIPT_SRC_DIR: string;
		npm_package_scripts_preview: string;
		npm_package_devDependencies__types_three: string;
		NODE_ENV: string;
		NPM_CONFIG_COLOR: string;
		MISE_TRUSTED_CONFIG_PATHS: string;
		INIT_CWD: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
