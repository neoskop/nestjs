


export function fletcher(input: string | Uint8Array): number {
    if (typeof input === 'string') {
        input = new Uint8Array(input.split('').map(c => c.charCodeAt(0)));
    }

    let s1 = 0, s2 = 0, l = input.length;

    for (let i = 0; i < l; ++i) {
        s1 = (s1 + input[i]) & 255;
        s2 = (s2 + s1) & 255;
    }

    return s2 << 8 | s1;
}