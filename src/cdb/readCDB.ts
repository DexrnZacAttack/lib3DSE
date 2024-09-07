/*
 * Copyright (c) 2024 DexrnZacAttack
 * This file is part of lib3DSE.
 * https://github.com/DexrnZacAttack/lib3DSE
 *
 * Contributors:
 * - Anonymous941
 * - Offroaders123
 *
 * Licensed under the MIT License. See LICENSE file for details.
*/

import { bReader } from 'binaryio.js';
import { decompress } from 'nbtify';
import { Chunk, ChunkSection } from '../index.js';

type bReaderOptions = typeof bReader extends abstract new (dvRead: DataView, ...args: infer P) => bReader ? P : never;

// thx offroaders123!
/** Creates a bReader from a buffer */
function bReaderFromBuf(data: ArrayBufferView, ...args: bReaderOptions): bReader {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return new bReader(view, ...args);
}

// Massive thanks to Anonymous941 and Offroaders123 for helping out so much with all this!

/** Reads a CDB file and returns all chunks inside, does not return the extra data at the end though (yet) */
export async function readCDB(cdb: Uint8Array): Promise<Chunk[]> {

    /** Reader for the entire CDB file */
    const reader = bReaderFromBuf(cdb, true);

    const files: Uint8Array[] = [];
    const chunks: Chunk[] = [];

    // read initial stuff
    reader.readShort();
    reader.readShort();
    const initFileCount = reader.readUInt();
    reader.readUInt();
    const initFileSize = reader.readUInt();
    const pointerCount = reader.readUInt();
    reader.readUInt();

    for (let i = 0; i < pointerCount; i++) {
        reader.readUInt();
    }

    for (let i = 0; i < initFileCount; i++) {
        files.push(cdb.slice(i * initFileSize, i * initFileSize + initFileSize));
    }

    for (const file of files) {
        /** Reader for only one file of the cdb */
        const fReader = new bReader(new DataView(file.buffer), true);

        // smh I really need to finish my binary tools
        fReader.readShort();
        fReader.readShort();
        fReader.readUInt();
        fReader.readUInt();
        fReader.readUInt();
        fReader.readUInt();

        const magic = (fReader.readUInt()).toString(16);
        if (magic != "abcdef98")
            throw new TypeError(`Magic "${magic}" does not match expected magic "abcdef98"`);

        fReader.readUInt();
        fReader.readUInt();
        fReader.readUInt();

        const chunkSections: ChunkSection[] = [];

        for (var j = 0; j < 6; j++) {
            const index = fReader.readInt();
            const pos = fReader.readInt();
            const compressedSize = fReader.readInt();
            const decompressedSize = fReader.readInt();
            chunkSections.push({ index: index, position: pos, compressedSize: compressedSize, decompressedSize: decompressedSize });
        }

        for (const chunkSection of chunkSections) {
            // if any of these are -1 it means that they just don't exist lol
            if (chunkSection.index === -1 || chunkSection.position === -1) {
                continue;
            }

            // bad way of doing this lol
            const chunk = file.slice(chunkSection.position + 20, chunkSection.position + chunkSection.compressedSize + 20);

            // decompress
            const dcChunk = await decompress(chunk, "deflate");

            // push to the array
            chunks.push({ section: chunkSection, data: dcChunk });
        };
    };

    return chunks;
}
