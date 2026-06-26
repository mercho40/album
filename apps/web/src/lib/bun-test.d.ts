// Shim de tipos para `bun:test` en el front.
//
// Los tests unitarios corren con `bun test`, que provee los tipos reales en
// runtime. Pero `svelte-check` (el type-checker del front) no conoce las APIs
// de Bun. En vez de importar todo `bun-types` —que metería globals de Bun
// (fetch, setTimeout, etc.) en un entorno DOM/SvelteKit y chocaría con los
// tipos del browser— declaramos solo el módulo `bun:test` con la superficie
// que usamos. Si un test usa un matcher nuevo, se agrega acá.

declare module "bun:test" {
	type TestFn = () => void | Promise<void>;

	export function describe(label: string, fn: () => void): void;
	export function it(label: string, fn: TestFn): void;
	export function test(label: string, fn: TestFn): void;
	export function beforeEach(fn: TestFn): void;
	export function afterEach(fn: TestFn): void;

	interface Matchers<T> {
		toBe(expected: T): void;
		toEqual(expected: unknown): void;
		toContain(expected: unknown): void;
		toThrow(expected?: unknown): void;
		toBeNull(): void;
		toBeUndefined(): void;
		toBeTruthy(): void;
		toBeFalsy(): void;
	}

	export function expect<T>(actual: T): Matchers<T> & { not: Matchers<T> };
}
