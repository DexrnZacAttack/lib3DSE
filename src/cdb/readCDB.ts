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

import { bReader } from "D:/Projects/Dev/Web/BinaryIO/src/index.js";
import { readFileSync, writeFileSync } from "fs";
import { inflate } from "pako";

interface ChunkSection {
    index: number,
    compressedSize: number,
    decompressedSize: number
}

interface Chunk {
    index: number,
    size: number,
    data: Uint8Array
}

// Massive thanks to Anonymous941 for helping out so much with all this!

// welcome to pain

function readCDB(cdb: Uint8Array) {
    let loopCount = 0;

    const reader: bReader = new bReader(cdb, true);
    
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
    

    files.forEach(file => {
    loopCount++;
    const fReader = new bReader(file, true);
    console.log(fReader);
    fReader.readShort();
    fReader.readShort();
    const fileCount = fReader.readUInt();
    fReader.readUInt();
    const fileSize = fReader.readUInt();
    fReader.readUInt();

    const magic = (fReader.readUInt()).toString(16);
    if (magic != "abcdef98")
        throw new TypeError(`Magic "${magic}" does not match expected magic "abcdef98"`);


    fReader.readUInt();
    fReader.readUInt();
    fReader.readUInt();
    fReader.readUInt();

    const chunkSections: ChunkSection[] = [];

    for (var j = 0; j < 6; j++) {
        const index = fReader.readInt();
        const compressedSize = fReader.readInt();
        const decompressedSize = fReader.readInt();
        chunkSections.push({index, compressedSize, decompressedSize});
    }

    for (const chunkSection of chunkSections) {
        if (chunkSection.index === -1) {
            return;
        }

        console.log(chunkSection.index)
        fReader.setPos(chunkSection.index += 20)

        console.log(fReader.pos);

        const fullChunk = fReader.slice(fReader.pos, fReader.pos + initFileSize);
        const chunk = fullChunk.slice(0, chunkSection.compressedSize);
        const dcChunk = inflate(chunk);
        console.log(fReader.pos);
        chunks.push({ index: chunkSection.index, size: dcChunk.length, data: dcChunk })
    };
});
}

// this is just for testing
readCDB(readFileSync("../../testing/slt0.cdb"));