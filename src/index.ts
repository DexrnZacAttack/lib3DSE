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

import { NBTData } from "nbtify";

export * from "./cdb/readCDB.js";

export interface ChunkSection {
    index: number,
    position: number,
    compressedSize: number,
    decompressedSize: number
}

export interface Chunk {
    section: ChunkSection,
    data: Uint8Array | NBTData
}