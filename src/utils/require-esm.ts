export function requireEsm<T>(module: string): Promise<T> {
    return new Function('module', 'return import(module)')(module);
}