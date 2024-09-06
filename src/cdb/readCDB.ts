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

import { bReader } from "binaryio.js";
import { readFileSync, write, writeFileSync } from "fs";
import { decompress } from "nbtify";

export interface ChunkSection {
    index: number,
    position: number,
    compressedSize: number,
    decompressedSize: number
}

export interface Chunk {
    index: number,
    size: number,
    data: Uint8Array
}

type bReaderOptions = typeof bReader extends abstract new (dvRead: DataView, ...args: infer P) => bReader ? P : never;

function bReaderFromBuf(data: ArrayBufferView, ...args: bReaderOptions): bReader {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return new bReader(view, ...args);
}

// Massive thanks to Anonymous941 and Offroaders123 for helping out so much with all this!

// welcome to pain

export async function readCDB(cdb: Uint8Array): Promise<Chunk[]> {
    let loopCount = 0;

    const reader: bReader = bReaderFromBuf(cdb, true);

    const chunks: Chunk[] = [];

    // read initial stuff
    reader.readShort();
    reader.readShort();
    const initFileCount = reader.readUInt();
    reader.readUInt();
    const initFileSize = reader.readUInt();
    reader.readUInt();

    console.log(initFileCount)

    const files: Uint8Array[] = [];

    console.log(initFileSize);

    for (let i = 0; i < initFileCount; i++) {
        files.push(cdb.slice(i * initFileSize, i * initFileSize + initFileSize));
    }

    await Promise.all(files.map(async file => {
        loopCount++;
        const fReader = bReaderFromBuf(file, true);
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
            console.log(fReader.pos);

            const chunkSections: ChunkSection[] = [];

            for (var j = 0; j < 6; j++) {
                const index = fReader.readInt();
                const pos = fReader.readInt();
                const compressedSize = fReader.readInt();
                const decompressedSize = fReader.readInt();
                chunkSections.push({ index: index, position: pos, compressedSize: compressedSize, decompressedSize: decompressedSize });
            }

            for (const chunkSection of chunkSections) {
                if (chunkSection.index === -1 || chunkSection.position === -1) {
                    return;
                }

                fReader.setPos(chunkSection.position - 0xC);

                const fullChunk = fReader.slice(fReader.pos, fReader.pos + initFileSize);
                const chunk = fullChunk.slice(0, chunkSection.compressedSize);
                const dcChunk = await decompress(new Uint8Array(chunk), "deflate");

                // debug
                writeFileSync(`../../testing/extract/chunk${loopCount}_.dat`, dcChunk)

                chunks.push({ index: chunkSection.index, size: dcChunk.length, data: dcChunk });
            };
    }));

    return chunks;
}

// this is just for testing
// readCDB(readFileSync("../../testing/slt0.cdb"));