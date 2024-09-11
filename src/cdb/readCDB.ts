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
import { decompress, read } from 'nbtify';
import { Chunk, ChunkSection } from '../index.js';

// Massive thanks to Anonymous941 and Offroaders123 for helping out so much with all this!

/** Reads a CDB file and returns all chunks inside, does not return the extra data at the end though (yet) */
export async function readCDB(cdb: Uint8Array): Promise<Chunk[]> {
    const reader: bReader = new bReader(new DataView(cdb.buffer), true);

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

    const files: Uint8Array[] = [];

    for (let i = 0; i < initFileCount; i++) {
        files.push(cdb.slice(i * initFileSize, i * initFileSize + initFileSize));
    }

    for (const file of files) {
        const fReader = new bReader(file, true);
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
            if (chunkSection.index === -1 || chunkSection.position === -1) continue;

            const chunk = file.slice(chunkSection.position + 20, chunkSection.position + chunkSection.compressedSize + 20);
            const dcChunk = await decompress(chunk, "deflate");
            if ((dcChunk[0]! | (dcChunk[1]! << 8) | (dcChunk[2]! << 16) | (dcChunk[3]! << 24) >>> 0).toString(16) === "800000a") {
                chunks.push({ section: chunkSection, data: await read(dcChunk, { endian: 'little', strict: false }) });
            } else {
                chunks.push({ section: chunkSection, data: dcChunk });
            }

        };
    };

    return chunks;
}